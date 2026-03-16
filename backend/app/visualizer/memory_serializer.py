"""
Memory Serializer

Converts live Python objects into JSON-serializable snapshot data that the
frontend can use to render the visualization.

Key design decisions:
- Objects are tracked by their id() to detect reference sharing and cycles
- Heap objects (non-primitive) are stored separately from the stack
- Pointer relationships are extracted as a separate list for edge rendering
- Recursion is limited to avoid infinite loops with circular references
"""

from types import FrameType
from typing import Any, Dict, List, Set, Tuple


# Types that live on the "stack" (by value, not reference)
PRIMITIVE_TYPES = (int, float, bool, str, type(None), complex)

# Maximum depth for object serialization to prevent infinite recursion
MAX_DEPTH = 10

# Maximum number of elements to serialize in a list/dict
MAX_COLLECTION_SIZE = 50


class MemorySerializer:
    """
    Converts Python runtime objects into a serializable memory model.

    The model distinguishes between:
    - Stack variables: primitives shown inline in the frame
    - Heap objects: complex objects (lists, dicts, instances) stored by ID
    - Pointers: references from stack variables or object fields to heap objects
    """

    def __init__(self):
        self._heap: Dict[str, Dict] = {}
        self._pointers: List[Dict] = []
        self._visited: Set[int] = set()

    def collect_heap(self, frame: FrameType) -> Tuple[Dict, List]:
        """
        Walk all local variables in a frame and collect heap objects.

        Returns:
            heap: dict mapping object ID -> serialized object data
            pointers: list of {from, to, label} reference relationships
        """
        self._heap = {}
        self._pointers = []
        self._visited = set()

        # Walk all locals and collect any referenced heap objects
        for name, value in frame.f_locals.items():
            if name.startswith("__"):
                continue
            if not isinstance(value, PRIMITIVE_TYPES):
                obj_id = self._collect_object(value, depth=0)
                if obj_id:
                    self._pointers.append({
                        "from": f"stack:{frame.f_code.co_name}:{name}",
                        "to": obj_id,
                        "label": name,
                    })

        return dict(self._heap), list(self._pointers)

    def _collect_object(self, obj: Any, depth: int) -> str:
        """
        Recursively serialize an object to the heap.

        Returns the heap ID for this object, or None if it should be inline.
        """
        if depth > MAX_DEPTH:
            return None

        obj_id = str(id(obj))

        # Avoid infinite loops from circular references
        if obj_id in self._visited:
            return obj_id

        self._visited.add(obj_id)

        if isinstance(obj, list):
            serialized = self._serialize_list(obj, depth)
        elif isinstance(obj, dict):
            serialized = self._serialize_dict(obj, depth)
        elif isinstance(obj, tuple):
            serialized = self._serialize_tuple(obj, depth)
        elif isinstance(obj, set):
            serialized = self._serialize_set(obj, depth)
        elif hasattr(obj, "__dict__") and not isinstance(obj, type):
            serialized = self._serialize_instance(obj, depth)
        else:
            return None  # Unknown complex type - skip

        self._heap[obj_id] = serialized
        return obj_id

    def _serialize_list(self, lst: list, depth: int) -> Dict:
        """Serialize a Python list as an indexed array."""
        elements = []
        truncated = len(lst) > MAX_COLLECTION_SIZE

        for i, item in enumerate(lst[:MAX_COLLECTION_SIZE]):
            elem = self._serialize_element(item, depth, f"list:{id(lst)}[{i}]")
            elements.append({"index": i, "value": elem})

        return {
            "id": str(id(lst)),
            "type": "list",
            "length": len(lst),
            "elements": elements,
            "truncated": truncated,
        }

    def _serialize_dict(self, dct: dict, depth: int) -> Dict:
        """Serialize a Python dict as key-value pairs."""
        entries = []
        truncated = len(dct) > MAX_COLLECTION_SIZE

        for key, value in list(dct.items())[:MAX_COLLECTION_SIZE]:
            # Skip dunder keys
            str_key = str(key)
            if str_key.startswith("__"):
                continue
            val_elem = self._serialize_element(value, depth, f"dict:{id(dct)}[{str_key}]")
            entries.append({"key": str_key, "value": val_elem})

        return {
            "id": str(id(dct)),
            "type": "dict",
            "length": len(dct),
            "entries": entries,
            "truncated": truncated,
        }

    def _serialize_tuple(self, tpl: tuple, depth: int) -> Dict:
        """Serialize a Python tuple as an immutable indexed sequence."""
        elements = []
        for i, item in enumerate(tpl[:MAX_COLLECTION_SIZE]):
            elem = self._serialize_element(item, depth, f"tuple:{id(tpl)}[{i}]")
            elements.append({"index": i, "value": elem})

        return {
            "id": str(id(tpl)),
            "type": "tuple",
            "length": len(tpl),
            "elements": elements,
        }

    def _serialize_set(self, s: set, depth: int) -> Dict:
        """Serialize a Python set."""
        elements = []
        for item in list(s)[:MAX_COLLECTION_SIZE]:
            elem = self.serialize_value(item)
            elements.append(elem)

        return {
            "id": str(id(s)),
            "type": "set",
            "length": len(s),
            "elements": elements,
        }

    def _serialize_instance(self, obj: Any, depth: int) -> Dict:
        """
        Serialize a class instance by walking its __dict__.
        This handles custom objects like Node, TreeNode, Point, etc.
        """
        class_name = type(obj).__name__
        fields = {}

        for attr_name, attr_value in obj.__dict__.items():
            if attr_name.startswith("_"):
                continue
            try:
                field_elem = self._serialize_element(
                    attr_value, depth, f"obj:{id(obj)}.{attr_name}"
                )
                fields[attr_name] = field_elem
            except Exception:
                fields[attr_name] = {"type": "error", "repr": "<error>", "id": None}

        return {
            "id": str(id(obj)),
            "type": "instance",
            "class_name": class_name,
            "fields": fields,
        }

    def _serialize_element(self, value: Any, depth: int, context: str) -> Dict:
        """
        Serialize a value that may be either primitive (inline) or a heap ref.

        If the value is a complex object, it goes on the heap and we return
        a reference to it. Otherwise we return the value inline.
        """
        if isinstance(value, PRIMITIVE_TYPES):
            return self.serialize_value(value)

        obj_id = self._collect_object(value, depth + 1)
        if obj_id:
            # Record the pointer relationship
            self._pointers.append({
                "from": context,
                "to": obj_id,
                "label": None,
            })
            return {"type": "ref", "id": obj_id}

        return self.serialize_value(value)

    def serialize_value(self, value: Any) -> Dict:
        """
        Serialize a single Python value to a JSON-safe dict.
        Used for primitive values and simple representations.
        """
        if value is None:
            return {"type": "None", "repr": "None", "id": None}
        elif isinstance(value, bool):
            return {"type": "bool", "repr": str(value), "value": value, "id": None}
        elif isinstance(value, int):
            return {"type": "int", "repr": str(value), "value": value, "id": None}
        elif isinstance(value, float):
            return {"type": "float", "repr": str(round(value, 10)), "value": value, "id": None}
        elif isinstance(value, str):
            display = value if len(value) <= 100 else value[:97] + "..."
            return {"type": "str", "repr": f'"{display}"', "value": display, "id": None}
        elif isinstance(value, complex):
            return {"type": "complex", "repr": str(value), "id": None}
        elif isinstance(value, list):
            return {"type": "ref", "id": str(id(value))}
        elif isinstance(value, dict):
            return {"type": "ref", "id": str(id(value))}
        elif isinstance(value, tuple):
            return {"type": "ref", "id": str(id(value))}
        elif isinstance(value, set):
            return {"type": "ref", "id": str(id(value))}
        elif callable(value):
            name = getattr(value, "__name__", str(value))
            return {"type": "function", "repr": f"<function {name}>", "id": None}
        elif isinstance(value, type):
            return {"type": "class", "repr": f"<class '{value.__name__}'>", "id": None}
        elif hasattr(value, "__dict__"):
            return {"type": "ref", "id": str(id(value))}
        else:
            try:
                r = repr(value)
                if len(r) > 100:
                    r = r[:97] + "..."
                return {"type": "unknown", "repr": r, "id": None}
            except Exception:
                return {"type": "unknown", "repr": "<repr error>", "id": None}

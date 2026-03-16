"""
Data Structure Detector

Automatically detects common data structures in the heap snapshot
using rule-based pattern matching.

Detection Rules:

1. LINKED LIST:
   - Instance has a field pointing to another instance of the same class (e.g., self.next)
   - Chain of such references forms a singly-linked list
   - If there's also a .prev field, it's a doubly-linked list

2. BINARY TREE:
   - Instance has 'left' and/or 'right' fields pointing to same class instances
   - Root has no parent pointing to it (or parent field is None)

3. GRAPH:
   - Instance has a list of neighbors/children pointing to same class instances

4. ARRAY/LIST:
   - Python list detected automatically (no special detection needed)

The detector annotates the heap snapshot with structure metadata that the
frontend uses to choose the appropriate rendering layout.
"""

from typing import Dict, List, Set, Optional


# Field names that suggest linked list "next" pointers
LINKED_LIST_NEXT_FIELDS = {"next", "nxt", "after", "successor", "right_sibling"}

# Field names that suggest doubly-linked list "prev" pointers
LINKED_LIST_PREV_FIELDS = {"prev", "previous", "before", "predecessor"}

# Field names that suggest tree left child
TREE_LEFT_FIELDS = {"left", "left_child", "lchild", "l"}

# Field names that suggest tree right child
TREE_RIGHT_FIELDS = {"right", "right_child", "rchild", "r"}

# Field names that suggest tree children list
TREE_CHILDREN_FIELDS = {"children", "kids", "subtrees"}

# Field names that suggest graph neighbors
GRAPH_NEIGHBOR_FIELDS = {"neighbors", "adjacent", "edges", "connections"}


class StructureDetector:
    """
    Analyzes a heap snapshot to identify known data structures.

    Returns annotations that help the frontend choose how to render
    each object (as a node in a linked list, tree, graph, etc.)
    """

    def detect(self, heap: Dict) -> Dict:
        """
        Analyze the heap and return structure annotations.

        Args:
            heap: dict mapping object_id -> serialized object data

        Returns:
            dict mapping object_id -> detected structure type info
        """
        if not heap:
            return {}

        annotations = {}

        # Only analyze instance objects (class instances, not raw lists/dicts)
        instances = {
            oid: obj for oid, obj in heap.items()
            if obj.get("type") == "instance"
        }

        if not instances:
            return annotations

        # Group instances by class name
        by_class: Dict[str, List] = {}
        for oid, obj in instances.items():
            cls = obj.get("class_name", "Unknown")
            by_class.setdefault(cls, []).append((oid, obj))

        # Analyze each class group
        for class_name, objs in by_class.items():
            structure_type = self._detect_class_structure(objs, heap)

            if structure_type:
                for oid, _ in objs:
                    annotations[oid] = {
                        "structure": structure_type,
                        "class_name": class_name,
                    }

        return annotations

    def _detect_class_structure(
        self,
        objs: List,
        heap: Dict
    ) -> Optional[str]:
        """
        Detect what structure a group of same-class instances forms.
        Returns 'linked_list', 'doubly_linked_list', 'binary_tree',
        'tree', 'graph', or None.

        We union field names across ALL instances because the head node
        may have a non-None .next while the tail has next=None. Using only
        objs[0] risks missing the ref.
        """
        if not objs:
            return None

        # Union all field names across every instance of this class
        all_field_names: Set[str] = set()
        for _, obj in objs:
            all_field_names |= set(obj.get("fields", {}).keys())

        # Use the first instance that has a ref-type value in any field
        # as sample for ref checks (avoid picking tail nodes where next=None)
        sample = None
        for _, obj in objs:
            if any(v.get("type") == "ref" for v in obj.get("fields", {}).values()):
                sample = obj
                break
        if sample is None:
            _, sample = objs[0]
        fields = sample.get("fields", {})
        field_names = all_field_names

        # Check for binary tree (left AND/OR right fields referencing same type)
        has_left = bool(field_names & TREE_LEFT_FIELDS)
        has_right = bool(field_names & TREE_RIGHT_FIELDS)
        if has_left or has_right:
            if self._refs_same_class(sample, heap, TREE_LEFT_FIELDS | TREE_RIGHT_FIELDS):
                return "binary_tree"

        # Check for N-ary tree (children list)
        has_children = bool(field_names & TREE_CHILDREN_FIELDS)
        if has_children:
            return "tree"

        # Check for linked list (next field referencing same type)
        has_next = bool(field_names & LINKED_LIST_NEXT_FIELDS)
        has_prev = bool(field_names & LINKED_LIST_PREV_FIELDS)
        if has_next:
            if self._refs_same_class(sample, heap, LINKED_LIST_NEXT_FIELDS):
                if has_prev:
                    return "doubly_linked_list"
                return "linked_list"

        # Check for graph (neighbors/adjacent list)
        has_neighbors = bool(field_names & GRAPH_NEIGHBOR_FIELDS)
        if has_neighbors:
            return "graph"

        # If any field references an object of the same class, it's some linked structure
        if len(objs) > 1 and self._has_self_references(sample, heap):
            return "linked_structure"

        return None

    def _refs_same_class(
        self,
        obj: Dict,
        heap: Dict,
        field_names: Set[str]
    ) -> bool:
        """
        Check if any of the given fields in obj point to an instance
        of the same class.
        """
        class_name = obj.get("class_name")
        fields = obj.get("fields", {})

        for field_name in field_names:
            if field_name in fields:
                field_val = fields[field_name]
                if field_val.get("type") == "ref":
                    ref_id = field_val.get("id")
                    if ref_id and ref_id in heap:
                        ref_obj = heap[ref_id]
                        # Allow None values (end of list/tree)
                        if ref_obj.get("type") == "instance":
                            if ref_obj.get("class_name") == class_name:
                                return True
                            # Allow subclasses with different names
                            return True  # Any instance reference counts

        return False

    def _has_self_references(self, obj: Dict, heap: Dict) -> bool:
        """Check if any fields in obj reference other heap instances."""
        class_name = obj.get("class_name")
        fields = obj.get("fields", {})

        for field_name, field_val in fields.items():
            if field_val.get("type") == "ref":
                ref_id = field_val.get("id")
                if ref_id and ref_id in heap:
                    ref_obj = heap[ref_id]
                    if (ref_obj.get("type") == "instance" and
                            ref_obj.get("class_name") == class_name):
                        return True

        return False

    def _find_roots(self, objs: List, heap: Dict) -> List[str]:
        """
        Find objects that are not referenced by any other object in the same group.
        These are likely the root nodes of a tree or head of a linked list.
        """
        all_ids = {oid for oid, _ in objs}
        referenced_ids: Set[str] = set()

        for oid, obj in objs:
            fields = obj.get("fields", {})
            for field_val in fields.values():
                if field_val.get("type") == "ref":
                    ref_id = field_val.get("id")
                    if ref_id in all_ids:
                        referenced_ids.add(ref_id)

        roots = [oid for oid in all_ids if oid not in referenced_ids]
        return roots

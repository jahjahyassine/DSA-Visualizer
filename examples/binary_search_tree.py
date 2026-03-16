"""
Binary Search Tree Example
===========================
A BST where each node has .left and .right children.
The visualizer auto-detects this as a binary tree and
lays nodes out in a hierarchical diagram.

Step through slowly to watch:
- Node objects appear on the heap with left/right arrows
- The recursive insert calls stack up and unwind
- Tree structure build from root downward
"""

class BST_Node:
    def __init__(self, val):
        self.val = val
        self.left = None
        self.right = None


class BinarySearchTree:
    def __init__(self):
        self.root = None

    def insert(self, val):
        if self.root is None:
            self.root = BST_Node(val)
        else:
            self._insert(self.root, val)

    def _insert(self, node, val):
        if val < node.val:
            if node.left is None:
                node.left = BST_Node(val)
            else:
                self._insert(node.left, val)
        else:
            if node.right is None:
                node.right = BST_Node(val)
            else:
                self._insert(node.right, val)

    def search(self, val):
        return self._search(self.root, val)

    def _search(self, node, val):
        if node is None:
            return False
        if val == node.val:
            return True
        elif val < node.val:
            return self._search(node.left, val)
        else:
            return self._search(node.right, val)

    def inorder(self):
        result = []
        self._inorder(self.root, result)
        return result

    def _inorder(self, node, result):
        if node is None:
            return
        self._inorder(node.left, result)
        result.append(node.val)
        self._inorder(node.right, result)


# Build BST: insert values
bst = BinarySearchTree()
for val in [50, 30, 70, 20, 40, 60, 80]:
    bst.insert(val)

# In-order traversal gives sorted output
sorted_vals = bst.inorder()
print(f"Sorted: {sorted_vals}")

# Search
print(f"Found 40: {bst.search(40)}")
print(f"Found 55: {bst.search(55)}")

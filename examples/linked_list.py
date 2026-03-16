"""
Linked List Example
===================
Demonstrates a classic singly-linked list implementation.
The visualizer will detect the Node chain and render it
as a horizontal sequence of connected nodes with arrows.

Run this in the Code Visualizer and step through it to watch:
1. Each Node object appear on the heap
2. .next pointers connect as arrows between nodes
3. The 'current' pointer walk through the list
"""

class Node:
    def __init__(self, value):
        self.value = value
        self.next = None


class LinkedList:
    def __init__(self):
        self.head = None
        self.size = 0

    def append(self, value):
        new_node = Node(value)
        if self.head is None:
            self.head = new_node
        else:
            current = self.head
            while current.next is not None:
                current = current.next
            current.next = new_node
        self.size += 1

    def prepend(self, value):
        new_node = Node(value)
        new_node.next = self.head
        self.head = new_node
        self.size += 1

    def delete(self, value):
        if self.head is None:
            return
        if self.head.value == value:
            self.head = self.head.next
            self.size -= 1
            return
        current = self.head
        while current.next is not None:
            if current.next.value == value:
                current.next = current.next.next
                self.size -= 1
                return
            current = current.next

    def to_list(self):
        result = []
        current = self.head
        while current is not None:
            result.append(current.value)
            current = current.next
        return result


# Build the list
ll = LinkedList()
ll.append(10)
ll.append(20)
ll.append(30)
ll.prepend(5)

print(f"List: {ll.to_list()}")
print(f"Size: {ll.size}")

# Delete a node
ll.delete(20)
print(f"After deleting 20: {ll.to_list()}")

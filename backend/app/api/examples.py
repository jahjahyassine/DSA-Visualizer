"""
Example Programs

Pre-built example programs that demonstrate different visualization features.
These are served via the /api/examples endpoint and displayed in the frontend.
"""

PYTHON_EXAMPLES = [
    {
        "id": "variables",
        "name": "Variables & Arithmetic",
        "description": "Basic variable assignment and arithmetic operations",
        "code": """# Basic variables and arithmetic
x = 10
y = 3
z = x + y
name = "Alice"
pi = 3.14159
flag = True

result = x * y - z
print(f"Result: {result}")
print(f"Name: {name}")
"""
    },
    {
        "id": "lists",
        "name": "Lists & Iteration",
        "description": "Working with lists, indexing, and loops",
        "code": """# List operations
fruits = ["apple", "banana", "cherry"]
numbers = [1, 2, 3, 4, 5]

# Append to list
fruits.append("date")

# Access by index
first = fruits[0]
last = fruits[-1]

# Iterate
total = 0
for n in numbers:
    total = total + n

print(f"Fruits: {fruits}")
print(f"Total: {total}")
"""
    },
    {
        "id": "functions",
        "name": "Functions & Call Stack",
        "description": "Function calls and the call stack",
        "code": """# Functions and call stack visualization
def add(a, b):
    result = a + b
    return result

def multiply(x, y):
    product = x * y
    return product

def compute(n):
    doubled = add(n, n)
    tripled = multiply(n, 3)
    return doubled + tripled

answer = compute(5)
print(f"Answer: {answer}")
"""
    },
    {
        "id": "recursion",
        "name": "Recursion",
        "description": "Recursive function calls - watch the stack grow and shrink",
        "code": """# Recursive factorial - watch the call stack!
def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)

result = factorial(5)
print(f"5! = {result}")

# Fibonacci
def fib(n):
    if n <= 1:
        return n
    return fib(n-1) + fib(n-2)

print(f"fib(6) = {fib(6)}")
"""
    },
    {
        "id": "linked_list",
        "name": "Linked List",
        "description": "Manual linked list - see nodes and pointers",
        "code": """# Linked list with node objects
class Node:
    def __init__(self, value):
        self.value = value
        self.next = None

# Build: 1 -> 2 -> 3 -> None
head = Node(1)
second = Node(2)
third = Node(3)

head.next = second
second.next = third

# Traverse
current = head
while current is not None:
    print(f"Node value: {current.value}")
    current = current.next
"""
    },
    {
        "id": "binary_tree",
        "name": "Binary Tree",
        "description": "Binary tree structure with traversal",
        "code": """# Binary tree node
class TreeNode:
    def __init__(self, val):
        self.val = val
        self.left = None
        self.right = None

# Build a tree:
#       1
#      / \\
#     2   3
#    / \\
#   4   5

root = TreeNode(1)
root.left = TreeNode(2)
root.right = TreeNode(3)
root.left.left = TreeNode(4)
root.left.right = TreeNode(5)

# In-order traversal
def inorder(node):
    if node is None:
        return
    inorder(node.left)
    print(node.val)
    inorder(node.right)

inorder(root)
"""
    },
    {
        "id": "dictionaries",
        "name": "Dictionaries & Objects",
        "description": "Dictionaries and custom class instances",
        "code": """# Dictionaries and objects
person = {
    "name": "Alice",
    "age": 30,
    "city": "Paris"
}

# Modify dictionary
person["age"] = 31
person["job"] = "Engineer"

# Class instances
class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y
    
    def distance_from_origin(self):
        return (self.x**2 + self.y**2) ** 0.5

p1 = Point(3, 4)
p2 = Point(0, 0)

dist = p1.distance_from_origin()
print(f"Distance: {dist}")
print(f"Person: {person}")
"""
    },
    {
        "id": "stack_queue",
        "name": "Stack & Queue",
        "description": "Implementing stack and queue data structures",
        "code": """# Stack (LIFO) using a list
stack = []
stack.append(10)
stack.append(20)
stack.append(30)

top = stack.pop()
print(f"Popped: {top}")
print(f"Stack: {stack}")

# Queue (FIFO) using a list
from collections import deque
queue = deque()
queue.append("first")
queue.append("second")
queue.append("third")

front = queue.popleft()
print(f"Dequeued: {front}")
print(f"Queue: {list(queue)}")
"""
    },
    {
        "id": "sorting",
        "name": "Bubble Sort",
        "description": "Bubble sort algorithm - watch array mutations",
        "code": """# Bubble sort - watch the array change
def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr

numbers = [64, 34, 25, 12, 22, 11, 90]
print(f"Before: {numbers}")
sorted_nums = bubble_sort(numbers)
print(f"After:  {sorted_nums}")
"""
    },
]

"""
Recursive Algorithms Example
=============================
Shows how recursive calls build and unwind the call stack.
Watch the Stack panel on the left to see frames push and pop.

Includes:
- Fibonacci (exponential recursion)
- Merge sort (divide and conquer)
- Tower of Hanoi
"""

# ── Fibonacci ────────────────────────────────────────────────

def fib(n):
    """Recursive Fibonacci — watch the call stack grow deep."""
    if n <= 1:
        return n
    left = fib(n - 1)
    right = fib(n - 2)
    return left + right


print("=== Fibonacci ===")
for i in range(7):
    print(f"fib({i}) = {fib(i)}")


# ── Merge Sort ───────────────────────────────────────────────

def merge_sort(arr):
    """Merge sort — recursively splits then merges."""
    if len(arr) <= 1:
        return arr

    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])
    return merge(left, right)


def merge(left, right):
    result = []
    i = j = 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            result.append(left[i])
            i += 1
        else:
            result.append(right[j])
            j += 1
    result.extend(left[i:])
    result.extend(right[j:])
    return result


print("\n=== Merge Sort ===")
data = [38, 27, 43, 3, 9, 82, 10]
print(f"Before: {data}")
sorted_data = merge_sort(data)
print(f"After:  {sorted_data}")


# ── Tower of Hanoi ───────────────────────────────────────────

def hanoi(n, source, target, auxiliary):
    """Tower of Hanoi — classic recursion visualization."""
    if n == 1:
        print(f"Move disk 1 from {source} to {target}")
        return
    hanoi(n - 1, source, auxiliary, target)
    print(f"Move disk {n} from {source} to {target}")
    hanoi(n - 1, auxiliary, target, source)


print("\n=== Tower of Hanoi (3 disks) ===")
hanoi(3, "A", "C", "B")

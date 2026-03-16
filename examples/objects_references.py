"""
Object-Oriented Example
========================
Demonstrates class instances, shared references, and mutation.
Watch how multiple variables can point to the same heap object,
and how mutating one affects all references to it.
"""

class Vector:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def add(self, other):
        return Vector(self.x + other.x, self.y + other.y)

    def scale(self, factor):
        self.x *= factor
        self.y *= factor
        return self

    def magnitude(self):
        return (self.x ** 2 + self.y ** 2) ** 0.5

    def __repr__(self):
        return f"Vector({self.x}, {self.y})"


class Particle:
    def __init__(self, name, position, velocity):
        self.name = name
        self.position = position   # Vector object
        self.velocity = velocity   # Vector object
        self.history = []

    def update(self, dt=1.0):
        """Move particle by velocity * dt."""
        self.history.append(Vector(self.position.x, self.position.y))
        self.position.x += self.velocity.x * dt
        self.position.y += self.velocity.y * dt

    def __repr__(self):
        return f"Particle({self.name} @ {self.position})"


# Create particles
p1 = Particle("Alpha", Vector(0, 0), Vector(1, 2))
p2 = Particle("Beta",  Vector(5, 5), Vector(-1, 1))

# Shared reference: both share the same Vector instance
shared_vel = Vector(3, 3)
p3 = Particle("Gamma", Vector(10, 0), shared_vel)
p4 = Particle("Delta", Vector(10, 5), shared_vel)  # same velocity object!

# Step through time
print("=== Simulation ===")
for step in range(3):
    p1.update()
    p2.update()
    p3.update()
    p4.update()
    print(f"t={step+1}: {p1}, {p2}")

# Mutate shared velocity — affects BOTH p3 and p4
print(f"\nBefore scale: p3.vel={p3.velocity}, p4.vel={p4.velocity}")
shared_vel.scale(2)  # doubles the shared object
print(f"After scale:  p3.vel={p3.velocity}, p4.vel={p4.velocity}")

# p3.velocity is p4.velocity (same object in heap)
print(f"\nSame object? {p3.velocity is p4.velocity}")

/**
 * Graph Builder
 *
 * Converts an ExecutionStep's heap and pointer data into React Flow
 * nodes and edges that can be rendered in the visualization panel.
 *
 * Layout strategy:
 * - Stack frames appear as a column on the left
 * - Heap objects auto-layout using a simple grid system
 * - Detected structures (linked lists, trees) use specialized layouts
 */

import type { Node, Edge } from 'reactflow'
import type { ExecutionStep, HeapObject, StackFrame, StructureAnnotation } from '../types'

// ── Layout constants ──────────────────────────────────────────────────────────

const HEAP_START_X = 320
const HEAP_START_Y = 20
const HEAP_COL_GAP = 220
const HEAP_ROW_GAP = 160
const HEAP_COLS = 4

// ── Node type names (must match registered node types in ReactFlow) ───────────

export const NODE_TYPE_HEAP = 'heapNode'
export const NODE_TYPE_STACK = 'stackNode'

// ── Main builder function ─────────────────────────────────────────────────────

export function buildGraphFromStep(
  step: ExecutionStep,
  prevHeapIds: Set<string>
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = []
  const edges: Edge[] = []

  // Build heap nodes
  const heapIds = Object.keys(step.heap)
  heapIds.forEach((objId, index) => {
    const obj = step.heap[objId]
    const isNew = !prevHeapIds.has(objId)

    const { x, y } = computeHeapPosition(obj, objId, index, step)

    nodes.push({
      id: `heap_${objId}`,
      type: NODE_TYPE_HEAP,
      position: { x, y },
      data: {
        obj,
        isNew,
        structure: step.structures[objId] ?? null,
      },
      draggable: true,
    })
  })

  // Build edges from pointers
  step.pointers.forEach((ptr, i) => {
    // Only render heap-to-heap edges (from object fields)
    // Stack-to-heap pointers are shown in the stack frame UI
    if (ptr.from.startsWith('obj:') || ptr.from.startsWith('list:') ||
        ptr.from.startsWith('dict:') || ptr.from.startsWith('tuple:')) {
      const targetId = `heap_${ptr.to}`
      const sourceId = `heap_${extractObjId(ptr.from)}`

      if (!sourceId || !targetId) return
      if (!heapIds.includes(ptr.to)) return

      const existingSource = nodes.find(n => n.id === sourceId)
      if (!existingSource) return

      edges.push({
        id: `edge_${i}_${ptr.from}_${ptr.to}`,
        source: sourceId,
        target: targetId,
        label: ptr.label ?? undefined,
        animated: false,
        style: { stroke: '#58a6ff', strokeWidth: 1.5 },
        labelStyle: { fill: '#8b949e', fontSize: 10 },
        type: 'smoothstep',
      })
    }
  })

  return { nodes, edges }
}

/** Determine x/y position for a heap node */
function computeHeapPosition(
  obj: HeapObject,
  objId: string,
  index: number,
  step: ExecutionStep
): { x: number; y: number } {
  // Check if this node is part of a detected structure
  const annotation = step.structures[objId]

  if (annotation) {
    return computeStructurePosition(obj, objId, annotation, index, step)
  }

  // Default grid layout
  const col = index % HEAP_COLS
  const row = Math.floor(index / HEAP_COLS)

  return {
    x: HEAP_START_X + col * HEAP_COL_GAP,
    y: HEAP_START_Y + row * HEAP_ROW_GAP,
  }
}

/** Layout nodes that form a known structure */
function computeStructurePosition(
  obj: HeapObject,
  objId: string,
  annotation: StructureAnnotation,
  index: number,
  step: ExecutionStep
): { x: number; y: number } {
  const { structure } = annotation

  if (structure === 'linked_list' || structure === 'doubly_linked_list') {
    // Horizontal chain
    return {
      x: HEAP_START_X + index * 180,
      y: HEAP_START_Y + 20,
    }
  }

  if (structure === 'binary_tree') {
    // Simple BFS-like tree layout
    return computeTreePosition(objId, index, step)
  }

  // Fallback
  const col = index % HEAP_COLS
  const row = Math.floor(index / HEAP_COLS)
  return {
    x: HEAP_START_X + col * HEAP_COL_GAP,
    y: HEAP_START_Y + row * HEAP_ROW_GAP,
  }
}

/** Very simple tree layout: row based on depth */
function computeTreePosition(
  objId: string,
  index: number,
  step: ExecutionStep
): { x: number; y: number } {
  // Find depth by looking at pointer references
  let depth = 0
  let currentId = objId

  // Walk up the reference chain to estimate depth
  for (const ptr of step.pointers) {
    if (ptr.to === currentId && ptr.from.startsWith('obj:')) {
      depth++
      currentId = extractObjId(ptr.from)
      if (depth > 10) break
    }
  }

  const col = index % (HEAP_COLS * 2)
  return {
    x: HEAP_START_X + col * 140,
    y: HEAP_START_Y + depth * 120,
  }
}

/** Extract object ID from a "from" pointer string like "obj:12345.next" */
function extractObjId(from: string): string {
  if (from.startsWith('obj:')) {
    return from.replace('obj:', '').split('.')[0]
  }
  if (from.startsWith('list:')) {
    return from.replace('list:', '').split('[')[0]
  }
  if (from.startsWith('dict:')) {
    return from.replace('dict:', '').split('[')[0]
  }
  return from
}

/** Extract the set of heap IDs from a step, used for "isNew" detection */
export function getHeapIds(step: ExecutionStep | null): Set<string> {
  if (!step) return new Set()
  return new Set(Object.keys(step.heap))
}

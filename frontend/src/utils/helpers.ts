/**
 * General utility functions used across the frontend.
 */

import type { SerializedValue, HeapObject } from '../types'

/** Get a human-readable color class for a value type */
export function getTypeColor(type: string): string {
  const map: Record<string, string> = {
    int: 'text-blue-400',
    float: 'text-cyan-400',
    str: 'text-green-400',
    bool: 'text-yellow-400',
    None: 'text-gray-500',
    list: 'text-orange-400',
    dict: 'text-purple-400',
    tuple: 'text-amber-400',
    set: 'text-rose-400',
    instance: 'text-pink-400',
    ref: 'text-editor-accent',
    function: 'text-violet-400',
    class: 'text-indigo-400',
  }
  return map[type] ?? 'text-editor-text'
}

/** Get a background color for a heap object type */
export function getObjectBgColor(type: string): string {
  const map: Record<string, string> = {
    list: 'bg-orange-950/40 border-orange-800/50',
    dict: 'bg-purple-950/40 border-purple-800/50',
    tuple: 'bg-amber-950/40 border-amber-800/50',
    set: 'bg-rose-950/40 border-rose-800/50',
    instance: 'bg-pink-950/40 border-pink-800/50',
  }
  return map[type] ?? 'bg-editor-panel border-editor-border'
}

/** Format a serialized value for display */
export function formatValue(val: SerializedValue): string {
  if (!val) return 'undefined'
  if (val.type === 'None') return 'None'
  if (val.type === 'ref') return `→ ${val.id?.slice(-6)}`
  return val.repr ?? String(val.value ?? '')
}

/** Truncate a string to a max length */
export function truncate(s: string, max = 40): string {
  if (s.length <= max) return s
  return s.slice(0, max - 1) + '…'
}

/** Get the display label for a heap object */
export function getObjectLabel(obj: HeapObject): string {
  if (obj.type === 'instance') return obj.class_name ?? 'Object'
  if (obj.type === 'list') return `list[${obj.length ?? 0}]`
  if (obj.type === 'dict') return `dict{${obj.length ?? 0}}`
  if (obj.type === 'tuple') return `tuple(${obj.length ?? 0})`
  if (obj.type === 'set') return `set{${obj.length ?? 0}}`
  return obj.type
}

/** Get an icon for a heap object type */
export function getObjectIcon(type: string): string {
  const map: Record<string, string> = {
    list: '[ ]',
    dict: '{ }',
    tuple: '( )',
    set: '{ }',
    instance: '◆',
  }
  return map[type] ?? '?'
}

/** Get structure type label */
export function getStructureLabel(structure: string): string {
  const map: Record<string, string> = {
    linked_list: 'Linked List',
    doubly_linked_list: 'Doubly Linked List',
    binary_tree: 'Binary Tree',
    tree: 'Tree',
    graph: 'Graph',
    linked_structure: 'Linked Structure',
  }
  return map[structure] ?? structure
}

/** Clamp a number between min and max */
export function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max)
}

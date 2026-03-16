/**
 * HeapObjectNode
 *
 * A React Flow custom node that renders a single heap object.
 * Different object types (list, dict, instance) have different layouts.
 * 
 * Lists → indexed cells in a row
 * Dicts → key: value pairs
 * Instances → class name header + field table
 */

import { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import type { HeapObject, SerializedValue, StructureAnnotation } from '../../types'
import { getTypeColor, getObjectBgColor, formatValue, truncate, getStructureLabel } from '../../utils/helpers'

interface HeapNodeData {
  obj: HeapObject
  isNew: boolean
  structure: StructureAnnotation | null
}

export const HeapObjectNode = memo(function HeapObjectNode({ data }: NodeProps<HeapNodeData>) {
  const { obj, isNew, structure } = data

  return (
    <div
      className={`
        border rounded-lg text-xs min-w-[120px] max-w-[260px]
        ${getObjectBgColor(obj.type)}
        ${isNew ? 'animate-[nodeEntrance_0.3s_ease-out]' : ''}
        shadow-lg
      `}
    >
      {/* Handles for edges */}
      <Handle type="target" position={Position.Left} className="!bg-editor-accent !border-editor-bg !w-2 !h-2" />
      <Handle type="source" position={Position.Right} className="!bg-editor-accent !border-editor-bg !w-2 !h-2" />
      <Handle type="target" position={Position.Top} className="!bg-editor-accent !border-editor-bg !w-2 !h-2" id="top" />
      <Handle type="source" position={Position.Bottom} className="!bg-editor-accent !border-editor-bg !w-2 !h-2" id="bottom" />

      {/* Object header */}
      <div className="flex items-center justify-between px-2 py-1 border-b border-white/10">
        <div className="flex items-center gap-1.5">
          <ObjectTypeIcon type={obj.type} />
          <span className="font-medium text-[11px] text-white/80">
            {obj.type === 'instance' ? obj.class_name : obj.type}
          </span>
        </div>
        <span className="text-[9px] text-white/30 font-mono">
          id:{obj.id?.slice(-4)}
        </span>
      </div>

      {/* Structure badge */}
      {structure && (
        <div className="px-2 py-0.5 bg-editor-accent/10 border-b border-white/5">
          <span className="text-[9px] text-editor-accent">
            ◆ {getStructureLabel(structure.structure)}
          </span>
        </div>
      )}

      {/* Object content */}
      <div className="p-1.5">
        {obj.type === 'list' && <ListContent obj={obj} />}
        {obj.type === 'tuple' && <ListContent obj={obj} />}
        {obj.type === 'set' && <SetContent obj={obj} />}
        {obj.type === 'dict' && <DictContent obj={obj} />}
        {obj.type === 'instance' && <InstanceContent obj={obj} />}
      </div>
    </div>
  )
})

/** List/tuple: indexed cells */
function ListContent({ obj }: { obj: HeapObject }) {
  const items = obj.elements ?? []
  if (items.length === 0) {
    return <div className="text-white/30 italic text-[10px] px-1">empty</div>
  }

  return (
    <div className="flex flex-wrap gap-1">
      {items.map((item, i) => (
        <div key={i} className="flex flex-col items-center">
          <div
            className={`
              px-1.5 py-0.5 bg-editor-bg/60 border border-white/10 rounded
              font-mono text-[11px] min-w-[28px] text-center
              ${getTypeColor(item.value.type)}
            `}
          >
            {item.value.type === 'ref'
              ? <span className="text-editor-accent text-[10px]">→</span>
              : truncate(formatValue(item.value), 10)}
          </div>
          <div className="text-[9px] text-white/25 mt-0.5">{i}</div>
        </div>
      ))}
      {obj.truncated && (
        <div className="text-[10px] text-white/30 self-center">…</div>
      )}
    </div>
  )
}

/** Set: unindexed elements */
function SetContent({ obj }: { obj: HeapObject }) {
  const items = obj.elements ?? []
  if (items.length === 0) {
    return <div className="text-white/30 italic text-[10px] px-1">empty set</div>
  }
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((item, i) => (
        <div
          key={i}
          className={`px-1.5 py-0.5 bg-editor-bg/60 border border-white/10 rounded font-mono text-[11px] ${getTypeColor((item as SerializedValue).type)}`}
        >
          {formatValue(item as SerializedValue)}
        </div>
      ))}
    </div>
  )
}

/** Dict: key → value rows */
function DictContent({ obj }: { obj: HeapObject }) {
  const entries = obj.entries ?? []
  if (entries.length === 0) {
    return <div className="text-white/30 italic text-[10px] px-1">empty</div>
  }
  return (
    <div className="space-y-0.5">
      {entries.map((entry, i) => (
        <div key={i} className="flex items-center gap-1.5 font-mono">
          <span className="text-[10px] text-green-400 truncate max-w-[70px]">
            {truncate(entry.key, 12)}
          </span>
          <span className="text-white/30 text-[9px]">:</span>
          <span className={`text-[10px] truncate ${getTypeColor(entry.value.type)}`}>
            {entry.value.type === 'ref'
              ? <span className="text-editor-accent">→ ref</span>
              : truncate(formatValue(entry.value), 14)}
          </span>
        </div>
      ))}
      {obj.truncated && (
        <div className="text-[10px] text-white/30">…more</div>
      )}
    </div>
  )
}

/** Instance: class name + fields */
function InstanceContent({ obj }: { obj: HeapObject }) {
  const fields = obj.fields ?? {}
  const fieldEntries = Object.entries(fields)

  if (fieldEntries.length === 0) {
    return <div className="text-white/30 italic text-[10px] px-1">no fields</div>
  }

  return (
    <div className="space-y-0.5">
      {fieldEntries.map(([name, val]) => (
        <div key={name} className="flex items-center gap-1.5 font-mono">
          <span className="text-[10px] text-orange-300 shrink-0">
            {truncate(name, 10)}
          </span>
          <span className="text-white/30 text-[9px]">=</span>
          <span className={`text-[10px] truncate ${getTypeColor(val.type)}`}>
            {val.type === 'ref'
              ? <span className="text-editor-accent">→ obj</span>
              : val.type === 'None'
              ? <span className="text-gray-500">None</span>
              : truncate(formatValue(val), 14)}
          </span>
        </div>
      ))}
    </div>
  )
}

/** Icon for object type */
function ObjectTypeIcon({ type }: { type: string }) {
  const icons: Record<string, string> = {
    list: '[ ]',
    tuple: '( )',
    set: '{ }',
    dict: '{ }',
    instance: '◆',
  }
  const colors: Record<string, string> = {
    list: 'text-orange-400',
    tuple: 'text-amber-400',
    set: 'text-rose-400',
    dict: 'text-purple-400',
    instance: 'text-pink-400',
  }
  return (
    <span className={`text-[10px] font-mono ${colors[type] ?? 'text-white/50'}`}>
      {icons[type] ?? '?'}
    </span>
  )
}

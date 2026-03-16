/**
 * CallStackPanel
 *
 * Renders the call stack frames on the left side of the visualization.
 * Shows each frame as a card with its local variables.
 * The active (topmost) frame is highlighted.
 *
 * Stack grows downward to match how most debuggers display it.
 */

import { ChevronRight } from 'lucide-react'
import type { ExecutionStep, StackFrame, SerializedValue } from '../../types'
import { getTypeColor, formatValue, truncate } from '../../utils/helpers'

interface Props {
  step: ExecutionStep
}

export function CallStackPanel({ step }: Props) {
  const frames = step.stack_frames ?? []

  return (
    <div className="p-2 space-y-2">
      {/* Panel title */}
      <div className="text-[10px] font-semibold text-editor-comment uppercase tracking-wider px-1 pt-1">
        Call Stack
      </div>

      {frames.length === 0 ? (
        <div className="text-xs text-editor-comment italic px-1">No frames</div>
      ) : (
        [...frames].reverse().map((frame, i) => (
          <FrameCard
            key={`${frame.func_name}-${i}`}
            frame={frame}
            isActive={i === 0}
            depth={frames.length - 1 - i}
          />
        ))
      )}
    </div>
  )
}

interface FrameCardProps {
  frame: StackFrame
  isActive: boolean
  depth: number
}

function FrameCard({ frame, isActive, depth }: FrameCardProps) {
  const locals = Object.entries(frame.locals)

  return (
    <div
      className={`
        rounded border text-xs overflow-hidden transition-all
        ${isActive
          ? 'border-editor-accent/50 bg-editor-accent/5'
          : 'border-editor-border/50 bg-editor-bg/30'
        }
      `}
    >
      {/* Frame header */}
      <div
        className={`
          flex items-center gap-1.5 px-2 py-1.5
          ${isActive ? 'bg-editor-accent/10' : 'bg-editor-bg/20'}
        `}
      >
        {isActive && (
          <ChevronRight size={10} className="text-editor-accent shrink-0" />
        )}
        <span
          className={`font-medium truncate ${isActive ? 'text-editor-accent' : 'text-editor-comment'}`}
        >
          {frame.func_name === '<module>' ? '(module)' : `${frame.func_name}()`}
        </span>
        <span className="ml-auto text-[9px] text-white/25 shrink-0">
          :{frame.line}
        </span>
      </div>

      {/* Local variables */}
      {locals.length > 0 && (
        <div className="px-2 py-1.5 space-y-1 font-mono">
          {locals.map(([name, val]) => (
            <LocalVar key={name} name={name} value={val} />
          ))}
        </div>
      )}

      {locals.length === 0 && (
        <div className="px-2 py-1 text-[10px] text-white/20 italic">
          no locals
        </div>
      )}
    </div>
  )
}

function LocalVar({ name, value }: { name: string; value: SerializedValue }) {
  const isRef = value.type === 'ref'

  return (
    <div className="flex items-baseline gap-1.5 min-w-0">
      {/* Variable name */}
      <span className="text-[10px] text-orange-300 shrink-0 truncate max-w-[60px]">
        {truncate(name, 10)}
      </span>

      <span className="text-white/25 text-[9px]">=</span>

      {/* Value */}
      {isRef ? (
        <span className="text-editor-accent text-[10px]">
          → <span className="text-white/30 text-[9px]">{value.id?.slice(-6)}</span>
        </span>
      ) : (
        <span className={`text-[10px] truncate ${getTypeColor(value.type)}`}>
          {truncate(formatValue(value), 16)}
        </span>
      )}
    </div>
  )
}

/**
 * StepInfoBadge
 *
 * Shows contextual info about the current execution step:
 * - Event type (line, call, return, exception)
 * - Function name
 * - Return value (if it's a return step)
 */

import type { ExecutionStep } from '../../types'
import { formatValue } from '../../utils/helpers'

interface Props {
  step: ExecutionStep
}

const EVENT_COLORS: Record<string, string> = {
  line: 'text-blue-400 bg-blue-400/10',
  call: 'text-green-400 bg-green-400/10',
  return: 'text-yellow-400 bg-yellow-400/10',
  exception: 'text-red-400 bg-red-400/10',
  error: 'text-red-400 bg-red-400/10',
}

const EVENT_LABELS: Record<string, string> = {
  line: '→ line',
  call: '↓ call',
  return: '↑ return',
  exception: '✗ exception',
  error: '✗ error',
}

export function StepInfoBadge({ step }: Props) {
  const color = EVENT_COLORS[step.event] ?? 'text-editor-comment bg-editor-border'
  const label = EVENT_LABELS[step.event] ?? step.event

  return (
    <div className="flex items-center gap-2 text-[11px]">
      {/* Event type badge */}
      <span className={`px-1.5 py-0.5 rounded font-mono font-medium ${color}`}>
        {label}
      </span>

      {/* Function context */}
      <span className="text-editor-comment font-mono">
        {step.func_name === '<module>' ? '<module>' : `${step.func_name}()`}
      </span>

      {/* Line number */}
      <span className="text-white/30 font-mono">
        line {step.line}
      </span>

      {/* Return value */}
      {step.event === 'return' && step.return_value && (
        <span className="text-yellow-400 font-mono">
          → {formatValue(step.return_value)}
        </span>
      )}

      {/* Exception info */}
      {step.event === 'exception' && step.exception && (
        <span className="text-red-400">
          {step.exception.type}: {step.exception.message}
        </span>
      )}
    </div>
  )
}

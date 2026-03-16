/**
 * OutputPanel
 *
 * Shows the accumulated stdout output up to the current step.
 * Also shows error messages when execution fails.
 */

import { Terminal, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'

export function OutputPanel() {
  const { currentStepData, result, error, showOutput, setShowOutput } = useAppStore()
  const step = currentStepData()

  const stdout = step?.stdout ?? ''
  const hasOutput = stdout.trim().length > 0
  const hasError = !!error || step?.event === 'error' || step?.event === 'exception'

  // Don't render if nothing to show
  if (!result && !error) return null

  return (
    <div className="border-t border-editor-border bg-editor-panel shrink-0" style={{ maxHeight: '180px' }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-1.5 cursor-pointer hover:bg-editor-border/30 transition-colors"
        onClick={() => setShowOutput(!showOutput)}
      >
        <div className="flex items-center gap-2">
          {hasError ? (
            <AlertCircle size={13} className="text-red-400" />
          ) : (
            <Terminal size={13} className="text-editor-comment" />
          )}
          <span className="text-xs font-medium text-editor-comment uppercase tracking-wider">
            {hasError ? 'Error' : 'Output'}
          </span>
          {hasOutput && !hasError && (
            <span className="text-[10px] text-editor-comment/60">
              {stdout.split('\n').filter(Boolean).length} line(s)
            </span>
          )}
        </div>
        {showOutput ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
      </div>

      {/* Content */}
      {showOutput && (
        <div className="overflow-y-auto font-mono text-xs px-3 pb-3" style={{ maxHeight: '140px' }}>
          {/* Error message */}
          {error && (
            <div className="text-red-400 whitespace-pre-wrap leading-relaxed">
              {error}
            </div>
          )}

          {/* Exception in step */}
          {step?.event === 'exception' && step.exception && (
            <div className="text-red-400">
              <span className="text-red-300 font-semibold">{step.exception.type}: </span>
              {step.exception.message}
            </div>
          )}

          {/* Stdout */}
          {stdout ? (
            <div className="text-green-400 whitespace-pre-wrap leading-relaxed">
              {stdout}
            </div>
          ) : !error ? (
            <div className="text-editor-comment italic">No output yet</div>
          ) : null}
        </div>
      )}
    </div>
  )
}

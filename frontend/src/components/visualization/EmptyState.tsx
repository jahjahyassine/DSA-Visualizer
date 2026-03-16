/**
 * EmptyState
 *
 * Shown in the visualization panel when no code has been run yet.
 */

import { Play, ArrowRight } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'

export function EmptyState() {
  const { run, isRunning } = useAppStore()

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8 text-center">
      {/* Illustration */}
      <div className="relative">
        <div className="w-20 h-20 rounded-2xl bg-editor-panel border border-editor-border flex items-center justify-center">
          <div className="space-y-1.5">
            <div className="flex gap-1">
              <div className="w-3 h-1.5 rounded-sm bg-editor-keyword/60" />
              <div className="w-5 h-1.5 rounded-sm bg-editor-var/60" />
              <div className="w-2 h-1.5 rounded-sm bg-white/20" />
            </div>
            <div className="flex gap-1 pl-2">
              <div className="w-4 h-1.5 rounded-sm bg-editor-string/60" />
              <div className="w-3 h-1.5 rounded-sm bg-white/20" />
            </div>
            <div className="flex gap-1">
              <div className="w-6 h-1.5 rounded-sm bg-editor-func/60" />
              <div className="w-2 h-1.5 rounded-sm bg-white/20" />
            </div>
          </div>
        </div>

        {/* Arrow */}
        <div className="absolute -right-6 top-1/2 -translate-y-1/2 text-editor-comment">
          <ArrowRight size={16} />
        </div>

        {/* Memory box */}
        <div className="absolute -right-14 top-1/2 -translate-y-1/2">
          <div className="w-12 h-8 rounded border border-editor-accent/40 bg-editor-accent/5 flex items-center justify-center">
            <div className="space-y-1">
              <div className="w-6 h-1 rounded-sm bg-editor-accent/40" />
              <div className="w-4 h-1 rounded-sm bg-editor-accent/25" />
            </div>
          </div>
        </div>
      </div>

      {/* Text */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-editor-text">
          Ready to Visualize
        </h3>
        <p className="text-sm text-editor-comment max-w-xs leading-relaxed">
          Write or paste Python code on the left, then click Run to see
          variables, objects, and memory come to life.
        </p>
      </div>

      {/* CTA */}
      <button onClick={run} disabled={isRunning} className="btn-primary">
        <Play size={14} fill="currentColor" />
        Run Code
      </button>

      {/* Keyboard hint */}
      <div className="text-xs text-editor-comment/60">
        Or press <kbd className="px-1 py-0.5 bg-editor-border rounded text-[10px]">Ctrl</kbd>+
        <kbd className="px-1 py-0.5 bg-editor-border rounded text-[10px]">Enter</kbd>
      </div>
    </div>
  )
}

/**
 * Timeline
 *
 * Bottom panel showing the execution timeline.
 * Users can scrub through steps by dragging/clicking the timeline bar.
 * Each step is represented as a tick mark colored by event type.
 */

import { useRef, useCallback } from 'react'
import { useAppStore } from '../../store/useAppStore'
import type { ExecutionStep } from '../../types'

const EVENT_COLORS: Record<string, string> = {
  line: '#58a6ff',
  call: '#3fb950',
  return: '#d29922',
  exception: '#f85149',
  error: '#f85149',
}

export function Timeline() {
  const { result, currentStep, goToStep, totalSteps, autoPlay, toggleAutoPlay } = useAppStore()
  const trackRef = useRef<HTMLDivElement>(null)
  const steps = result?.steps ?? []
  const total = totalSteps()

  const handleTrackClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current || total === 0) return
    const rect = trackRef.current.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const targetStep = Math.round(ratio * (total - 1))
    goToStep(targetStep)
  }, [total, goToStep])

  const handleTrackDrag = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.buttons !== 1) return
    handleTrackClick(e)
  }, [handleTrackClick])

  if (!result) return null

  const progress = total > 1 ? (currentStep / (total - 1)) * 100 : 0

  return (
    <div className="border-t border-editor-border bg-editor-panel px-4 py-2 shrink-0">
      <div className="flex items-center gap-3">
        {/* Step label */}
        <div className="text-xs font-mono text-editor-comment shrink-0 w-20">
          Step {currentStep + 1}/{total}
        </div>

        {/* Timeline track */}
        <div
          ref={trackRef}
          className="relative flex-1 h-6 flex items-center cursor-pointer group"
          onClick={handleTrackClick}
          onMouseMove={handleTrackDrag}
        >
          {/* Background track */}
          <div className="absolute w-full h-1.5 bg-editor-border rounded-full" />

          {/* Progress fill */}
          <div
            className="absolute h-1.5 bg-editor-accent/50 rounded-full transition-none"
            style={{ width: `${progress}%` }}
          />

          {/* Step ticks — render a subset for performance */}
          {total <= 500 && steps.map((step, i) => (
            <StepTick
              key={i}
              step={step}
              index={i}
              total={total}
              isCurrent={i === currentStep}
            />
          ))}

          {/* Scrubber thumb */}
          <div
            className="absolute w-3 h-3 bg-editor-accent rounded-full border-2 border-editor-bg
                        shadow-lg transition-none -translate-x-1/2 group-hover:scale-125 transition-transform"
            style={{ left: `${progress}%` }}
          />
        </div>

        {/* Current step event info */}
        <div className="text-[10px] font-mono shrink-0 w-28 text-right">
          {result.steps[currentStep] && (
            <StepEventLabel step={result.steps[currentStep]} />
          )}
        </div>
      </div>

      {/* Speed control when auto-playing */}
      {autoPlay && <SpeedControl />}
    </div>
  )
}

interface StepTickProps {
  step: ExecutionStep
  index: number
  total: number
  isCurrent: boolean
}

function StepTick({ step, index, total, isCurrent }: StepTickProps) {
  const pct = total > 1 ? (index / (total - 1)) * 100 : 0
  const color = EVENT_COLORS[step.event] ?? '#484f58'

  return (
    <div
      className={`absolute -translate-x-1/2 transition-all ${isCurrent ? 'z-10' : 'z-0'}`}
      style={{ left: `${pct}%` }}
      title={`Step ${index + 1}: ${step.event} at line ${step.line}`}
    >
      <div
        className={`rounded-full ${isCurrent ? 'w-2 h-3' : 'w-0.5 h-2'} transition-all`}
        style={{ backgroundColor: isCurrent ? color : color + '80' }}
      />
    </div>
  )
}

function StepEventLabel({ step }: { step: ExecutionStep }) {
  const color = EVENT_COLORS[step.event] ?? '#8b949e'
  return (
    <span style={{ color }} className="font-medium">
      {step.event} · L{step.line}
    </span>
  )
}

function SpeedControl() {
  const { autoPlaySpeed, setAutoPlaySpeed } = useAppStore()

  const speeds = [
    { label: '0.5×', ms: 1200 },
    { label: '1×', ms: 600 },
    { label: '2×', ms: 300 },
    { label: '4×', ms: 150 },
  ]

  return (
    <div className="flex items-center gap-2 mt-1.5">
      <span className="text-[10px] text-editor-comment">Speed:</span>
      {speeds.map(s => (
        <button
          key={s.ms}
          onClick={() => setAutoPlaySpeed(s.ms)}
          className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${
            autoPlaySpeed === s.ms
              ? 'bg-editor-accent text-white'
              : 'text-editor-comment hover:text-editor-text hover:bg-editor-border'
          }`}
        >
          {s.label}
        </button>
      ))}
    </div>
  )
}

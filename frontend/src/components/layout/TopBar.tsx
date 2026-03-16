/**
 * TopBar
 *
 * The main toolbar at the top of the application.
 * Contains: language selector, example picker, run/step controls.
 */

import { Play, SkipBack, SkipForward, ChevronLeft, ChevronRight,
         RotateCcw, BookOpen, Loader2, Pause } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { ExamplePicker } from './ExamplePicker'

export function TopBar() {
  const {
    language, setLanguage, languages,
    run, reset, stepForward, stepBackward,
    goToStart, goToEnd, toggleAutoPlay,
    canStepForward, canStepBackward,
    isRunning, result, autoPlay,
    currentStep, totalSteps,
  } = useAppStore()

  const hasResult = result !== null
  const stepCount = totalSteps()
  const displayStep = hasResult ? currentStep + 1 : 0

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-editor-panel border-b border-editor-border shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 mr-2">
        <div className="w-7 h-7 rounded bg-editor-accent/20 border border-editor-accent/40 flex items-center justify-center">
          <span className="text-editor-accent text-xs font-bold font-mono">CV</span>
        </div>
        <span className="text-sm font-semibold text-editor-text hidden sm:block">
          Code Visualizer
        </span>
      </div>

      <div className="h-5 w-px bg-editor-border" />

      {/* Language Selector */}
      <div className="flex items-center gap-2">
        <select
          value={language}
          onChange={e => setLanguage(e.target.value)}
          className="bg-editor-border text-editor-text text-sm rounded px-2 py-1 border border-transparent
                     focus:border-editor-accent focus:outline-none cursor-pointer"
        >
          {languages.length > 0 ? (
            languages.map(lang => (
              <option key={lang.id} value={lang.id} disabled={!lang.supported}>
                {lang.name}{!lang.supported ? ' (soon)' : ''}
              </option>
            ))
          ) : (
            <option value="python">Python 3</option>
          )}
        </select>
      </div>

      {/* Examples */}
      <ExamplePicker />

      <div className="h-5 w-px bg-editor-border" />

      {/* Run Button */}
      <button
        onClick={run}
        disabled={isRunning}
        className="btn-primary"
        title="Run code (Ctrl+Enter)"
      >
        {isRunning ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Play size={14} fill="currentColor" />
        )}
        <span>{isRunning ? 'Running…' : 'Run'}</span>
      </button>

      {/* Step Controls — only shown when there's a result */}
      {hasResult && (
        <>
          <div className="h-5 w-px bg-editor-border" />

          {/* Go to start */}
          <button
            onClick={goToStart}
            disabled={!canStepBackward()}
            className="btn-ghost"
            title="Go to start (Home)"
          >
            <SkipBack size={14} />
          </button>

          {/* Step backward */}
          <button
            onClick={stepBackward}
            disabled={!canStepBackward()}
            className="btn-secondary"
            title="Step backward (←)"
          >
            <ChevronLeft size={14} />
            <span className="hidden sm:inline">Back</span>
          </button>

          {/* Step counter */}
          <div className="text-xs text-editor-comment font-mono bg-editor-bg px-2 py-1 rounded min-w-[72px] text-center">
            {displayStep} / {stepCount}
          </div>

          {/* Step forward */}
          <button
            onClick={stepForward}
            disabled={!canStepForward()}
            className="btn-secondary"
            title="Step forward (→)"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight size={14} />
          </button>

          {/* Go to end */}
          <button
            onClick={goToEnd}
            disabled={!canStepForward()}
            className="btn-ghost"
            title="Go to end (End)"
          >
            <SkipForward size={14} />
          </button>

          <div className="h-5 w-px bg-editor-border" />

          {/* Auto-play toggle */}
          <button
            onClick={toggleAutoPlay}
            className={autoPlay ? 'btn-primary' : 'btn-ghost'}
            title="Toggle auto-play (Space)"
          >
            {autoPlay ? <Pause size={14} /> : <Play size={14} />}
            <span className="hidden sm:inline">{autoPlay ? 'Pause' : 'Play'}</span>
          </button>
        </>
      )}

      {/* Reset */}
      {hasResult && (
        <button
          onClick={reset}
          className="btn-ghost ml-auto"
          title="Reset"
        >
          <RotateCcw size={13} />
          <span className="hidden sm:inline">Reset</span>
        </button>
      )}

      {/* Keyboard hint */}
      <div className="hidden lg:flex items-center gap-1 ml-auto text-xs text-editor-comment">
        <kbd className="px-1 py-0.5 bg-editor-border rounded text-[10px]">←→</kbd>
        <span>step</span>
        <span className="mx-1">·</span>
        <kbd className="px-1 py-0.5 bg-editor-border rounded text-[10px]">Space</kbd>
        <span>play</span>
      </div>
    </div>
  )
}

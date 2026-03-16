/**
 * useKeyboardShortcuts
 *
 * Registers global keyboard shortcuts for execution control.
 *
 * Shortcuts:
 * - F5 or Ctrl+Enter  → Run
 * - ArrowRight or →   → Step Forward
 * - ArrowLeft  or ←   → Step Backward
 * - Home              → Go to Start
 * - End               → Go to End
 * - Space             → Toggle Auto-play
 * - Escape            → Stop Auto-play
 */

import { useEffect } from 'react'
import { useAppStore } from '../store/useAppStore'

export function useKeyboardShortcuts() {
  const {
    run, stepForward, stepBackward, goToStart, goToEnd,
    toggleAutoPlay, canStepForward, canStepBackward,
    autoPlay, result, isRunning,
  } = useAppStore()

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't intercept when typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName
      const isEditorFocused = (e.target as HTMLElement)?.closest?.('.monaco-editor')

      if (isEditorFocused) {
        // Only handle run shortcut from editor
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          e.preventDefault()
          if (!isRunning) run()
        }
        return
      }

      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      switch (e.key) {
        case 'F5':
          e.preventDefault()
          if (!isRunning) run()
          break

        case 'ArrowRight':
        case 'l':
          if (!e.ctrlKey && !e.metaKey && !e.altKey) {
            e.preventDefault()
            if (canStepForward()) stepForward()
          }
          break

        case 'ArrowLeft':
        case 'h':
          if (!e.ctrlKey && !e.metaKey && !e.altKey) {
            e.preventDefault()
            if (canStepBackward()) stepBackward()
          }
          break

        case 'Home':
          e.preventDefault()
          goToStart()
          break

        case 'End':
          e.preventDefault()
          goToEnd()
          break

        case ' ':
          e.preventDefault()
          if (result) toggleAutoPlay()
          break

        case 'Escape':
          if (autoPlay) toggleAutoPlay()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    run, stepForward, stepBackward, goToStart, goToEnd,
    toggleAutoPlay, canStepForward, canStepBackward,
    autoPlay, result, isRunning,
  ])
}

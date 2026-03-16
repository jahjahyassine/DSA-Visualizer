/**
 * useAutoPlay
 *
 * Hook that drives automatic step-through playback.
 * Uses setInterval to advance steps at the configured speed.
 */

import { useEffect, useRef } from 'react'
import { useAppStore } from '../store/useAppStore'

export function useAutoPlay() {
  const { autoPlay, autoPlaySpeed, canStepForward, stepForward, toggleAutoPlay } = useAppStore()
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (autoPlay) {
      intervalRef.current = setInterval(() => {
        if (canStepForward()) {
          stepForward()
        } else {
          // Reached the end, stop auto-play
          toggleAutoPlay()
        }
      }, autoPlaySpeed)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [autoPlay, autoPlaySpeed, canStepForward, stepForward, toggleAutoPlay])
}

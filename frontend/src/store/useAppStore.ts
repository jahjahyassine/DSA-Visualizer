/**
 * Global Application State (Zustand)
 *
 * This store manages the entire application state including:
 * - The code being edited
 * - The execution result (all steps)
 * - The current step index (drives the visualization)
 * - UI state (loading, errors, selected language)
 *
 * The visualization is purely derived from `steps[currentStep]` —
 * stepping forward/backward just changes the index.
 */

import { create } from 'zustand'
import { ExecutionResult, ExecutionStep, Language, ExampleProgram } from '../types'
import { executeCode, fetchExamples, fetchLanguages } from '../utils/api'

interface AppState {
  // Editor state
  code: string
  language: string
  stdin: string

  // Execution state
  result: ExecutionResult | null
  currentStep: number
  isRunning: boolean
  error: string | null

  // UI state
  languages: Language[]
  examples: ExampleProgram[]
  isLoadingMeta: boolean
  showOutput: boolean
  autoPlay: boolean
  autoPlaySpeed: number  // ms between steps

  // Actions
  setCode: (code: string) => void
  setLanguage: (lang: string) => void
  setStdin: (stdin: string) => void
  run: () => Promise<void>
  reset: () => void
  stepForward: () => void
  stepBackward: () => void
  goToStep: (step: number) => void
  goToStart: () => void
  goToEnd: () => void
  toggleAutoPlay: () => void
  setAutoPlaySpeed: (ms: number) => void
  loadMeta: () => Promise<void>
  loadExample: (id: string) => void
  setShowOutput: (show: boolean) => void

  // Derived helpers
  currentStepData: () => ExecutionStep | null
  totalSteps: () => number
  canStepForward: () => boolean
  canStepBackward: () => boolean
}

// Default code shown on first load
const DEFAULT_CODE = `# Welcome to Code Visualizer!
# Run this code and step through it to see memory in action.

def greet(name):
    message = "Hello, " + name + "!"
    return message

x = 10
y = 20
total = x + y

result = greet("World")
print(result)
print(f"Sum: {total}")
`

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  code: DEFAULT_CODE,
  language: 'python',
  stdin: '',
  result: null,
  currentStep: 0,
  isRunning: false,
  error: null,
  languages: [],
  examples: [],
  isLoadingMeta: false,
  showOutput: true,
  autoPlay: false,
  autoPlaySpeed: 600,

  // ── Actions ────────────────────────────────────────────────

  setCode: (code) => set({ code }),
  setLanguage: (language) => set({ language, result: null, currentStep: 0, error: null }),
  setStdin: (stdin) => set({ stdin }),

  run: async () => {
    const { code, language, stdin } = get()
    set({ isRunning: true, error: null, result: null, currentStep: 0 })

    try {
      const result = await executeCode({ code, language, stdin })
      set({
        result,
        currentStep: 0,
        isRunning: false,
        error: result.success ? null : result.error,
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to connect to backend. Is it running?'
      set({ isRunning: false, error: message })
    }
  },

  reset: () => set({ result: null, currentStep: 0, error: null }),

  stepForward: () => {
    const { currentStep, result } = get()
    if (!result) return
    if (currentStep < result.steps.length - 1) {
      set({ currentStep: currentStep + 1 })
    }
  },

  stepBackward: () => {
    const { currentStep } = get()
    if (currentStep > 0) {
      set({ currentStep: currentStep - 1 })
    }
  },

  goToStep: (step) => {
    const { result } = get()
    if (!result) return
    const clamped = Math.max(0, Math.min(step, result.steps.length - 1))
    set({ currentStep: clamped })
  },

  goToStart: () => set({ currentStep: 0 }),

  goToEnd: () => {
    const { result } = get()
    if (!result) return
    set({ currentStep: result.steps.length - 1 })
  },

  toggleAutoPlay: () => {
    const { autoPlay, result, currentStep, stepForward } = get()
    if (!result) return

    if (autoPlay) {
      set({ autoPlay: false })
      return
    }

    // If at end, go to start first
    if (currentStep >= result.steps.length - 1) {
      set({ currentStep: 0 })
    }

    set({ autoPlay: true })

    // Auto-play loop runs via interval in AutoPlayController component
  },

  setAutoPlaySpeed: (autoPlaySpeed) => set({ autoPlaySpeed }),

  loadMeta: async () => {
    set({ isLoadingMeta: true })
    try {
      const [langs, examplesData] = await Promise.all([
        fetchLanguages(),
        fetchExamples(),
      ])
      set({
        languages: langs,
        examples: examplesData.python || [],
        isLoadingMeta: false,
      })
    } catch {
      set({ isLoadingMeta: false })
    }
  },

  loadExample: (id) => {
    const { examples } = get()
    const ex = examples.find(e => e.id === id)
    if (ex) {
      set({ code: ex.code, result: null, currentStep: 0, error: null })
    }
  },

  setShowOutput: (showOutput) => set({ showOutput }),

  // ── Derived ─────────────────────────────────────────────────

  currentStepData: () => {
    const { result, currentStep } = get()
    if (!result || !result.steps.length) return null
    return result.steps[currentStep] ?? null
  },

  totalSteps: () => {
    const { result } = get()
    return result?.steps.length ?? 0
  },

  canStepForward: () => {
    const { result, currentStep } = get()
    if (!result) return false
    return currentStep < result.steps.length - 1
  },

  canStepBackward: () => {
    const { currentStep } = get()
    return currentStep > 0
  },
}))

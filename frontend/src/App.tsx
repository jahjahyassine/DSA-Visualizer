/**
 * App — Root component
 *
 * Sets up the main layout:
 * ┌─────────────────────────────────────────────────┐
 * │                   TopBar                        │
 * ├──────────────────────┬──────────────────────────┤
 * │                      │                          │
 * │     Code Editor      │   Memory Visualization   │
 * │                      │                          │
 * ├──────────────────────┴──────────────────────────┤
 * │                  Timeline                       │
 * └─────────────────────────────────────────────────┘
 */

import { useEffect } from 'react'
import { useAppStore } from './store/useAppStore'
import { useAutoPlay } from './hooks/useAutoPlay'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { TopBar } from './components/layout/TopBar'
import { CodeEditor } from './components/editor/CodeEditor'
import { VisualizationPanel } from './components/visualization/VisualizationPanel'
import { Timeline } from './components/timeline/Timeline'
import { OutputPanel } from './components/layout/OutputPanel'

export default function App() {
  const { loadMeta } = useAppStore()

  // Load languages and example programs on startup
  useEffect(() => {
    loadMeta()
  }, [loadMeta])

  // Enable keyboard shortcuts
  useKeyboardShortcuts()

  // Enable auto-play
  useAutoPlay()

  return (
    <div className="flex flex-col h-screen bg-editor-bg text-editor-text overflow-hidden">
      {/* Top navigation bar */}
      <TopBar />

      {/* Main content area */}
      <div className="flex flex-1 min-h-0 gap-0">
        {/* Left: Code Editor */}
        <div className="flex flex-col w-[45%] min-w-[300px] border-r border-editor-border">
          <CodeEditor />
          <OutputPanel />
        </div>

        {/* Right: Memory Visualization */}
        <div className="flex flex-col flex-1 min-w-0">
          <VisualizationPanel />
        </div>
      </div>

      {/* Bottom: Execution Timeline */}
      <Timeline />
    </div>
  )
}

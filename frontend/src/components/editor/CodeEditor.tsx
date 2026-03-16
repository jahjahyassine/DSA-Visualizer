/**
 * CodeEditor
 *
 * Monaco-based code editor with:
 * - Syntax highlighting for Python
 * - Line highlighting for the current execution step
 * - Dark theme matching the app's design
 * - Ctrl+Enter to run
 */

import { useRef, useEffect, useCallback } from 'react'
import MonacoEditor, { OnMount, BeforeMount } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import { useAppStore } from '../../store/useAppStore'

export function CodeEditor() {
  const { code, setCode, run, isRunning, currentStepData, result } = useAppStore()
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const decorationsRef = useRef<string[]>([])

  const step = currentStepData()
  const currentLine = step?.line ?? null

  // Configure Monaco before it mounts
  const handleBeforeMount: BeforeMount = (monaco) => {
    // Register a custom dark theme
    monaco.editor.defineTheme('visualizer-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '8b949e', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'ff7b72' },
        { token: 'string', foreground: 'a5d6ff' },
        { token: 'number', foreground: '79c0ff' },
        { token: 'identifier', foreground: 'e6edf3' },
        { token: 'type', foreground: 'ffa657' },
        { token: 'delimiter', foreground: 'e6edf3' },
        { token: 'operator', foreground: 'ff7b72' },
        { token: 'function', foreground: 'd2a8ff' },
      ],
      colors: {
        'editor.background': '#0d1117',
        'editor.foreground': '#e6edf3',
        'editor.lineHighlightBackground': '#161b22',
        'editor.selectionBackground': '#264f78',
        'editor.inactiveSelectionBackground': '#1a3d5c',
        'editorLineNumber.foreground': '#484f58',
        'editorLineNumber.activeForeground': '#8b949e',
        'editorCursor.foreground': '#58a6ff',
        'editor.findMatchBackground': '#9e6a03',
        'editorWidget.background': '#161b22',
        'editorWidget.border': '#30363d',
        'input.background': '#0d1117',
        'input.border': '#30363d',
        'scrollbarSlider.background': '#30363d80',
        'scrollbarSlider.hoverBackground': '#484f5880',
        'editorGutter.background': '#0d1117',
      },
    })
  }

  const handleMount: OnMount = (editorInstance) => {
    editorRef.current = editorInstance

    // Ctrl+Enter to run
    editorInstance.addCommand(
      // Monaco uses KeyMod.CtrlCmd | KeyCode.Enter
      2048 | 3,  // CtrlCmd + Enter
      () => {
        if (!isRunning) run()
      }
    )

    // Focus the editor
    editorInstance.focus()
  }

  // Highlight the currently executing line
  useEffect(() => {
    const monaco = editorRef.current
    if (!monaco) return

    // Clear previous decorations
    decorationsRef.current = monaco.deltaDecorations(decorationsRef.current, [])

    if (currentLine && result) {
      decorationsRef.current = monaco.deltaDecorations([], [
        {
          range: {
            startLineNumber: currentLine,
            startColumn: 1,
            endLineNumber: currentLine,
            endColumn: 1,
          },
          options: {
            isWholeLine: true,
            className: 'bg-blue-500/15',
            glyphMarginClassName: 'bg-blue-500/60',
            overviewRuler: {
              color: '#58a6ff',
              position: 1,
            },
          },
        },
        // Arrow indicator
        {
          range: {
            startLineNumber: currentLine,
            startColumn: 1,
            endLineNumber: currentLine,
            endColumn: 1,
          },
          options: {
            isWholeLine: false,
            before: {
              content: '▶',
              inlineClassName: 'text-blue-400 mr-1',
            },
          },
        },
      ])

      // Reveal the current line in center
      monaco.revealLineInCenter(currentLine)
    }
  }, [currentLine, result])

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Editor header */}
      <div className="panel-header shrink-0">
        <div className="w-2 h-2 rounded-full bg-orange-500" />
        <div className="w-2 h-2 rounded-full bg-yellow-500" />
        <div className="w-2 h-2 rounded-full bg-green-500" />
        <span className="ml-2 text-editor-comment">main.py</span>
        {isRunning && (
          <span className="ml-auto text-yellow-400 text-[10px] animate-pulse">
            ● Running…
          </span>
        )}
        {result && !isRunning && (
          <span className="ml-auto text-green-400 text-[10px]">
            ● {result.total_steps} steps
          </span>
        )}
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 min-h-0">
        <MonacoEditor
          height="100%"
          language="python"
          value={code}
          theme="visualizer-dark"
          onChange={(val) => setCode(val ?? '')}
          beforeMount={handleBeforeMount}
          onMount={handleMount}
          options={{
            fontSize: 13,
            fontFamily: '"JetBrains Mono", "Fira Code", Consolas, monospace',
            fontLigatures: true,
            lineNumbers: 'on',
            lineHeight: 20,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            automaticLayout: true,
            tabSize: 4,
            insertSpaces: true,
            renderWhitespace: 'selection',
            glyphMargin: true,
            folding: true,
            showFoldingControls: 'mouseover',
            renderLineHighlight: 'all',
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            smoothScrolling: true,
            padding: { top: 12, bottom: 12 },
            overviewRulerLanes: 3,
            scrollbar: {
              vertical: 'visible',
              horizontal: 'visible',
              verticalScrollbarSize: 6,
              horizontalScrollbarSize: 6,
            },
          }}
        />
      </div>
    </div>
  )
}

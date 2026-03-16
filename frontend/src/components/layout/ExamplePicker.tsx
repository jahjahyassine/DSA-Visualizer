/**
 * ExamplePicker
 *
 * Dropdown button that lets users load pre-built example programs
 * into the editor. Examples are fetched from the backend.
 */

import { useState, useRef, useEffect } from 'react'
import { BookOpen, ChevronDown } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'

export function ExamplePicker() {
  const { examples, loadExample } = useAppStore()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function handleSelect(id: string) {
    loadExample(id)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="btn-ghost flex items-center gap-1"
        title="Load an example program"
      >
        <BookOpen size={13} />
        <span className="hidden sm:inline">Examples</span>
        <ChevronDown size={11} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-editor-panel border border-editor-border
                        rounded-lg shadow-2xl z-50 overflow-hidden animate-fade-in">
          <div className="px-3 py-2 text-[10px] font-semibold text-editor-comment uppercase tracking-wider
                          border-b border-editor-border">
            Python Examples
          </div>
          <div className="overflow-y-auto max-h-80">
            {examples.length === 0 ? (
              <div className="px-3 py-4 text-sm text-editor-comment text-center">
                Loading examples…
              </div>
            ) : (
              examples.map(ex => (
                <button
                  key={ex.id}
                  onClick={() => handleSelect(ex.id)}
                  className="w-full text-left px-3 py-2.5 hover:bg-editor-border transition-colors group"
                >
                  <div className="text-sm text-editor-text font-medium group-hover:text-white">
                    {ex.name}
                  </div>
                  <div className="text-xs text-editor-comment mt-0.5 leading-snug">
                    {ex.description}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

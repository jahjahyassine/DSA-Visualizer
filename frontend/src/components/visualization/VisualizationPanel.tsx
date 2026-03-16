/**
 * VisualizationPanel
 *
 * The right-side panel showing the memory visualization.
 * Contains:
 * - Call stack panel (left side of the canvas)
 * - Heap visualization (React Flow graph)
 * - Step info header
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import ReactFlow, {
  Background, Controls, MiniMap,
  useNodesState, useEdgesState,
  BackgroundVariant,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { useAppStore } from '../../store/useAppStore'
import { buildGraphFromStep, getHeapIds, NODE_TYPE_HEAP } from '../../utils/graphBuilder'
import { HeapObjectNode } from './HeapObjectNode'
import { CallStackPanel } from './CallStackPanel'
import { StepInfoBadge } from './StepInfoBadge'
import { EmptyState } from './EmptyState'

// Register custom node types
const nodeTypes = {
  [NODE_TYPE_HEAP]: HeapObjectNode,
}

export function VisualizationPanel() {
  const { currentStepData, result } = useAppStore()
  const step = currentStepData()
  const prevHeapIdsRef = useRef<Set<string>>(new Set())

  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  // Re-build graph whenever the step changes
  useEffect(() => {
    if (!step) {
      setNodes([])
      setEdges([])
      prevHeapIdsRef.current = new Set()
      return
    }

    const { nodes: newNodes, edges: newEdges } = buildGraphFromStep(step, prevHeapIdsRef.current)
    setNodes(newNodes)
    setEdges(newEdges)
    prevHeapIdsRef.current = getHeapIds(step)
  }, [step, setNodes, setEdges])

  if (!result) {
    return (
      <div className="flex flex-col h-full">
        <div className="panel-header shrink-0">
          <span className="text-editor-comment">Memory Visualization</span>
        </div>
        <EmptyState />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with step info */}
      <div className="panel-header shrink-0 gap-3">
        <span className="text-editor-comment">Memory</span>
        {step && <StepInfoBadge step={step} />}
      </div>

      {/* Main visualization area */}
      <div className="flex flex-1 min-h-0">
        {/* Call stack (left column) */}
        <div className="w-52 shrink-0 border-r border-editor-border overflow-y-auto bg-editor-bg">
          {step && <CallStackPanel step={step} />}
        </div>

        {/* React Flow heap graph */}
        <div className="flex-1 min-w-0">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2, maxZoom: 1.5 }}
            minZoom={0.3}
            maxZoom={2.5}
            attributionPosition="bottom-right"
            proOptions={{ hideAttribution: true }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1}
              color="#21262d"
            />
            <Controls
              showInteractive={false}
              className="!bottom-4 !right-4"
            />
            <MiniMap
              nodeColor={(node) => {
                const obj = node.data?.obj
                if (!obj) return '#30363d'
                const colors: Record<string, string> = {
                  list: '#ea580c', dict: '#9333ea', instance: '#ec4899',
                  tuple: '#d97706', set: '#e11d48',
                }
                return colors[obj.type] ?? '#58a6ff'
              }}
              maskColor="rgba(13, 17, 23, 0.7)"
              style={{
                background: '#161b22',
                border: '1px solid #30363d',
                borderRadius: '6px',
              }}
            />
          </ReactFlow>
        </div>
      </div>
    </div>
  )
}

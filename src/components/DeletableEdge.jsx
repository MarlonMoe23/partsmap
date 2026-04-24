import { BaseEdge, EdgeLabelRenderer, getBezierPath } from '@xyflow/react'
import { useStore } from '../store/useStore'
import { X } from 'lucide-react'

export default function DeletableEdge({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition, style, animated, markerEnd,
}) {
  const { deleteEdge } = useStore()
  const isPolar = style?.stroke === '#ef4444'

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  })

  return (
    <>
      <BaseEdge path={edgePath} style={style} animated={animated} markerEnd={markerEnd} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
            zIndex: 100,
          }}
          className="nodrag nopan"
        >
          <button
            className="edge-delete-btn"
            style={{ borderColor: isPolar ? '#ef444466' : '#ffffff33' }}
            onClick={(e) => { e.stopPropagation(); deleteEdge(id) }}
          >
            <X size={10} />
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  )
}

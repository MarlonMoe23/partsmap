import { BaseEdge, getBezierPath } from '@xyflow/react'

export default function DeletableEdge({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition, style, animated, markerEnd,
}) {
  const [edgePath] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  })

  return <BaseEdge path={edgePath} style={style} animated={animated} markerEnd={markerEnd} />
}

import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import { useStore } from '../store/useStore'

const IFSNode = memo(({ id, data, selected }) => {
  const { partTypes, selectNode } = useStore()
  const typeConfig = partTypes[data.partType] ?? partTypes.manager

  return (
    <div
      className="ifs-node"
      style={{
        '--node-color': typeConfig.color,
        '--node-glow': typeConfig.glow,
        borderColor: selected ? typeConfig.color : `${typeConfig.color}66`,
        boxShadow: selected
          ? `0 0 0 2px ${typeConfig.color}, 0 0 32px ${typeConfig.glow}`
          : `0 0 20px ${typeConfig.glow}`,
      }}
      onClick={() => selectNode(id)}
    >
      <Handle type="target" position={Position.Top} className="ifs-handle" />

      <div className="node-type-badge" style={{ background: `${typeConfig.color}22`, color: typeConfig.color }}>
        {typeConfig.label}
      </div>

      <div className="node-label">{data.label}</div>

      {data.emotion && (
        <div className="node-emotion">{data.emotion}</div>
      )}

      <Handle type="source" position={Position.Bottom} className="ifs-handle" />
    </div>
  )
})

IFSNode.displayName = 'IFSNode'
export default IFSNode

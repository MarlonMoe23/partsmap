import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import { useStore } from '../store/useStore'

const IFSNode = memo(({ id, data, selected }) => {
  const { partTypes, selectNode } = useStore()
  const typeConfig = partTypes[data.partType] ?? partTypes.manager
  const isSelf = data.partType === 'self'

  const nodeStyle = isSelf ? {
    background: '#fdf6e9',
    borderColor: selected ? typeConfig.color : `${typeConfig.color}`,
    borderWidth: '2px',
    boxShadow: selected
      ? `0 0 0 2px ${typeConfig.color}66, 0 4px 24px ${typeConfig.glow}`
      : `0 2px 16px ${typeConfig.glow}, 0 0 0 1px ${typeConfig.color}44`,
  } : {
    background: typeConfig.color,
    borderColor: selected ? '#00000033' : `${typeConfig.color}`,
    boxShadow: selected
      ? `0 0 0 2px ${typeConfig.color}, 0 4px 24px ${typeConfig.glow}`
      : '0 2px 12px #00000022',
  }

  return (
    <div
      className="ifs-node"
      style={nodeStyle}
      onClick={() => selectNode(id)}
    >
      <Handle type="target" position={Position.Top} id="top" className="ifs-handle" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="ifs-handle" />
      <Handle type="source" position={Position.Left} id="left" className="ifs-handle ifs-handle-polar" />
      <Handle type="target" position={Position.Right} id="right" className="ifs-handle ifs-handle-polar" />

      <div className="node-label" style={{ color: isSelf ? 'var(--text)' : '#ffffff' }}>
        {data.label}
      </div>
      

{/* {data.emotion && (
  <div className="node-emotion" style={{ color: isSelf ? 'var(--text-muted)' : '#ffffffbb' }}>
    {data.emotion}
  </div>
)} */}


      )}
    </div>
  )
})

IFSNode.displayName = 'IFSNode'
export default IFSNode

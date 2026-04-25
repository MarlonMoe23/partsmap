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
        borderColor: selected ? typeConfig.color : `${typeConfig.color}88`,
        borderLeftWidth: '3px',
        boxShadow: selected
          ? `0 0 0 1px ${typeConfig.color}44, 0 4px 24px ${typeConfig.glow}`
          : '0 2px 12px #00000018',
      }}
      onClick={() => selectNode(id)}
    >
      <Handle type="target" position={Position.Top} id="top" className="ifs-handle" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="ifs-handle" />
      <Handle type="source" position={Position.Left} id="left" className="ifs-handle ifs-handle-polar" />
      <Handle type="target" position={Position.Right} id="right" className="ifs-handle ifs-handle-polar" />

      <div className="node-label">{data.label}</div>
      {data.emotion && <div className="node-emotion">{data.emotion}</div>}
    </div>
  )
})

IFSNode.displayName = 'IFSNode'
export default IFSNode
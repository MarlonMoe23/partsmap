import { useEffect } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { useStore } from './store/useStore'
import IFSNode from './components/IFSNode'
import PartPanel from './components/PartPanel'
import Sidebar from './components/Sidebar'
import PasswordGate, { useAuth } from './components/PasswordGate'

const nodeTypes = { ifsNode: IFSNode }

export default function App() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, loadFromDB, loading } = useStore()
  const { authed, login } = useAuth()

  useEffect(() => {
    if (authed) loadFromDB()
  }, [authed])

  if (!authed) return <PasswordGate onAuth={login} />

  if (loading) return (
    <div className="loading-screen">
      <div className="loading-dot" />
      <span>Cargando tu mapa...</span>
    </div>
  )

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="canvas-area">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          proOptions={{ hideAttribution: true }}
          minZoom={0.3}
          maxZoom={2}
        >
          <Background variant={BackgroundVariant.Dots} gap={28} size={1} color="#ffffff09" />
          <Controls style={{ background: '#1a1625', border: '1px solid #ffffff15', borderRadius: '10px' }} />
          <MiniMap
            style={{ background: '#0f0d16', border: '1px solid #ffffff15' }}
            nodeColor={(n) => {
              const colors = { self: '#f59e0b', manager: '#6366f1', firefighter: '#ef4444', exile: '#8b5cf6' }
              return colors[n.data?.partType] ?? '#6366f1'
            }}
            maskColor="#0f0d1688"
          />
        </ReactFlow>
      </div>
      <PartPanel />
    </div>
  )
}

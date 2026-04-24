import { useStore, PART_TYPES } from '../store/useStore'
import { Plus } from 'lucide-react'
import { useState } from 'react'

export default function Sidebar() {
  const { nodes, addPart, selectNode } = useStore()
  const [showTypeMenu, setShowTypeMenu] = useState(false)

  const parts = nodes.filter((n) => n.data)

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-title">Mi Mapa IFS</span>
        <div className="add-btn-wrapper">
          <button
            className="add-btn"
            onClick={() => setShowTypeMenu((v) => !v)}
            title="Agregar parte"
          >
            <Plus size={16} />
            <span>Agregar</span>
          </button>
          {showTypeMenu && (
            <div className="type-menu">
              {Object.entries(PART_TYPES).filter(([k]) => k !== 'self').map(([key, val]) => (
                <button
                  key={key}
                  className="type-menu-item"
                  style={{ '--item-color': val.color }}
                  onClick={() => {
                    addPart(key)
                    setShowTypeMenu(false)
                  }}
                >
                  <span className="type-dot" style={{ background: val.color }} />
                  {val.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="sidebar-list">
        {parts.map((node) => {
          const typeConfig = PART_TYPES[node.data.partType] ?? PART_TYPES.manager
          return (
            <button
              key={node.id}
              className="part-item"
              onClick={() => selectNode(node.id)}
              style={{ '--item-color': typeConfig.color }}
            >
              <span className="part-dot" style={{ background: typeConfig.color }} />
              <div className="part-info">
                <span className="part-name">{node.data.label}</span>
                {node.data.emotion && (
                  <span className="part-emotion">{node.data.emotion}</span>
                )}
              </div>
              <span className="part-type-badge" style={{ color: typeConfig.color }}>
                {typeConfig.label}
              </span>
            </button>
          )
        })}
      </div>

      <div className="sidebar-hint">
        Arrastra para mover · Conecta entre nodos · Click para editar
      </div>
    </div>
  )
}

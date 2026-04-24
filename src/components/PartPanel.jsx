import { useStore, PART_TYPES } from '../store/useStore'
import { X, Trash2 } from 'lucide-react'

export default function PartPanel() {
  const { nodes, selectedNodeId, panelOpen, closePanel, updateNodeData, deleteNode } = useStore()

  if (!panelOpen || !selectedNodeId) return null

  const node = nodes.find((n) => n.id === selectedNodeId)
  if (!node) return null

  const { data } = node
  const typeConfig = PART_TYPES[data.partType] ?? PART_TYPES.manager

  const update = (field) => (e) => updateNodeData(selectedNodeId, { [field]: e.target.value })

  return (
    <div className="part-panel">
      <div className="panel-header" style={{ borderBottomColor: `${typeConfig.color}33` }}>
        <div className="panel-badge" style={{ background: `${typeConfig.color}22`, color: typeConfig.color }}>
          {typeConfig.label}
        </div>
        <div className="panel-actions">
          <button className="icon-btn danger" onClick={() => deleteNode(selectedNodeId)} title="Eliminar parte">
            <Trash2 size={15} />
          </button>
          <button className="icon-btn" onClick={closePanel}>
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="panel-body">
        <div className="field-group">
          <label>Nombre de la parte</label>
          <input
            type="text"
            value={data.label}
            onChange={update('label')}
            placeholder="Ej: El Crítico Interno"
          />
        </div>

        <div className="field-group">
          <label>Tipo</label>
          <select value={data.partType} onChange={update('partType')}>
            {Object.entries(PART_TYPES).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>
        </div>

        <div className="field-group">
          <label>Emoción principal</label>
          <input
            type="text"
            value={data.emotion}
            onChange={update('emotion')}
            placeholder="Ej: Miedo, vergüenza, orgullo..."
          />
        </div>

        <div className="field-group">
          <label>Rol que cumple</label>
          <input
            type="text"
            value={data.role}
            onChange={update('role')}
            placeholder="Ej: Protegerme del rechazo"
          />
        </div>

        <div className="field-group">
          <label>Mensaje que lleva</label>
          <input
            type="text"
            value={data.message}
            onChange={update('message')}
            placeholder="Ej: No eres suficiente"
          />
        </div>

        <div className="field-group">
          <label>Notas / observaciones</label>
          <textarea
            value={data.notes}
            onChange={update('notes')}
            placeholder="Cuándo aparece, qué la activa, qué necesita..."
            rows={4}
          />
        </div>
      </div>

      <div className="panel-legend">
        <div className="legend-title">Tipos de partes</div>
        {Object.entries(PART_TYPES).map(([key, val]) => (
          <div key={key} className="legend-item">
            <span className="legend-dot" style={{ background: val.color }} />
            <span className="legend-name" style={{ color: val.color }}>{val.label}</span>
            <span className="legend-desc">
              {key === 'self' && '— Centro, presencia pura'}
              {key === 'manager' && '— Previene el dolor'}
              {key === 'firefighter' && '— Reacciona al dolor'}
              {key === 'exile' && '— Lleva el dolor'}
              {key === 'protector' && '— Protege al exiliado'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

import { useStore, PART_TYPES } from '../store/useStore'
import { X, Trash2, GripHorizontal } from 'lucide-react'
import { useRef, useState } from 'react'

const ESTADOS = ['Activa', 'En paz', 'En proceso', 'Desconocido']

export default function PartPanel() {
  const { nodes, selectedNodeId, panelOpen, closePanel, updateNodeData, deleteNode } = useStore()
  const [pos, setPos] = useState({ x: 80, y: 60 })
  const dragging = useRef(false)
  const offset = useRef({ x: 0, y: 0 })

  if (!panelOpen || !selectedNodeId) return null
  const node = nodes.find((n) => n.id === selectedNodeId)
  const isSelf = node?.data?.partType === 'self'
  if (!node) return null

  const { data } = node
  const typeConfig = PART_TYPES[data.partType] ?? PART_TYPES.manager
  const update = (field) => (e) => updateNodeData(selectedNodeId, { [field]: e.target.value })

  const onMouseDown = (e) => {
    dragging.current = true
    offset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  const onMouseMove = (e) => {
    if (!dragging.current) return
    setPos({ x: e.clientX - offset.current.x, y: e.clientY - offset.current.y })
  }

  const onMouseUp = () => {
    dragging.current = false
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }

  return (
    <div
      className="part-panel-float"
      style={{ left: pos.x, top: pos.y, borderColor: `${typeConfig.color}44` }}
    >
      {/* Drag handle */}
      <div className="panel-drag-handle" onMouseDown={onMouseDown}>
        <GripHorizontal size={14} color="#ffffff25" />
      </div>

      <div className="panel-header" style={{ borderBottomColor: `${typeConfig.color}33` }}>
        <div className="panel-badge" style={{ background: `${typeConfig.color}22`, color: typeConfig.color }}>
          {typeConfig.label}
        </div>
        <div className="panel-actions">
          {!isSelf && (
            <button className="icon-btn danger" onClick={() => deleteNode(selectedNodeId)} title="Eliminar">
              <Trash2 size={15} />
            </button>
          )}
          <button className="icon-btn" onClick={closePanel}>
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="panel-body">
        <div className="panel-section-title">Identidad</div>

        <div className="field-row">
          <div className="field-group flex-2">
            <label>Nombre de la parte</label>
            <input type="text" value={data.label} onChange={update('label')} placeholder="Ej: El Crítico Interno" />
          </div>
          <div className="field-group flex-1">
            <label>Edad</label>
            <input type="text" value={data.age ?? ''} onChange={update('age')} placeholder="Ej: 7 años" />
          </div>
        </div>

        <div className="field-row">
          <div className="field-group flex-1">
            <label>Tipo</label>
            <select value={data.partType} onChange={update('partType')}>
              {Object.entries(PART_TYPES).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
          </div>
          <div className="field-group flex-1">
            <label>Estado actual</label>
            <select value={data.estado ?? 'Desconocido'} onChange={update('estado')}>
              {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
        </div>

        <div className="field-group">
          <label>Emoción principal</label>
          <input type="text" value={data.emotion ?? ''} onChange={update('emotion')} placeholder="Ej: Miedo, vergüenza, orgullo..." />
        </div>

        <div className="panel-section-title">Origen</div>

        <div className="field-group">
          <label>¿Cuándo apareció?</label>
          <input type="text" value={data.origen ?? ''} onChange={update('origen')} placeholder="Ej: A los 6 años cuando..." />
        </div>

        <div className="field-group">
          <label>Situaciones que la activan</label>
          <textarea value={data.activadores ?? ''} onChange={update('activadores')} placeholder="Ej: Cuando me critican, cuando estoy solo..." rows={2} />
        </div>

        <div className="panel-section-title">Rol en el sistema</div>

        <div className="field-group">
          <label>Intención positiva</label>
          <input type="text" value={data.role ?? ''} onChange={update('role')} placeholder="Ej: Protegerme del rechazo" />
        </div>

        <div className="field-group">
          <label>¿A quién protege?</label>
          <input type="text" value={data.protege ?? ''} onChange={update('protege')} placeholder="Ej: Al niño exiliado de 6 años" />
        </div>

        <div className="field-group">
          <label>¿Polarizada con quién?</label>
          <input type="text" value={data.polarizada ?? ''} onChange={update('polarizada')} placeholder="Ej: La parte que quiere ser auténtico" />
        </div>

        <div className="field-group">
          <label>Estrategias que usa</label>
          <textarea value={data.estrategias ?? ''} onChange={update('estrategias')} placeholder="Ej: Me hace procrastinar, me llena de autocrítica, me aísla..." rows={2} />
        </div>

        <div className="panel-section-title">Mundo interior</div>

        <div className="field-group">
          <label>¿Qué teme?</label>
          <textarea value={data.teme ?? ''} onChange={update('teme')} placeholder="Ej: Que me rechacen si me muestro vulnerable..." rows={2} />
        </div>

        <div className="field-group">
          <label>¿Qué espera / quiere?</label>
          <textarea value={data.quiere ?? ''} onChange={update('quiere')} placeholder="Ej: Ser vista, que alguien le diga que está bien..." rows={2} />
        </div>

        <div className="field-group">
          <label>¿Qué necesita?</label>
          <textarea value={data.necesita ?? ''} onChange={update('necesita')} placeholder="Ej: Compasión, presencia, ser escuchada..." rows={2} />
        </div>

        <div className="field-group">
          <label>Mensaje que lleva</label>
          <input type="text" value={data.message ?? ''} onChange={update('message')} placeholder="Ej: No eres suficiente" />
        </div>

        <div className="field-group">
          <label>Notas / observaciones</label>
          <textarea value={data.notes ?? ''} onChange={update('notes')} placeholder="Cualquier otra cosa relevante..." rows={3} />
        </div>
      </div>
    </div>
  )
}

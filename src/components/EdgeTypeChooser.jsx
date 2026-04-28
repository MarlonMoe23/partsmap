import { useStore } from '../store/useStore'

export default function EdgeTypeChooser() {
  const { pendingEdge, confirmEdge, cancelEdge } = useStore()

  if (!pendingEdge) return null

  return (
    <div className="edge-chooser-overlay" onClick={cancelEdge}>
      <div
        className="edge-chooser"
        onClick={(e) => e.stopPropagation()}
        style={{ left: pendingEdge.x, top: pendingEdge.y }}
      >
        <div className="edge-chooser-title">Tipo de conexión</div>
        <button className="edge-chooser-btn connection" onClick={() => confirmEdge('connection')}>
          <span className="edge-chooser-line connection-line" />
          Conexión
        </button>
        <button className="edge-chooser-btn polarization" onClick={() => confirmEdge('polarization')}>
          <span className="edge-chooser-line polarization-line" />
          Polarización
        </button>
      </div>
    </div>
  )
}

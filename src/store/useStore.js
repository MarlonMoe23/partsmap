import { create } from 'zustand'
import { applyNodeChanges, applyEdgeChanges } from '@xyflow/react'
import {
  loadAll,
  savePart,
  savePartDebounced,
  savePosition,
  deletePart,
  saveEdge,
  deleteEdgeRemote,
  setSyncListener,
} from '../sheets'

export const PART_TYPES = {
  self:        { label: 'Self',        color: '#c9a050', glow: '#c9a05022' },
  manager:     { label: 'Manager',     color: '#e07830', glow: '#e0783022' },
  firefighter: { label: 'Firefighter', color: '#cc3333', glow: '#cc333322' },
  exile:       { label: 'Exile',       color: '#4a9aba', glow: '#4a9aba22' },
}

// Google Sheets puede devolver números en celdas de texto (ej. edad 7)
const str = (v) => (v === null || v === undefined ? '' : String(v))

// Convierte una fila de la hoja → nodo de React Flow
function rowToNode(row) {
  return {
    id: str(row.id),
    type: 'ifsNode',
    position: { x: Number(row.position_x) || 0, y: Number(row.position_y) || 0 },
    data: {
      label:       str(row.label),
      partType:    str(row.part_type) || 'manager',
      emotion:     str(row.emotion),
      role:        str(row.role),
      message:     str(row.message),
      notes:       str(row.notes),
      age:         str(row.age),
      estado:      str(row.estado) || 'Desconocido',
      origen:      str(row.origen),
      activadores: str(row.activadores),
      protege:     str(row.protege),
      polarizada:  str(row.polarizada),
      teme:        str(row.teme),
      quiere:      str(row.quiere),
      necesita:    str(row.necesita),
      estrategias: str(row.estrategias),
    },
  }
}

// Convierte un nodo de React Flow → fila de la hoja.
// withPosition=false al editar texto: así no pisa una posición más nueva.
function nodeToRow(node, withPosition = true) {
  const row = {
    id:          node.id,
    label:       node.data.label,
    part_type:   node.data.partType,
    emotion:     node.data.emotion,
    role:        node.data.role,
    message:     node.data.message,
    notes:       node.data.notes,
    age:         node.data.age,
    estado:      node.data.estado,
    origen:      node.data.origen,
    activadores: node.data.activadores,
    protege:     node.data.protege,
    polarizada:  node.data.polarizada,
    teme:        node.data.teme,
    quiere:      node.data.quiere,
    necesita:    node.data.necesita,
    estrategias: node.data.estrategias,
  }
  if (withPosition) {
    row.position_x = node.position.x
    row.position_y = node.position.y
  }
  return row
}

function makeFlowEdge(e) {
  const isPolar = e.edge_type === 'polarization'
  return {
    id: str(e.id),
    source: str(e.source),
    target: str(e.target),
    sourceHandle: str(e.source_handle) || null,
    targetHandle: str(e.target_handle) || null,
    animated: isPolar,
    style: isPolar
      ? { stroke: '#cc3333', strokeWidth: 2 }
      : { stroke: '#e8a800', strokeWidth: 2 },
  }
}

export const useStore = create((set, get) => {
  // El aviso "Guardando…" / error se alimenta desde sheets.js
  setSyncListener((status) => set({ syncStatus: status }))

  return {
    nodes: [],
    edges: [],
    selectedNodeId: null,
    panelOpen: false,
    loading: true,
    loadError: null,
    syncStatus: 'idle',
    partTypes: PART_TYPES,
    pendingEdge: null,

    // ── Carga inicial desde Google Sheets ────────────────
    loadFromDB: async () => {
      set({ loading: true, loadError: null })
      try {
        const { parts, edges } = await loadAll()
        const nodes = parts.map(rowToNode)

        // Si la hoja está vacía, creamos el nodo Self inicial
        if (nodes.length === 0) {
          const selfNode = {
            id: 'self-1',
            type: 'ifsNode',
            position: { x: 350, y: 250 },
            data: {
              label: 'Self', partType: 'self',
              emotion: 'Calma, curiosidad, compasión',
              role: 'Centro de conciencia', message: 'Estoy aquí para todos',
              notes: '', age: '', estado: 'Desconocido', origen: '',
              activadores: '', protege: '', polarizada: '',
              teme: '', quiere: '', necesita: '', estrategias: '',
            },
          }
          savePart(nodeToRow(selfNode))
          set({ nodes: [selfNode], edges: [], loading: false })
          return
        }

        // Ignora conexiones que apunten a partes que ya no existen
        const ids = new Set(nodes.map((n) => n.id))
        const flowEdges = edges
          .map(makeFlowEdge)
          .filter((e) => ids.has(e.source) && ids.has(e.target))

        set({ nodes, edges: flowEdges, loading: false })
      } catch (err) {
        console.error(err)
        set({ loading: false, loadError: err.message || String(err) })
      }
    },

    // ── Cambios de posición (drag) ───────────────────────
    onNodesChange: (changes) => {
      const nodes = applyNodeChanges(changes, get().nodes)
      set({ nodes })

      // Guarda la posición solo al soltar el nodo
      changes
        .filter((c) => c.type === 'position' && c.dragging === false)
        .forEach((c) => {
          const node = nodes.find((n) => n.id === c.id)
          if (node) savePosition(node.id, node.position.x, node.position.y)
        })
    },

    onEdgesChange: (changes) => {
      const removed = changes.filter((c) => c.type === 'remove')
      set({ edges: applyEdgeChanges(changes, get().edges) })
      removed.forEach((c) => deleteEdgeRemote(c.id))
    },

    deleteEdge: (id) => {
      set({ edges: get().edges.filter((e) => e.id !== id) })
      deleteEdgeRemote(id)
    },

    onConnect: (connection) => {
      set({ pendingEdge: { connection } })
    },

    confirmEdge: (type) => {
      const { pendingEdge } = get()
      if (!pendingEdge) return
      const { connection } = pendingEdge
      const row = {
        id: `e-${Date.now()}`,
        source: connection.source,
        target: connection.target,
        source_handle: connection.sourceHandle ?? '',
        target_handle: connection.targetHandle ?? '',
        edge_type: type,
      }
      set({ edges: [...get().edges, makeFlowEdge(row)], pendingEdge: null })
      saveEdge(row)
    },

    cancelEdge: () => set({ pendingEdge: null }),

    selectNode: (id) => set({ selectedNodeId: id, panelOpen: true }),
    closePanel: () => set({ panelOpen: false, selectedNodeId: null }),

    // ── Agregar parte ────────────────────────────────────
    addPart: (partType = 'manager') => {
      const id = `part-${Date.now()}`
      const newNode = {
        id,
        type: 'ifsNode',
        position: { x: 100 + Math.random() * 400, y: 100 + Math.random() * 300 },
        data: {
          label: 'Nueva parte', partType,
          emotion: '', role: '', message: '', notes: '',
          age: '', estado: 'Desconocido', origen: '', activadores: '',
          protege: '', polarizada: '', teme: '', quiere: '',
          necesita: '', estrategias: '',
        },
      }
      set({ nodes: [...get().nodes, newNode], selectedNodeId: id, panelOpen: true })
      savePart(nodeToRow(newNode))
    },

    // ── Actualizar datos de una parte ────────────────────
    updateNodeData: (id, data) => {
      const nodes = get().nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, ...data } } : n
      )
      set({ nodes })

      const node = nodes.find((n) => n.id === id)
      if (node) savePartDebounced(nodeToRow(node, false))
    },

    // ── Eliminar parte ───────────────────────────────────
    deleteNode: (id) => {
      set({
        nodes: get().nodes.filter((n) => n.id !== id),
        edges: get().edges.filter((e) => e.source !== id && e.target !== id),
        selectedNodeId: null,
        panelOpen: false,
      })
      deletePart(id)
    },
  }
})
import { create } from 'zustand'
import { applyNodeChanges, applyEdgeChanges } from '@xyflow/react'

const PART_TYPES = {
  self: { label: 'Self', color: '#f59e0b', glow: '#f59e0b44' },
  manager: { label: 'Manager', color: '#6366f1', glow: '#6366f144' },
  firefighter: { label: 'Firefighter', color: '#ef4444', glow: '#ef444444' },
  exile: { label: 'Exile', color: '#8b5cf6', glow: '#8b5cf644' },
  protector: { label: 'Protector', color: '#10b981', glow: '#10b98144' },
}

const DEFAULT_NODES = [
  {
    id: 'self-1',
    type: 'ifsNode',
    position: { x: 350, y: 250 },
    data: {
      label: 'Self',
      partType: 'self',
      emotion: 'Calma, curiosidad, compasión',
      role: 'Centro de conciencia',
      message: 'Estoy aquí para todos',
      notes: '',
    },
  },
]

const DEFAULT_EDGES = []

function loadState() {
  try {
    const raw = localStorage.getItem('ifs-map-state')
    if (raw) return JSON.parse(raw)
  } catch (_) {}
  return null
}

function saveState(nodes, edges) {
  try {
    localStorage.setItem('ifs-map-state', JSON.stringify({ nodes, edges }))
  } catch (_) {}
}

const saved = loadState()

export const useStore = create((set, get) => ({
  nodes: saved?.nodes ?? DEFAULT_NODES,
  edges: saved?.edges ?? DEFAULT_EDGES,
  selectedNodeId: null,
  panelOpen: false,
  partTypes: PART_TYPES,

  onNodesChange: (changes) => {
    const nodes = applyNodeChanges(changes, get().nodes)
    set({ nodes })
    saveState(nodes, get().edges)
  },

  onEdgesChange: (changes) => {
    const edges = applyEdgeChanges(changes, get().edges)
    set({ edges })
    saveState(get().nodes, edges)
  },

  onConnect: (connection) => {
    const newEdge = {
      ...connection,
      id: `e-${Date.now()}`,
      animated: true,
      style: { stroke: '#ffffff22', strokeWidth: 1.5 },
    }
    const edges = [...get().edges, newEdge]
    set({ edges })
    saveState(get().nodes, edges)
  },

  selectNode: (id) => set({ selectedNodeId: id, panelOpen: true }),

  closePanel: () => set({ panelOpen: false, selectedNodeId: null }),

  addPart: (partType = 'manager') => {
    const id = `part-${Date.now()}`
    const newNode = {
      id,
      type: 'ifsNode',
      position: { x: 100 + Math.random() * 400, y: 100 + Math.random() * 300 },
      data: {
        label: 'Nueva parte',
        partType,
        emotion: '',
        role: '',
        message: '',
        notes: '',
      },
    }
    const nodes = [...get().nodes, newNode]
    set({ nodes, selectedNodeId: id, panelOpen: true })
    saveState(nodes, get().edges)
  },

  updateNodeData: (id, data) => {
    const nodes = get().nodes.map((n) =>
      n.id === id ? { ...n, data: { ...n.data, ...data } } : n
    )
    set({ nodes })
    saveState(nodes, get().edges)
  },

  deleteNode: (id) => {
    const nodes = get().nodes.filter((n) => n.id !== id)
    const edges = get().edges.filter((e) => e.source !== id && e.target !== id)
    set({ nodes, edges, selectedNodeId: null, panelOpen: false })
    saveState(nodes, edges)
  },
}))

export { PART_TYPES }

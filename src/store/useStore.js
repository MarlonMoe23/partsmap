import { create } from 'zustand'
import { applyNodeChanges, applyEdgeChanges } from '@xyflow/react'
import { supabase } from '../supabase'

export const PART_TYPES = {
  self:        { label: 'Self',        color: '#c9a050', glow: '#c9a05022' },
  manager:     { label: 'Manager',     color: '#e07830', glow: '#e0783022' },
  firefighter: { label: 'Firefighter', color: '#cc3333', glow: '#cc333322' },
  exile:       { label: 'Exile',       color: '#4a9aba', glow: '#4a9aba22' },
}

// Convierte una fila de Supabase → nodo de React Flow
function rowToNode(row) {
  return {
    id: row.id,
    type: 'ifsNode',
    position: { x: row.position_x ?? 0, y: row.position_y ?? 0 },
    data: {
      label:       row.label       ?? '',
      partType:    row.part_type   ?? 'manager',
      emotion:     row.emotion     ?? '',
      role:        row.role        ?? '',
      message:     row.message     ?? '',
      notes:       row.notes       ?? '',
      age:         row.age         ?? '',
      estado:      row.estado      ?? 'Desconocido',
      origen:      row.origen      ?? '',
      activadores: row.activadores ?? '',
      protege:     row.protege     ?? '',
      polarizada:  row.polarizada  ?? '',
      teme:        row.teme        ?? '',
      quiere:      row.quiere      ?? '',
      necesita:    row.necesita    ?? '',
      estrategias: row.estrategias ?? '',
    },
  }
}

// Convierte un nodo de React Flow → fila de Supabase
function nodeToRow(node) {
  return {
    id:           node.id,
    label:        node.data.label,
    part_type:    node.data.partType,
    emotion:      node.data.emotion,
    role:         node.data.role,
    message:      node.data.message,
    notes:        node.data.notes,
    age:          node.data.age,
    estado:       node.data.estado,
    origen:       node.data.origen,
    activadores:  node.data.activadores,
    protege:      node.data.protege,
    polarizada:   node.data.polarizada,
    teme:         node.data.teme,
    quiere:       node.data.quiere,
    necesita:     node.data.necesita,
    estrategias:  node.data.estrategias,
    position_x:   node.position.x,
    position_y:   node.position.y,
  }
}

export const useStore = create((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  panelOpen: false,
  loading: true,
  partTypes: PART_TYPES,

  // ── Carga inicial desde Supabase ──────────────────────
  loadFromDB: async () => {
    set({ loading: true })

    const [{ data: parts }, { data: edges }] = await Promise.all([
      supabase.from('parts').select('*'),
      supabase.from('edges').select('*'),
    ])

    const nodes = (parts ?? []).map(rowToNode)

    // Si no hay nada en DB, creamos el nodo Self inicial
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
      await supabase.from('parts').insert(nodeToRow(selfNode))
      set({ nodes: [selfNode], edges: [], loading: false })
      return
    }

    const flowEdges = (edges ?? []).map((e) => {
      const isPolar = e.source_handle === 'left' || e.source_handle === 'right'
        || e.target_handle === 'left' || e.target_handle === 'right'
      return {
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.source_handle ?? null,
        targetHandle: e.target_handle ?? null,
        animated: isPolar,
        style: isPolar
          ? { stroke: '#cc3333', strokeWidth: 2, strokeDasharray: '6 3' }
          : { stroke: '#e8a000', strokeWidth: 2.5 },
      }
    })

    set({ nodes, edges: flowEdges, loading: false })
  },

  // ── Cambios de posición (drag) ────────────────────────
  onNodesChange: (changes) => {
    const nodes = applyNodeChanges(changes, get().nodes)
    set({ nodes })

    // Guarda posición en Supabase solo al soltar (type: 'position' + !dragging)
    const posChanges = changes.filter((c) => c.type === 'position' && c.dragging === false)
    posChanges.forEach(async (c) => {
      const node = nodes.find((n) => n.id === c.id)
      if (node) {
        await supabase.from('parts').update({
          position_x: node.position.x,
          position_y: node.position.y,
        }).eq('id', node.id)
      }
    })
  },

  onEdgesChange: async (changes) => {
    const removed = changes.filter((c) => c.type === 'remove')
    set({ edges: applyEdgeChanges(changes, get().edges) })
    for (const c of removed) {
      await supabase.from('edges').delete().eq('id', c.id)
    }
  },

  deleteEdge: async (id) => {
    set({ edges: get().edges.filter((e) => e.id !== id) })
    await supabase.from('edges').delete().eq('id', id)
  },

  onConnect: async (connection) => {
    const isPolar = connection.sourceHandle === 'left' || connection.sourceHandle === 'right'
      || connection.targetHandle === 'left' || connection.targetHandle === 'right'

    const newEdge = {
      id: `e-${Date.now()}`,
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle,
      targetHandle: connection.targetHandle,
      animated: isPolar,
      type: isPolar ? 'default' : 'default',
      style: isPolar
        ? { stroke: '#cc3333', strokeWidth: 2, strokeDasharray: '6 3' }
        : { stroke: '#e8a000', strokeWidth: 2.5 },
      data: { polar: isPolar },
    }
    set({ edges: [...get().edges, newEdge] })
    await supabase.from('edges').insert({
      id: newEdge.id,
      source: newEdge.source,
      target: newEdge.target,
      source_handle: connection.sourceHandle ?? null,
      target_handle: connection.targetHandle ?? null,
    })
  },

  selectNode: (id) => set({ selectedNodeId: id, panelOpen: true }),
  closePanel: () => set({ panelOpen: false, selectedNodeId: null }),

  // ── Agregar parte ─────────────────────────────────────
  addPart: async (partType = 'manager') => {
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
    await supabase.from('parts').insert(nodeToRow(newNode))
  },

  // ── Actualizar datos de una parte ─────────────────────
  updateNodeData: async (id, data) => {
    const nodes = get().nodes.map((n) =>
      n.id === id ? { ...n, data: { ...n.data, ...data } } : n
    )
    set({ nodes })

    const node = nodes.find((n) => n.id === id)
    await supabase.from('parts').update(nodeToRow(node)).eq('id', id)
  },

  // ── Eliminar parte ────────────────────────────────────
  deleteNode: async (id) => {
    set({
      nodes: get().nodes.filter((n) => n.id !== id),
      edges: get().edges.filter((e) => e.source !== id && e.target !== id),
      selectedNodeId: null,
      panelOpen: false,
    })
    await supabase.from('parts').delete().eq('id', id)
  },
}))

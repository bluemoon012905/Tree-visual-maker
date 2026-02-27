import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

type EdgeType = 'next' | 'previous' | 'undirected'
type StatKind = 'quantitative' | 'qualitative'

type Tag = {
  id: string
  name: string
  color: string
  visible: boolean
  rootNodeId: string | null
  stats: {
    quantitative: Record<string, number>
    qualitative: Record<string, string>
  }
}

type NodeData = {
  id: string
  name: string
  tagIds: string[]
  stats: {
    quantitative: Record<string, number>
    qualitative: Record<string, string>
  }
  description: string
}

type EdgeData = {
  id: string
  from: string
  to: string
  type: EdgeType
}

type ProjectData = {
  tags: Tag[]
  nodes: NodeData[]
  edges: EdgeData[]
  statStyles: StatStyle[]
  viewState: {
    viewport: ViewportState
    manualNodePositions: Record<string, { x: number; y: number }>
    showRootNodesOnly: boolean
  }
}

type StatStyle = {
  id: string
  key: string
  kind: StatKind
  color: string
}

type PositionedNode = {
  node: NodeData
  x: number
  y: number
}

type ThemeMode = 'light' | 'turtle-night'
type ViewMode = 'graph' | 'list'
type CollapsibleSection = 'project' | 'tags' | 'stats'
type ViewportState = { scale: number; tx: number; ty: number }

const WIDTH = 980
const HEIGHT = 680
const NODE_RADIUS = 26
const NODE_FONT_SIZE = Math.round(NODE_RADIUS * 0.42)
const NODE_TEXT_Y = Math.round(NODE_FONT_SIZE * 0.36)

const SAMPLE_DATA: ProjectData = {
  tags: [
    {
      id: 'tag_magic',
      name: 'Fire',
      color: '#ef5b2f',
      visible: true,
      rootNodeId: 'node_fire_1',
      stats: { quantitative: {}, qualitative: {} },
    },
    {
      id: 'tag_fire',
      name: 'Water',
      color: '#2c75f5',
      visible: true,
      rootNodeId: 'node_water_1',
      stats: { quantitative: {}, qualitative: {} },
    },
    {
      id: 'tag_ranged',
      name: 'Earth',
      color: '#7f8c3b',
      visible: true,
      rootNodeId: 'node_earth_1',
      stats: { quantitative: {}, qualitative: {} },
    },
    {
      id: 'tag_support',
      name: 'Air',
      color: '#76b9d8',
      visible: true,
      rootNodeId: 'node_air_1',
      stats: { quantitative: {}, qualitative: {} },
    },
    {
      id: 'tag_lightning',
      name: 'Lightning',
      color: '#f6d447',
      visible: true,
      rootNodeId: 'node_lightning_1',
      stats: { quantitative: {}, qualitative: {} },
    },
    {
      id: 'tag_sword',
      name: 'Sword',
      color: '#8f9aaa',
      visible: true,
      rootNodeId: 'node_sword_1',
      stats: { quantitative: {}, qualitative: {} },
    },
  ],
  nodes: [
    {
      id: 'node_fire_1',
      name: 'fire_1',
      tagIds: ['tag_magic'],
      stats: {
        quantitative: { damage: 16, mana: 8, defense: 6 },
        qualitative: {},
      },
      description: 'Fire starter branch.',
    },
    {
      id: 'node_fire_2',
      name: 'fire_2',
      tagIds: ['tag_magic'],
      stats: {
        quantitative: { damage: 26, mana: 13, defense: 10 },
        qualitative: {},
      },
      description: 'Mid fire branch.',
    },
    {
      id: 'node_fire_3',
      name: 'fire_3',
      tagIds: ['tag_magic'],
      stats: {
        quantitative: { damage: 36, mana: 18, defense: 13 },
        qualitative: {},
      },
      description: 'Late fire branch.',
    },
    {
      id: 'node_water_1',
      name: 'water_1',
      tagIds: ['tag_fire'],
      stats: {
        quantitative: { damage: 14, mana: 10, defense: 9 },
        qualitative: {},
      },
      description: 'Water starter branch.',
    },
    {
      id: 'node_water_2',
      name: 'water_2',
      tagIds: ['tag_fire'],
      stats: {
        quantitative: { damage: 24, mana: 14, defense: 12 },
        qualitative: {},
      },
      description: 'Mid water branch.',
    },
    {
      id: 'node_water_3',
      name: 'water_3',
      tagIds: ['tag_fire'],
      stats: {
        quantitative: { damage: 31, mana: 20, defense: 16 },
        qualitative: {},
      },
      description: 'Late water branch.',
    },
    {
      id: 'node_earth_1',
      name: 'earth_1',
      tagIds: ['tag_ranged'],
      stats: {
        quantitative: { damage: 11, mana: 7, defense: 13 },
        qualitative: {},
      },
      description: 'Earth starter branch.',
    },
    {
      id: 'node_earth_2',
      name: 'earth_2',
      tagIds: ['tag_ranged'],
      stats: {
        quantitative: { damage: 20, mana: 10, defense: 18 },
        qualitative: {},
      },
      description: 'Mid earth branch.',
    },
    {
      id: 'node_earth_3',
      name: 'earth_3',
      tagIds: ['tag_ranged'],
      stats: {
        quantitative: { damage: 30, mana: 14, defense: 24 },
        qualitative: {},
      },
      description: 'Late earth branch.',
    },
    {
      id: 'node_air_1',
      name: 'air_1',
      tagIds: ['tag_support'],
      stats: {
        quantitative: { damage: 13, mana: 12, defense: 7 },
        qualitative: {},
      },
      description: 'Air starter branch.',
    },
    {
      id: 'node_air_2',
      name: 'air_2',
      tagIds: ['tag_support'],
      stats: {
        quantitative: { damage: 22, mana: 16, defense: 11 },
        qualitative: {},
      },
      description: 'Mid air branch.',
    },
    {
      id: 'node_air_3',
      name: 'air_3',
      tagIds: ['tag_support'],
      stats: {
        quantitative: { damage: 32, mana: 22, defense: 14 },
        qualitative: {},
      },
      description: 'Late air branch.',
    },
    {
      id: 'node_lightning_1',
      name: 'lightning_1',
      tagIds: ['tag_lightning'],
      stats: {
        quantitative: { damage: 18, mana: 11, defense: 5 },
        qualitative: {},
      },
      description: 'Lightning starter branch.',
    },
    {
      id: 'node_lightning_2',
      name: 'lightning_2',
      tagIds: ['tag_lightning'],
      stats: {
        quantitative: { damage: 29, mana: 15, defense: 8 },
        qualitative: {},
      },
      description: 'Mid lightning branch.',
    },
    {
      id: 'node_lightning_3',
      name: 'lightning_3',
      tagIds: ['tag_lightning'],
      stats: {
        quantitative: { damage: 42, mana: 20, defense: 10 },
        qualitative: {},
      },
      description: 'Late lightning branch.',
    },
    {
      id: 'node_sword_1',
      name: 'sword_1',
      tagIds: ['tag_sword', 'tag_magic', 'tag_fire', 'tag_ranged', 'tag_support', 'tag_lightning'],
      stats: {
        quantitative: { damage: 17, mana: 5, defense: 12 },
        qualitative: {},
      },
      description: 'Base sword line root.',
    },
    {
      id: 'node_sword_2',
      name: 'sword_2',
      tagIds: ['tag_sword', 'tag_magic', 'tag_fire'],
      stats: {
        quantitative: { damage: 25, mana: 7, defense: 15 },
        qualitative: {},
      },
      description: 'Second sword layer.',
    },
    {
      id: 'node_sword_3',
      name: 'sword_3',
      tagIds: ['tag_sword', 'tag_ranged', 'tag_support'],
      stats: {
        quantitative: { damage: 34, mana: 9, defense: 18 },
        qualitative: {},
      },
      description: 'Third sword layer.',
    },
    {
      id: 'node_sword_3_fw',
      name: 'sword_3_fw',
      tagIds: ['tag_sword', 'tag_magic', 'tag_fire'],
      stats: {
        quantitative: { damage: 38, mana: 12, defense: 19 },
        qualitative: {},
      },
      description: 'Sword layer crossing fire and water.',
    },
    {
      id: 'node_sword_3_ea',
      name: 'sword_3_ea',
      tagIds: ['tag_sword', 'tag_ranged', 'tag_support'],
      stats: {
        quantitative: { damage: 36, mana: 11, defense: 21 },
        qualitative: {},
      },
      description: 'Sword layer crossing earth and air.',
    },
    {
      id: 'node_sword_4_lf',
      name: 'sword_4_lf',
      tagIds: ['tag_sword', 'tag_lightning', 'tag_magic'],
      stats: {
        quantitative: { damage: 48, mana: 16, defense: 23 },
        qualitative: {},
      },
      description: 'Sword layer crossing lightning and fire.',
    },
  ],
  edges: [
    { id: 'edge_fire_1', from: 'node_fire_1', to: 'node_fire_2', type: 'next' },
    { id: 'edge_fire_2', from: 'node_fire_2', to: 'node_fire_3', type: 'next' },
    { id: 'edge_water_1', from: 'node_water_1', to: 'node_water_2', type: 'next' },
    { id: 'edge_water_2', from: 'node_water_2', to: 'node_water_3', type: 'next' },
    { id: 'edge_earth_1', from: 'node_earth_1', to: 'node_earth_2', type: 'next' },
    { id: 'edge_earth_2', from: 'node_earth_2', to: 'node_earth_3', type: 'next' },
    { id: 'edge_air_1', from: 'node_air_1', to: 'node_air_2', type: 'next' },
    { id: 'edge_air_2', from: 'node_air_2', to: 'node_air_3', type: 'next' },
    { id: 'edge_light_1', from: 'node_lightning_1', to: 'node_lightning_2', type: 'next' },
    { id: 'edge_light_2', from: 'node_lightning_2', to: 'node_lightning_3', type: 'next' },
    { id: 'edge_sword_1', from: 'node_sword_1', to: 'node_sword_2', type: 'next' },
    { id: 'edge_sword_2', from: 'node_sword_2', to: 'node_sword_3', type: 'next' },
    { id: 'edge_sword_branch_fire', from: 'node_sword_1', to: 'node_fire_1', type: 'next' },
    { id: 'edge_sword_branch_water', from: 'node_sword_1', to: 'node_water_1', type: 'next' },
    { id: 'edge_sword_branch_earth', from: 'node_sword_1', to: 'node_earth_1', type: 'next' },
    { id: 'edge_sword_branch_air', from: 'node_sword_1', to: 'node_air_1', type: 'next' },
    { id: 'edge_sword_branch_light', from: 'node_sword_1', to: 'node_lightning_1', type: 'next' },
    { id: 'edge_fw_prev_a', from: 'node_sword_2', to: 'node_sword_3_fw', type: 'previous' },
    { id: 'edge_fw_prev_b', from: 'node_sword_1', to: 'node_sword_3_fw', type: 'previous' },
    { id: 'edge_fw_from_fire', from: 'node_fire_2', to: 'node_sword_3_fw', type: 'next' },
    { id: 'edge_fw_from_water', from: 'node_water_2', to: 'node_sword_3_fw', type: 'next' },
    { id: 'edge_fw_back_fire', from: 'node_sword_3_fw', to: 'node_fire_3', type: 'next' },
    { id: 'edge_fw_back_water', from: 'node_sword_3_fw', to: 'node_water_3', type: 'next' },
    { id: 'edge_ea_prev', from: 'node_sword_2', to: 'node_sword_3_ea', type: 'previous' },
    { id: 'edge_ea_from_earth', from: 'node_earth_2', to: 'node_sword_3_ea', type: 'next' },
    { id: 'edge_ea_from_air', from: 'node_air_2', to: 'node_sword_3_ea', type: 'next' },
    { id: 'edge_ea_back_earth', from: 'node_sword_3_ea', to: 'node_earth_3', type: 'next' },
    { id: 'edge_ea_back_air', from: 'node_sword_3_ea', to: 'node_air_3', type: 'next' },
    { id: 'edge_lf_prev_a', from: 'node_sword_3', to: 'node_sword_4_lf', type: 'previous' },
    { id: 'edge_lf_prev_b', from: 'node_sword_3_fw', to: 'node_sword_4_lf', type: 'previous' },
    { id: 'edge_lf_from_light', from: 'node_lightning_3', to: 'node_sword_4_lf', type: 'next' },
    { id: 'edge_lf_from_fire', from: 'node_fire_3', to: 'node_sword_4_lf', type: 'next' },
  ],
  statStyles: [
    { id: 'style_damage', key: 'damage', kind: 'quantitative', color: '#ff9f9f' },
    { id: 'style_mana', key: 'mana', kind: 'quantitative', color: '#88c9ff' },
    { id: 'style_defense', key: 'defense', kind: 'quantitative', color: '#9be3a8' },
  ],
  viewState: {
    viewport: { scale: 1, tx: 0, ty: 0 },
    manualNodePositions: {},
    showRootNodesOnly: false,
  },
}

const STARTER_TEMPLATE: ProjectData = {
  tags: [
    {
      id: 'tag_alpha',
      name: 'Tag Alpha',
      color: '#4f7cff',
      visible: true,
      rootNodeId: 'node_alpha_root',
      stats: { quantitative: {}, qualitative: {} },
    },
    {
      id: 'tag_beta',
      name: 'Tag Beta',
      color: '#2ea06e',
      visible: true,
      rootNodeId: 'node_beta_root',
      stats: { quantitative: {}, qualitative: {} },
    },
    {
      id: 'tag_gamma',
      name: 'Tag Gamma',
      color: '#d57c2f',
      visible: true,
      rootNodeId: 'node_gamma_root',
      stats: { quantitative: {}, qualitative: {} },
    },
  ],
  nodes: [
    {
      id: 'node_alpha_root',
      name: 'root node 1',
      tagIds: ['tag_alpha'],
      stats: { quantitative: { damage: 10 }, qualitative: {} },
      description: 'Starter root node.',
    },
    {
      id: 'node_alpha_child',
      name: 'child node 1',
      tagIds: ['tag_alpha'],
      stats: { quantitative: { damage: 16 }, qualitative: {} },
      description: 'Starter child node.',
    },
    {
      id: 'node_beta_root',
      name: 'root node 2',
      tagIds: ['tag_beta'],
      stats: { quantitative: { damage: 11 }, qualitative: {} },
      description: 'Starter root node.',
    },
    {
      id: 'node_beta_child',
      name: 'child node 2',
      tagIds: ['tag_beta'],
      stats: { quantitative: { damage: 17 }, qualitative: {} },
      description: 'Starter child node.',
    },
    {
      id: 'node_gamma_root',
      name: 'root node 3',
      tagIds: ['tag_gamma'],
      stats: { quantitative: { damage: 12 }, qualitative: {} },
      description: 'Starter root node.',
    },
    {
      id: 'node_gamma_child',
      name: 'child node 3',
      tagIds: ['tag_gamma'],
      stats: { quantitative: { damage: 18 }, qualitative: {} },
      description: 'Starter child node.',
    },
  ],
  edges: [
    { id: 'edge_alpha', from: 'node_alpha_root', to: 'node_alpha_child', type: 'next' },
    { id: 'edge_beta', from: 'node_beta_root', to: 'node_beta_child', type: 'next' },
    { id: 'edge_gamma', from: 'node_gamma_root', to: 'node_gamma_child', type: 'next' },
  ],
  statStyles: [{ id: 'style_damage', key: 'damage', kind: 'quantitative', color: '#ff9f9f' }],
  viewState: {
    viewport: { scale: 1, tx: 0, ty: 0 },
    manualNodePositions: {},
    showRootNodesOnly: false,
  },
}

const BLANK_PROJECT: ProjectData = {
  tags: [],
  nodes: [],
  edges: [],
  statStyles: [],
  viewState: {
    viewport: { scale: 1, tx: 0, ty: 0 },
    manualNodePositions: {},
    showRootNodesOnly: false,
  },
}

function createId(prefix: string) {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}_${crypto.randomUUID().slice(0, 8)}`
  }
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}

function hashToUnit(seed: string) {
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  }
  return (hash % 1000) / 1000
}

function jaccardSimilarity(a: string[], b: string[]) {
  if (a.length === 0 && b.length === 0) {
    return 0
  }
  const aSet = new Set(a)
  const bSet = new Set(b)
  let intersection = 0
  for (const value of aSet) {
    if (bSet.has(value)) {
      intersection += 1
    }
  }
  const union = new Set([...aSet, ...bSet]).size
  return union === 0 ? 0 : intersection / union
}

function edgeColor(type: EdgeType) {
  if (type === 'next') return '#0c63e7'
  if (type === 'previous') return '#b02f6b'
  return '#6f7f90'
}

function normalizeProject(input: ProjectData): ProjectData {
  const tags = (input.tags ?? []).map((tag) => {
    const quantitative: Record<string, number> = {}
    for (const key of Object.keys(tag.stats?.quantitative ?? {})) {
      const numeric = Number(tag.stats?.quantitative?.[key])
      if (Number.isFinite(numeric)) {
        quantitative[key] = numeric
      }
    }
    const qualitative = Object.fromEntries(
      Object.entries(tag.stats?.qualitative ?? {}).map(([key, value]) => [key, String(value)]),
    )

    return {
      id: String(tag.id ?? createId('tag')),
      name: String(tag.name ?? 'New Tag'),
      color: String(tag.color ?? '#4577ff'),
      visible: Boolean(tag.visible ?? true),
      rootNodeId: tag.rootNodeId ? String(tag.rootNodeId) : null,
      stats: {
        quantitative,
        qualitative,
      },
    }
  })
  const tagIds = new Set(tags.map((tag) => tag.id))

  const nodes = (input.nodes ?? []).map((node) => {
    const quantitative: Record<string, number> = {}
    const qualitative: Record<string, string> = {}

    const rawQuantitative = node.stats?.quantitative ?? {}
    for (const key of Object.keys(rawQuantitative)) {
      const value = Number(rawQuantitative[key])
      if (Number.isFinite(value)) {
        quantitative[key] = value
      }
    }

    const rawQualitative = node.stats?.qualitative ?? {}
    for (const key of Object.keys(rawQualitative)) {
      qualitative[key] = String(rawQualitative[key])
    }

    const validTagIds = (node.tagIds ?? []).filter((id) => tagIds.has(id))

    return {
      id: String(node.id ?? createId('node')),
      name: String(node.name ?? 'New Node'),
      tagIds: validTagIds,
      stats: { quantitative, qualitative },
      description: String(node.description ?? ''),
    }
  })

  const nodeIds = new Set(nodes.map((node) => node.id))
  const edges = (input.edges ?? [])
    .filter((edge) => nodeIds.has(edge.from) && nodeIds.has(edge.to))
    .map((edge) => ({
      id: String(edge.id ?? createId('edge')),
      from: String(edge.from),
      to: String(edge.to),
      type:
        edge.type === 'next' || edge.type === 'previous' || edge.type === 'undirected'
          ? edge.type
          : 'undirected',
    }))

  const statStyles = (input.statStyles ?? []).map((style) => ({
    id: String(style.id ?? createId('style')),
    key: String(style.key ?? '').trim(),
    kind: (style.kind === 'quantitative' ? 'quantitative' : 'qualitative') as StatKind,
    color: String(style.color ?? '#9fb2d9'),
  }))

  const rawManualPositions = input.viewState?.manualNodePositions ?? {}
  const manualNodePositions = Object.fromEntries(
    Object.entries(rawManualPositions)
      .filter(([nodeId]) => nodeIds.has(nodeId))
      .map(([nodeId, point]) => [
        nodeId,
        {
          x: Number.isFinite(Number(point?.x)) ? Number(point.x) : WIDTH / 2,
          y: Number.isFinite(Number(point?.y)) ? Number(point.y) : HEIGHT / 2,
        },
      ]),
  ) as Record<string, { x: number; y: number }>
  const rawViewport = input.viewState?.viewport
  const viewState = {
    viewport: {
      scale: Math.max(0.45, Math.min(3.2, Number(rawViewport?.scale) || 1)),
      tx: Number(rawViewport?.tx) || 0,
      ty: Number(rawViewport?.ty) || 0,
    },
    manualNodePositions,
    showRootNodesOnly: Boolean(input.viewState?.showRootNodesOnly ?? false),
  }

  const normalizedTags = tags.map((tag) => ({
    ...tag,
    rootNodeId: tag.rootNodeId && nodeIds.has(tag.rootNodeId) ? tag.rootNodeId : null,
  }))

  return { tags: normalizedTags, nodes, edges, statStyles, viewState }
}

function sortProjectForExport(project: ProjectData): ProjectData {
  const tags = [...project.tags]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((tag) => ({
      ...tag,
      stats: {
        quantitative: Object.fromEntries(
          Object.entries(tag.stats.quantitative).sort(([a], [b]) => a.localeCompare(b)),
        ),
        qualitative: Object.fromEntries(
          Object.entries(tag.stats.qualitative).sort(([a], [b]) => a.localeCompare(b)),
        ),
      },
    }))
  const nodes = [...project.nodes]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((node) => ({
      ...node,
      tagIds: [...node.tagIds].sort((a, b) => a.localeCompare(b)),
      stats: {
        quantitative: Object.fromEntries(
          Object.entries(node.stats.quantitative).sort(([a], [b]) => a.localeCompare(b)),
        ),
        qualitative: Object.fromEntries(
          Object.entries(node.stats.qualitative).sort(([a], [b]) => a.localeCompare(b)),
        ),
      },
    }))
  const edges = [...project.edges].sort((a, b) => a.id.localeCompare(b.id))
  const statStyles = [...project.statStyles].sort((a, b) => a.id.localeCompare(b.id))
  const viewState = {
    viewport: {
      scale: project.viewState.viewport.scale,
      tx: project.viewState.viewport.tx,
      ty: project.viewState.viewport.ty,
    },
    manualNodePositions: Object.fromEntries(
      Object.entries(project.viewState.manualNodePositions).sort(([a], [b]) => a.localeCompare(b)),
    ),
    showRootNodesOnly: project.viewState.showRootNodesOnly,
  }

  return { tags, nodes, edges, statStyles, viewState }
}

function computeLayout(nodes: NodeData[], edges: EdgeData[]): PositionedNode[] {
  if (nodes.length === 0) {
    return []
  }

  const state = nodes.map((node, index) => ({
    node,
    x: 130 + hashToUnit(`${node.id}:x`) * (WIDTH - 260),
    y: 100 + hashToUnit(`${node.id}:y`) * (HEIGHT - 200),
    vx: 0,
    vy: 0,
    index,
  }))

  const byId = new Map(state.map((item) => [item.node.id, item]))

  for (let step = 0; step < 220; step += 1) {
    for (const item of state) {
      item.vx *= 0.87
      item.vy *= 0.87

      const cx = WIDTH / 2
      const cy = HEIGHT / 2
      item.vx += (cx - item.x) * 0.0009
      item.vy += (cy - item.y) * 0.0009
    }

    for (let i = 0; i < state.length; i += 1) {
      for (let j = i + 1; j < state.length; j += 1) {
        const a = state[i]
        const b = state[j]
        const dx = b.x - a.x
        const dy = b.y - a.y
        const distSq = dx * dx + dy * dy + 0.01
        const dist = Math.sqrt(distSq)

        const repulse = 8200 / distSq
        const rx = (dx / dist) * repulse
        const ry = (dy / dist) * repulse
        a.vx -= rx
        a.vy -= ry
        b.vx += rx
        b.vy += ry

        const similarity = jaccardSimilarity(a.node.tagIds, b.node.tagIds)
        if (similarity > 0) {
          const targetDist = 250 - similarity * 170
          const spring = (dist - targetDist) * 0.013 * similarity
          const sx = (dx / dist) * spring
          const sy = (dy / dist) * spring
          a.vx += sx
          a.vy += sy
          b.vx -= sx
          b.vy -= sy
        }
      }
    }

    for (const edge of edges) {
      const from = byId.get(edge.from)
      const to = byId.get(edge.to)
      if (!from || !to) {
        continue
      }
      const dx = to.x - from.x
      const dy = to.y - from.y
      const dist = Math.sqrt(dx * dx + dy * dy) + 0.01
      const targetDist = 165
      const spring = (dist - targetDist) * 0.017
      const sx = (dx / dist) * spring
      const sy = (dy / dist) * spring
      from.vx += sx
      from.vy += sy
      to.vx -= sx
      to.vy -= sy
    }

    for (const item of state) {
      item.x += item.vx
      item.y += item.vy
      item.x = Math.max(45, Math.min(WIDTH - 45, item.x))
      item.y = Math.max(45, Math.min(HEIGHT - 45, item.y))
    }
  }

  return state.map((item) => ({ node: item.node, x: item.x, y: item.y }))
}

function segmentsIntersect(
  a1: { x: number; y: number },
  a2: { x: number; y: number },
  b1: { x: number; y: number },
  b2: { x: number; y: number },
) {
  const orient = (p: { x: number; y: number }, q: { x: number; y: number }, r: { x: number; y: number }) =>
    (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y)

  const o1 = orient(a1, a2, b1)
  const o2 = orient(a1, a2, b2)
  const o3 = orient(b1, b2, a1)
  const o4 = orient(b1, b2, a2)
  return o1 * o2 < 0 && o3 * o4 < 0
}

function untangleLayout(initial: PositionedNode[], edges: EdgeData[]) {
  if (initial.length === 0) {
    return []
  }

  const state = initial.map((item) => ({
    node: item.node,
    x: item.x,
    y: item.y,
    vx: 0,
    vy: 0,
  }))
  const byId = new Map(state.map((item) => [item.node.id, item]))

  for (let step = 0; step < 120; step += 1) {
    for (const item of state) {
      item.vx *= 0.86
      item.vy *= 0.86
      item.vx += (WIDTH / 2 - item.x) * 0.0008
      item.vy += (HEIGHT / 2 - item.y) * 0.0008
    }

    for (let i = 0; i < state.length; i += 1) {
      for (let j = i + 1; j < state.length; j += 1) {
        const a = state[i]
        const b = state[j]
        const dx = b.x - a.x
        const dy = b.y - a.y
        const distSq = dx * dx + dy * dy + 0.01
        const dist = Math.sqrt(distSq)
        const repulse = 6200 / distSq
        const rx = (dx / dist) * repulse
        const ry = (dy / dist) * repulse
        a.vx -= rx
        a.vy -= ry
        b.vx += rx
        b.vy += ry
      }
    }

    for (const edge of edges) {
      const from = byId.get(edge.from)
      const to = byId.get(edge.to)
      if (!from || !to) continue
      const dx = to.x - from.x
      const dy = to.y - from.y
      const dist = Math.sqrt(dx * dx + dy * dy) + 0.01
      const targetDist = 165
      const spring = (dist - targetDist) * 0.015
      const sx = (dx / dist) * spring
      const sy = (dy / dist) * spring
      from.vx += sx
      from.vy += sy
      to.vx -= sx
      to.vy -= sy
    }

    for (let i = 0; i < edges.length; i += 1) {
      for (let j = i + 1; j < edges.length; j += 1) {
        const e1 = edges[i]
        const e2 = edges[j]
        if (
          e1.from === e2.from ||
          e1.from === e2.to ||
          e1.to === e2.from ||
          e1.to === e2.to
        ) {
          continue
        }
        const a1 = byId.get(e1.from)
        const a2 = byId.get(e1.to)
        const b1 = byId.get(e2.from)
        const b2 = byId.get(e2.to)
        if (!a1 || !a2 || !b1 || !b2) continue

        if (segmentsIntersect(a1, a2, b1, b2)) {
          a1.vx -= 1.5
          a1.vy -= 1.5
          a2.vx += 1.5
          a2.vy += 1.5
          b1.vx += 1.5
          b1.vy -= 1.5
          b2.vx -= 1.5
          b2.vy += 1.5
        }
      }
    }

    for (const item of state) {
      item.x = Math.max(45, Math.min(WIDTH - 45, item.x + item.vx))
      item.y = Math.max(45, Math.min(HEIGHT - 45, item.y + item.vy))
    }
  }

  return state.map((item) => ({ node: item.node, x: item.x, y: item.y }))
}

function App() {
  const [theme, setTheme] = useState<ThemeMode>('turtle-night')
  const [viewMode, setViewMode] = useState<ViewMode>('graph')
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1440,
  )
  const [sidebarWidth, setSidebarWidth] = useState(430)
  const [autoSaveView, setAutoSaveView] = useState(false)
  const [viewport, setViewport] = useState<ViewportState>({ scale: 1, tx: 0, ty: 0 })
  const [manualNodePositions, setManualNodePositions] = useState<Record<string, { x: number; y: number }>>({})
  const [project, setProject] = useState<ProjectData>(SAMPLE_DATA)
  const [loadedProjectSnapshot, setLoadedProjectSnapshot] = useState(() =>
    JSON.stringify(sortProjectForExport(SAMPLE_DATA)),
  )
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [isNodeEditorOpen, setIsNodeEditorOpen] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState('#4577ff')
  const [showTagStatsInTagsPanel, setShowTagStatsInTagsPanel] = useState(false)
  const [tagQuantDrafts, setTagQuantDrafts] = useState<Record<string, { key: string; value: string }>>({})
  const [tagQualDrafts, setTagQualDrafts] = useState<Record<string, { key: string; value: string }>>({})
  const [newStatKind, setNewStatKind] = useState<StatKind>('quantitative')
  const [newStatKey, setNewStatKey] = useState('')
  const [newStatColor, setNewStatColor] = useState('#9fb2d9')
  const [newEdgeTo, setNewEdgeTo] = useState('')
  const [newEdgeType, setNewEdgeType] = useState<EdgeType>('undirected')
  const [quantKey, setQuantKey] = useState('')
  const [quantValue, setQuantValue] = useState('')
  const [qualKey, setQualKey] = useState('')
  const [qualValue, setQualValue] = useState('')
  const [hover, setHover] = useState<{ nodeId: string; x: number; y: number } | null>(null)
  const [showRootNodesOnly, setShowRootNodesOnly] = useState(false)
  const [collapsedSections, setCollapsedSections] = useState<Record<CollapsibleSection, boolean>>({
    project: false,
    tags: false,
    stats: false,
  })

  const visibleTagIds = useMemo(
    () => new Set(project.tags.filter((tag) => tag.visible).map((tag) => tag.id)),
    [project.tags],
  )

  const visibleNodes = useMemo(() => {
    const hasVisibleTagFilter = visibleTagIds.size > 0
    const tagFilteredNodes = hasVisibleTagFilter
      ? project.nodes.filter((node) => node.tagIds.some((tagId) => visibleTagIds.has(tagId)))
      : project.nodes

    if (!showRootNodesOnly) {
      return tagFilteredNodes
    }

    const rootNodeIds = new Set(
      project.tags
        .filter((tag) => tag.visible && tag.rootNodeId)
        .map((tag) => tag.rootNodeId)
        .filter((id): id is string => Boolean(id)),
    )

    return tagFilteredNodes.filter((node) => rootNodeIds.has(node.id))
  }, [project.nodes, project.tags, showRootNodesOnly, visibleTagIds])

  const visibleNodeIds = useMemo(() => new Set(visibleNodes.map((node) => node.id)), [visibleNodes])

  const visibleEdges = useMemo(
    () =>
      project.edges.filter((edge) => visibleNodeIds.has(edge.from) && visibleNodeIds.has(edge.to)),
    [project.edges, visibleNodeIds],
  )

  const positions = useMemo(
    () => computeLayout(visibleNodes, visibleEdges),
    [visibleNodes, visibleEdges],
  )
  const interactivePositions = useMemo(
    () =>
      positions.map((item) => {
        const override = manualNodePositions[item.node.id]
        return override ? { ...item, ...override } : item
      }),
    [manualNodePositions, positions],
  )

  const selectedNode = useMemo(
    () => project.nodes.find((node) => node.id === selectedNodeId) ?? null,
    [project.nodes, selectedNodeId],
  )
  const selectedNodeEdges = useMemo(() => {
    if (!selectedNode) {
      return []
    }
    return project.edges.filter((edge) => edge.from === selectedNode.id || edge.to === selectedNode.id)
  }, [project.edges, selectedNode])

  const nodesById = useMemo(() => new Map(project.nodes.map((node) => [node.id, node])), [project.nodes])
  const tagById = useMemo(() => new Map(project.tags.map((tag) => [tag.id, tag])), [project.tags])
  const positionedById = useMemo(
    () => new Map(interactivePositions.map((item) => [item.node.id, item])),
    [interactivePositions],
  )
  const currentProjectSnapshot = useMemo(
    () => JSON.stringify(sortProjectForExport(project)),
    [project],
  )
  const hasUnsavedProjectChanges = currentProjectSnapshot !== loadedProjectSnapshot

  const hoveredNode = hover ? nodesById.get(hover.nodeId) ?? null : null
  const svgRef = useRef<SVGSVGElement | null>(null)
  const dragNodeIdRef = useRef<string | null>(null)
  const dragNodeOffsetRef = useRef({ x: 0, y: 0 })
  const isPanningRef = useRef(false)
  const panStartRef = useRef<{ x: number; y: number } | null>(null)
  const movedDuringDragRef = useRef(false)
  const minSidebarWidth = 320
  const maxSidebarWidth = useMemo(
    () => Math.max(620, Math.min(Math.floor(windowWidth * 0.8), windowWidth - 180)),
    [windowWidth],
  )
  const statStyleMap = useMemo(
    () => new Map(project.statStyles.map((style) => [`${style.kind}:${style.key}`, style.color])),
    [project.statStyles],
  )
  const hoveredNodeStatLines = useMemo(() => {
    if (!hoveredNode) {
      return []
    }
    return [
      ...Object.entries(hoveredNode.stats.quantitative).map(([key, value]) => ({
        id: `node:q:${key}`,
        text: `${key}: ${value}`,
        color: statStyleMap.get(`quantitative:${key}`),
      })),
      ...Object.entries(hoveredNode.stats.qualitative).map(([key, value]) => ({
        id: `node:s:${key}`,
        text: `${key}: ${value}`,
        color: statStyleMap.get(`qualitative:${key}`),
      })),
    ]
  }, [hoveredNode, statStyleMap])
  const hoveredTagStatLines = useMemo(() => {
    if (!hoveredNode) {
      return []
    }
    return hoveredNode.tagIds
      .map((id) => tagById.get(id))
      .filter((tag): tag is Tag => Boolean(tag))
      .flatMap((tag) => [
        ...Object.entries(tag.stats.quantitative).map(([key, value]) => ({
          id: `${tag.id}:q:${key}`,
          text: `[${tag.name}] ${key}: ${value}`,
          color: statStyleMap.get(`quantitative:${key}`),
        })),
        ...Object.entries(tag.stats.qualitative).map(([key, value]) => ({
          id: `${tag.id}:s:${key}`,
          text: `[${tag.name}] ${key}: ${value}`,
          color: statStyleMap.get(`qualitative:${key}`),
        })),
      ])
  }, [hoveredNode, statStyleMap, tagById])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    const onResize = () => {
      const nextWidth = window.innerWidth
      const nextMax = Math.max(620, Math.min(Math.floor(nextWidth * 0.8), nextWidth - 180))
      setWindowWidth(nextWidth)
      setSidebarWidth((current) => Math.max(minSidebarWidth, Math.min(nextMax, current)))
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    if (!autoSaveView) {
      return
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProject((current) => ({
      ...current,
      viewState: {
        viewport,
        manualNodePositions,
        showRootNodesOnly,
      },
    }))
  }, [autoSaveView, manualNodePositions, showRootNodesOnly, viewport])

  useEffect(() => {
    const endInteractions = () => {
      dragNodeIdRef.current = null
      isPanningRef.current = false
      panStartRef.current = null
      movedDuringDragRef.current = false
    }
    window.addEventListener('mouseup', endInteractions)
    return () => window.removeEventListener('mouseup', endInteractions)
  }, [])

  function clientToSvgPoint(clientX: number, clientY: number) {
    const svg = svgRef.current
    if (!svg) return null
    const rect = svg.getBoundingClientRect()
    const x = ((clientX - rect.left) / rect.width) * WIDTH
    const y = ((clientY - rect.top) / rect.height) * HEIGHT
    return { x, y }
  }

  function clientToWorld(clientX: number, clientY: number) {
    const point = clientToSvgPoint(clientX, clientY)
    if (!point) return null
    return {
      x: (point.x - viewport.tx) / viewport.scale,
      y: (point.y - viewport.ty) / viewport.scale,
    }
  }

  function beginNodeDrag(nodeId: string, clientX: number, clientY: number) {
    const point = clientToWorld(clientX, clientY)
    const positioned = positionedById.get(nodeId)
    if (!point || !positioned) {
      return
    }
    dragNodeIdRef.current = nodeId
    dragNodeOffsetRef.current = { x: point.x - positioned.x, y: point.y - positioned.y }
    movedDuringDragRef.current = false
  }

  function handleGraphMouseDown(clientX: number, clientY: number) {
    isPanningRef.current = true
    panStartRef.current = { x: clientX, y: clientY }
    movedDuringDragRef.current = false
  }

  function handleGraphMouseMove(clientX: number, clientY: number) {
    if (dragNodeIdRef.current) {
      const point = clientToWorld(clientX, clientY)
      if (!point) return
      movedDuringDragRef.current = true
      setManualNodePositions((current) => ({
        ...current,
        [dragNodeIdRef.current!]: {
          x: Math.max(45, Math.min(WIDTH - 45, point.x - dragNodeOffsetRef.current.x)),
          y: Math.max(45, Math.min(HEIGHT - 45, point.y - dragNodeOffsetRef.current.y)),
        },
      }))
      return
    }

    if (isPanningRef.current && panStartRef.current) {
      const svg = svgRef.current
      if (!svg) return
      const rect = svg.getBoundingClientRect()
      const dx = ((clientX - panStartRef.current.x) / rect.width) * WIDTH
      const dy = ((clientY - panStartRef.current.y) / rect.height) * HEIGHT
      if (Math.abs(dx) + Math.abs(dy) > 0.01) {
        movedDuringDragRef.current = true
      }
      panStartRef.current = { x: clientX, y: clientY }
      setViewport((current) => ({ ...current, tx: current.tx + dx, ty: current.ty + dy }))
    }
  }

  function handleGraphWheel(clientX: number, clientY: number, deltaY: number) {
    const point = clientToSvgPoint(clientX, clientY)
    if (!point) return
    setViewport((current) => {
      const nextScale = Math.max(0.45, Math.min(3.2, current.scale * (deltaY > 0 ? 0.92 : 1.08)))
      const worldX = (point.x - current.tx) / current.scale
      const worldY = (point.y - current.ty) / current.scale
      return {
        scale: nextScale,
        tx: point.x - worldX * nextScale,
        ty: point.y - worldY * nextScale,
      }
    })
  }

  function untangleCurrentView() {
    const untangled = untangleLayout(interactivePositions, visibleEdges)
    setManualNodePositions((current) => ({
      ...current,
      ...Object.fromEntries(untangled.map((item) => [item.node.id, { x: item.x, y: item.y }])),
    }))
  }

  function applyProjectViewState(nextProject: ProjectData) {
    setViewport(nextProject.viewState.viewport)
    setManualNodePositions(nextProject.viewState.manualNodePositions)
    setShowRootNodesOnly(nextProject.viewState.showRootNodesOnly)
  }

  function saveCurrentView() {
    setProject((current) => ({
      ...current,
      viewState: {
        viewport,
        manualNodePositions,
        showRootNodesOnly,
      },
    }))
  }

  function toggleSection(section: CollapsibleSection) {
    setCollapsedSections((current) => ({
      ...current,
      [section]: !current[section],
    }))
  }

  function addTag() {
    const trimmed = newTagName.trim()
    if (!trimmed) {
      return
    }

    const createdTag: Tag = {
      id: createId('tag'),
      name: trimmed,
      color: newTagColor,
      visible: true,
      rootNodeId: null,
      stats: { quantitative: {}, qualitative: {} },
    }

    setProject((current) => ({ ...current, tags: [...current.tags, createdTag] }))
    setNewTagName('')
  }

  function updateTag(id: string, patch: Partial<Tag>) {
    setProject((current) => ({
      ...current,
      tags: current.tags.map((tag) => (tag.id === id ? { ...tag, ...patch } : tag)),
    }))
  }

  function deleteTag(tagId: string) {
    setProject((current) => ({
      tags: current.tags.filter((tag) => tag.id !== tagId),
      nodes: current.nodes.map((node) => ({
        ...node,
        tagIds: node.tagIds.filter((id) => id !== tagId),
      })),
      edges: current.edges,
      statStyles: current.statStyles,
      viewState: current.viewState,
    }))
    setTagQuantDrafts((current) => {
      const next = { ...current }
      delete next[tagId]
      return next
    })
    setTagQualDrafts((current) => {
      const next = { ...current }
      delete next[tagId]
      return next
    })
  }

  function setTagQuantDraft(tagId: string, patch: Partial<{ key: string; value: string }>) {
    setTagQuantDrafts((current) => ({
      ...current,
      [tagId]: { key: current[tagId]?.key ?? '', value: current[tagId]?.value ?? '', ...patch },
    }))
  }

  function setTagQualDraft(tagId: string, patch: Partial<{ key: string; value: string }>) {
    setTagQualDrafts((current) => ({
      ...current,
      [tagId]: { key: current[tagId]?.key ?? '', value: current[tagId]?.value ?? '', ...patch },
    }))
  }

  function addTagQuantitativeStat(tag: Tag) {
    const draft = tagQuantDrafts[tag.id] ?? { key: '', value: '' }
    const key = draft.key.trim()
    const numeric = Number(draft.value)
    if (!key || !Number.isFinite(numeric)) {
      return
    }
    updateTag(tag.id, {
      stats: {
        ...tag.stats,
        quantitative: { ...tag.stats.quantitative, [key]: numeric },
      },
    })
    setTagQuantDraft(tag.id, { key: '', value: '' })
  }

  function removeTagQuantitativeStat(tag: Tag, key: string) {
    const next = { ...tag.stats.quantitative }
    delete next[key]
    updateTag(tag.id, {
      stats: {
        ...tag.stats,
        quantitative: next,
      },
    })
  }

  function addTagQualitativeStat(tag: Tag) {
    const draft = tagQualDrafts[tag.id] ?? { key: '', value: '' }
    const key = draft.key.trim()
    const value = draft.value.trim()
    if (!key || !value) {
      return
    }
    updateTag(tag.id, {
      stats: {
        ...tag.stats,
        qualitative: { ...tag.stats.qualitative, [key]: value },
      },
    })
    setTagQualDraft(tag.id, { key: '', value: '' })
  }

  function removeTagQualitativeStat(tag: Tag, key: string) {
    const next = { ...tag.stats.qualitative }
    delete next[key]
    updateTag(tag.id, {
      stats: {
        ...tag.stats,
        qualitative: next,
      },
    })
  }

  function addStatStyle() {
    const trimmedKey = newStatKey.trim()
    if (!trimmedKey) {
      return
    }
    setProject((current) => {
      const existing = current.statStyles.find(
        (style) => style.key === trimmedKey && style.kind === newStatKind,
      )
      if (existing) {
        return {
          ...current,
          statStyles: current.statStyles.map((style) =>
            style.id === existing.id ? { ...style, color: newStatColor } : style,
          ),
        }
      }
      return {
        ...current,
        statStyles: [
          ...current.statStyles,
          { id: createId('style'), key: trimmedKey, kind: newStatKind, color: newStatColor },
        ],
      }
    })
    setNewStatKey('')
  }

  function updateStatStyle(id: string, patch: Partial<StatStyle>) {
    setProject((current) => ({
      ...current,
      statStyles: current.statStyles.map((style) => (style.id === id ? { ...style, ...patch } : style)),
    }))
  }

  function deleteStatStyle(id: string) {
    setProject((current) => ({
      ...current,
      statStyles: current.statStyles.filter((style) => style.id !== id),
    }))
  }

  function addNode() {
    const createdNode: NodeData = {
      id: createId('node'),
      name: 'New Node',
      tagIds: [],
      stats: { quantitative: {}, qualitative: {} },
      description: '',
    }

    setProject((current) => ({ ...current, nodes: [...current.nodes, createdNode] }))
    setSelectedNodeId(createdNode.id)
    setIsNodeEditorOpen(true)
  }

  function updateNode(nodeId: string, patch: Partial<NodeData>) {
    setProject((current) => ({
      ...current,
      nodes: current.nodes.map((node) => (node.id === nodeId ? { ...node, ...patch } : node)),
    }))
  }

  function deleteNode(nodeId: string) {
    setProject((current) => ({
      tags: current.tags.map((tag) =>
        tag.rootNodeId === nodeId ? { ...tag, rootNodeId: null } : tag,
      ),
      nodes: current.nodes.filter((node) => node.id !== nodeId),
      edges: current.edges.filter((edge) => edge.from !== nodeId && edge.to !== nodeId),
      statStyles: current.statStyles,
      viewState: current.viewState,
    }))

    if (selectedNodeId === nodeId) {
      setIsNodeEditorOpen(false)
    }
    setSelectedNodeId((currentSelected) => (currentSelected === nodeId ? null : currentSelected))
  }

  function openNodeEditor(nodeId: string) {
    setSelectedNodeId(nodeId)
    setIsNodeEditorOpen(true)
  }

  function toggleNodeTag(nodeId: string, tagId: string) {
    setProject((current) => {
      let removed = false
      const nodes = current.nodes.map((node) => {
        if (node.id !== nodeId) {
          return node
        }
        const hasTag = node.tagIds.includes(tagId)
        removed = hasTag
        return {
          ...node,
          tagIds: hasTag ? node.tagIds.filter((id) => id !== tagId) : [...node.tagIds, tagId],
        }
      })

      const tags = removed
        ? current.tags.map((tag) =>
            tag.id === tagId && tag.rootNodeId === nodeId ? { ...tag, rootNodeId: null } : tag,
          )
        : current.tags

      return { ...current, nodes, tags }
    })
  }

  function addEdge() {
    if (!selectedNode || !newEdgeTo || newEdgeTo === selectedNode.id) {
      return
    }

    const edge: EdgeData = {
      id: createId('edge'),
      from: selectedNode.id,
      to: newEdgeTo,
      type: newEdgeType,
    }

    setProject((current) => ({ ...current, edges: [...current.edges, edge] }))
    setNewEdgeTo('')
  }

  function updateEdge(edgeId: string, patch: Partial<EdgeData>) {
    setProject((current) => ({
      ...current,
      edges: current.edges.map((edge) => (edge.id === edgeId ? { ...edge, ...patch } : edge)),
    }))
  }

  function deleteEdge(edgeId: string) {
    setProject((current) => ({
      ...current,
      edges: current.edges.filter((edge) => edge.id !== edgeId),
    }))
  }

  function addQuantitativeStat() {
    if (!selectedNode || !quantKey.trim()) {
      return
    }
    const numeric = Number(quantValue)
    if (!Number.isFinite(numeric)) {
      return
    }

    const key = quantKey.trim()
    updateNode(selectedNode.id, {
      stats: {
        ...selectedNode.stats,
        quantitative: {
          ...selectedNode.stats.quantitative,
          [key]: numeric,
        },
      },
    })
    setQuantKey('')
    setQuantValue('')
  }

  function removeQuantitativeStat(key: string) {
    if (!selectedNode) {
      return
    }
    const next = { ...selectedNode.stats.quantitative }
    delete next[key]
    updateNode(selectedNode.id, {
      stats: {
        ...selectedNode.stats,
        quantitative: next,
      },
    })
  }

  function addQualitativeStat() {
    if (!selectedNode || !qualKey.trim() || !qualValue.trim()) {
      return
    }

    const key = qualKey.trim()
    updateNode(selectedNode.id, {
      stats: {
        ...selectedNode.stats,
        qualitative: {
          ...selectedNode.stats.qualitative,
          [key]: qualValue.trim(),
        },
      },
    })
    setQualKey('')
    setQualValue('')
  }

  function removeQualitativeStat(key: string) {
    if (!selectedNode) {
      return
    }
    const next = { ...selectedNode.stats.qualitative }
    delete next[key]
    updateNode(selectedNode.id, {
      stats: {
        ...selectedNode.stats,
        qualitative: next,
      },
    })
  }

  function exportJson() {
    const sortedProject = sortProjectForExport(project)
    const text = JSON.stringify(sortedProject, null, 2)
    const blob = new Blob([text], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'skill-tree.json'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  async function importJson(file: File | undefined) {
    if (!file) {
      return
    }

    try {
      const content = await file.text()
      const parsed = JSON.parse(content)
      const normalized = normalizeProject(parsed)
      setProject(normalized)
      setSelectedNodeId(normalized.nodes[0]?.id ?? null)
      setLoadedProjectSnapshot(JSON.stringify(sortProjectForExport(normalized)))
      applyProjectViewState(normalized)
    } catch {
      alert('Failed to import JSON. Check file format.')
    }
  }

  function confirmDiscardIfEdited() {
    if (!hasUnsavedProjectChanges) {
      return true
    }
    return window.confirm("Are you sure? We save none of the progress if you haven't exported.")
  }

  function loadExampleTemplate(template: ProjectData = SAMPLE_DATA) {
    if (!confirmDiscardIfEdited()) {
      return
    }
    setProject(template)
    setLoadedProjectSnapshot(JSON.stringify(sortProjectForExport(template)))
    setSelectedNodeId(null)
    setIsNodeEditorOpen(false)
    applyProjectViewState(template)
  }

  return (
    <div className="app" style={{ '--sidebar-width': `${sidebarWidth}px` } as React.CSSProperties}>
      <aside className="sidebar">
        <section className="panel">
          <div className="panel-head">
            <h2>Tags (Dimensions)</h2>
            <div className="panel-head-actions">
              <button className="secondary" onClick={() => setShowTagStatsInTagsPanel((current) => !current)}>
                {showTagStatsInTagsPanel ? 'Hide Tag Stats' : 'Show Tag Stats'}
              </button>
              <button
                className="secondary collapse-toggle"
                onClick={() => toggleSection('tags')}
                aria-label={collapsedSections.tags ? 'Expand tags section' : 'Collapse tags section'}
              >
                {collapsedSections.tags ? '▾' : '▴'}
              </button>
            </div>
          </div>
          {!collapsedSections.tags && (
            <>
              <div className="row">
                <input
                  value={newTagName}
                  onChange={(event) => setNewTagName(event.target.value)}
                  placeholder="New tag name"
                />
                <input
                  className="color-input"
                  value={newTagColor}
                  type="color"
                  onChange={(event) => setNewTagColor(event.target.value)}
                />
                <button onClick={addTag}>Add</button>
              </div>

              <div className="list">
                {project.tags.map((tag) => (
                  <div className="tag-item" key={tag.id}>
                    <div className="list-item">
                      <input
                        className="checkbox"
                        type="checkbox"
                        checked={tag.visible}
                        title="Toggle visible"
                        onChange={(event) => updateTag(tag.id, { visible: event.target.checked })}
                      />
                      <input
                        value={tag.name}
                        onChange={(event) => updateTag(tag.id, { name: event.target.value })}
                      />
                      <input
                        className="color-input"
                        type="color"
                        value={tag.color}
                        onChange={(event) => updateTag(tag.id, { color: event.target.value })}
                        title="Tag color"
                      />
                      <button className="danger" onClick={() => deleteTag(tag.id)}>
                        Delete
                      </button>
                    </div>
                    {showTagStatsInTagsPanel && (
                      <div className="row tag-root-row">
                        <span className="subhead">Root node</span>
                        <select
                          value={tag.rootNodeId ?? ''}
                          onChange={(event) =>
                            updateTag(tag.id, { rootNodeId: event.target.value || null })
                          }
                        >
                          <option value="">None</option>
                          {project.nodes
                            .filter((node) => node.tagIds.includes(tag.id))
                            .map((node) => (
                              <option key={node.id} value={node.id}>
                                {node.name}
                              </option>
                            ))}
                        </select>
                      </div>
                    )}
                    {showTagStatsInTagsPanel && <div className="tag-stats">
                      <div>
                        <p className="subhead">Tag Quant</p>
                        <div className="stat-list">
                          {Object.entries(tag.stats.quantitative).map(([key, value]) => (
                            <div className="stat-row" key={key}>
                              <span>{`${key}: ${value}`}</span>
                              <button
                                className="danger"
                                onClick={() => removeTagQuantitativeStat(tag, key)}
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                          {Object.keys(tag.stats.quantitative).length === 0 && (
                            <p className="empty">No quant stats.</p>
                          )}
                        </div>
                        <div className="row">
                          <input
                            placeholder="key"
                            value={tagQuantDrafts[tag.id]?.key ?? ''}
                            onChange={(event) =>
                              setTagQuantDraft(tag.id, { key: event.target.value })
                            }
                          />
                          <input
                            placeholder="value"
                            value={tagQuantDrafts[tag.id]?.value ?? ''}
                            onChange={(event) =>
                              setTagQuantDraft(tag.id, { value: event.target.value })
                            }
                          />
                          <button onClick={() => addTagQuantitativeStat(tag)}>Add</button>
                        </div>
                      </div>
                      <div>
                        <p className="subhead">Tag Qual</p>
                        <div className="stat-list">
                          {Object.entries(tag.stats.qualitative).map(([key, value]) => (
                            <div className="stat-row" key={key}>
                              <span>{`${key}: ${value}`}</span>
                              <button
                                className="danger"
                                onClick={() => removeTagQualitativeStat(tag, key)}
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                          {Object.keys(tag.stats.qualitative).length === 0 && (
                            <p className="empty">No qual stats.</p>
                          )}
                        </div>
                        <div className="row">
                          <input
                            placeholder="key"
                            value={tagQualDrafts[tag.id]?.key ?? ''}
                            onChange={(event) =>
                              setTagQualDraft(tag.id, { key: event.target.value })
                            }
                          />
                          <input
                            placeholder="value"
                            value={tagQualDrafts[tag.id]?.value ?? ''}
                            onChange={(event) =>
                              setTagQualDraft(tag.id, { value: event.target.value })
                            }
                          />
                          <button onClick={() => addTagQualitativeStat(tag)}>Add</button>
                        </div>
                      </div>
                    </div>}
                  </div>
                ))}
                {project.tags.length === 0 && <p className="empty">No tags yet.</p>}
              </div>
            </>
          )}
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Stats</h2>
            <button
              className="secondary collapse-toggle"
              onClick={() => toggleSection('stats')}
              aria-label={collapsedSections.stats ? 'Expand stats section' : 'Collapse stats section'}
            >
              {collapsedSections.stats ? '▾' : '▴'}
            </button>
          </div>
          {!collapsedSections.stats && (
            <>
              <div className="row">
                <select
                  value={newStatKind}
                  onChange={(event) => setNewStatKind(event.target.value as StatKind)}
                >
                  <option value="quantitative">quantitative</option>
                  <option value="qualitative">qualitative</option>
                </select>
                <input
                  placeholder="stat key"
                  value={newStatKey}
                  onChange={(event) => setNewStatKey(event.target.value)}
                />
                <input
                  className="color-input"
                  type="color"
                  value={newStatColor}
                  onChange={(event) => setNewStatColor(event.target.value)}
                />
                <button onClick={addStatStyle}>Add</button>
              </div>
              <div className="list">
                {project.statStyles.map((style) => (
                  <div key={style.id} className="edge-row">
                    <span>{`${style.kind}: ${style.key}`}</span>
                    <input
                      className="color-input"
                      type="color"
                      value={style.color}
                      onChange={(event) => updateStatStyle(style.id, { color: event.target.value })}
                    />
                    <button className="danger" onClick={() => deleteStatStyle(style.id)}>
                      Delete
                    </button>
                  </div>
                ))}
                {project.statStyles.length === 0 && <p className="empty">No stat colors yet.</p>}
              </div>
            </>
          )}
        </section>

        {isNodeEditorOpen && selectedNode && (
          <section className="panel node-editor">
            <div className="panel-head">
              <h2>Node Editor</h2>
              <button className="secondary" onClick={() => setIsNodeEditorOpen(false)}>
                Close
              </button>
            </div>
            <>
              <label>
                Name
                <input
                  value={selectedNode.name}
                  onChange={(event) => updateNode(selectedNode.id, { name: event.target.value })}
                />
              </label>

              <label>
                Description
                <textarea
                  value={selectedNode.description}
                  rows={3}
                  onChange={(event) =>
                    updateNode(selectedNode.id, { description: event.target.value })
                  }
                />
              </label>

              <div>
                <p className="subhead">Tags</p>
                <div className="tag-grid">
                  {project.tags.map((tag) => (
                    <label key={tag.id} className="tag-pill" style={{ borderColor: tag.color }}>
                      <input
                        type="checkbox"
                        checked={selectedNode.tagIds.includes(tag.id)}
                        onChange={() => toggleNodeTag(selectedNode.id, tag.id)}
                      />
                      {tag.name}
                    </label>
                  ))}
                  {project.tags.length === 0 && <p className="empty">Create tags first.</p>}
                </div>
              </div>

              <div>
                <p className="subhead">Edges</p>
                <div className="row edge-form">
                  <select value={newEdgeTo} onChange={(event) => setNewEdgeTo(event.target.value)}>
                    <option value="">Connect to node</option>
                    {project.nodes
                      .filter((node) => node.id !== selectedNode.id)
                      .map((node) => (
                        <option key={node.id} value={node.id}>
                          {node.name}
                        </option>
                      ))}
                  </select>
                  <select
                    value={newEdgeType}
                    onChange={(event) => setNewEdgeType(event.target.value as EdgeType)}
                  >
                    <option value="next">next</option>
                    <option value="previous">previous</option>
                    <option value="undirected">undirected</option>
                  </select>
                  <button onClick={addEdge}>Add</button>
                </div>

                <div className="list">
                  {selectedNodeEdges.map((edge) => {
                    const isOutgoing = edge.from === selectedNode.id
                    const otherNodeId = isOutgoing ? edge.to : edge.from
                    const otherNodeName = nodesById.get(otherNodeId)?.name ?? otherNodeId
                    const directionLabel = isOutgoing ? '->' : '<-'

                    return (
                      <div key={edge.id} className="edge-row">
                        <span>{`${directionLabel} ${otherNodeName}`}</span>
                        <select
                          value={edge.type}
                          onChange={(event) =>
                            updateEdge(edge.id, { type: event.target.value as EdgeType })
                          }
                        >
                          <option value="next">next</option>
                          <option value="previous">previous</option>
                          <option value="undirected">undirected</option>
                        </select>
                        <button className="danger" onClick={() => deleteEdge(edge.id)}>
                          Delete
                        </button>
                      </div>
                    )
                  })}
                  {selectedNodeEdges.length === 0 && <p className="empty">No edges yet.</p>}
                </div>
              </div>

              <div>
                <p className="subhead">Quantitative Stats</p>
                <div className="stat-list">
                  {Object.entries(selectedNode.stats.quantitative).map(([key, value]) => (
                    <div className="stat-row" key={key}>
                      <span>
                        {key}: {value}
                      </span>
                      <button className="danger" onClick={() => removeQuantitativeStat(key)}>
                        Remove
                      </button>
                    </div>
                  ))}
                  {Object.keys(selectedNode.stats.quantitative).length === 0 && (
                    <p className="empty">No quantitative stats.</p>
                  )}
                </div>
                <div className="row">
                  <input
                    placeholder="key"
                    value={quantKey}
                    onChange={(event) => setQuantKey(event.target.value)}
                  />
                  <input
                    placeholder="value"
                    value={quantValue}
                    onChange={(event) => setQuantValue(event.target.value)}
                  />
                  <button onClick={addQuantitativeStat}>Add</button>
                </div>
              </div>

              <div>
                <p className="subhead">Qualitative Stats</p>
                <div className="stat-list">
                  {Object.entries(selectedNode.stats.qualitative).map(([key, value]) => (
                    <div className="stat-row" key={key}>
                      <span>
                        {key}: {value}
                      </span>
                      <button className="danger" onClick={() => removeQualitativeStat(key)}>
                        Remove
                      </button>
                    </div>
                  ))}
                  {Object.keys(selectedNode.stats.qualitative).length === 0 && (
                    <p className="empty">No qualitative stats.</p>
                  )}
                </div>
                <div className="row">
                  <input
                    placeholder="key"
                    value={qualKey}
                    onChange={(event) => setQualKey(event.target.value)}
                  />
                  <input
                    placeholder="value"
                    value={qualValue}
                    onChange={(event) => setQualValue(event.target.value)}
                  />
                  <button onClick={addQualitativeStat}>Add</button>
                </div>
              </div>
            </>
          </section>
        )}
      </aside>

      <main className="main-area">
        <header className="main-header">
          <div className="main-header-top">
            <h1>Skill Tree Visualizer</h1>
            <label className="theme-switcher">
              Theme
              <select value={theme} onChange={(event) => setTheme(event.target.value as ThemeMode)}>
                <option value="light">Light</option>
                <option value="turtle-night">Turtle's night</option>
              </select>
            </label>
          </div>
          <p>
            Visible tags define filtered rendering. Nodes cluster by shared tags and connect through typed
            edges.
          </p>
          <section className="header-project">
            <div className="panel-head">
              <h2>Project</h2>
              <button
                className="secondary collapse-toggle"
                onClick={() => toggleSection('project')}
                aria-label={
                  collapsedSections.project ? 'Expand project section' : 'Collapse project section'
                }
              >
                {collapsedSections.project ? '▾' : '▴'}
              </button>
            </div>
            {!collapsedSections.project && (
              <div className="project-actions">
                <button onClick={exportJson}>Export JSON</button>
                <label className="file-upload">
                  Import JSON
                  <input
                    type="file"
                    accept="application/json"
                    onChange={(event) => {
                      void importJson(event.target.files?.[0])
                      event.currentTarget.value = ''
                    }}
                  />
                </label>
                <button onClick={() => loadExampleTemplate(SAMPLE_DATA)}>Load Branches Demo</button>
                <button onClick={() => loadExampleTemplate(STARTER_TEMPLATE)}>
                  Load Starter Template
                </button>
                <button onClick={() => loadExampleTemplate(BLANK_PROJECT)}>Start New</button>
              </div>
            )}
          </section>
        </header>
        <section className="panel view-mode-bar">
          <div className="view-mode-controls">
            <label className="theme-switcher">
              View
              <select value={viewMode} onChange={(event) => setViewMode(event.target.value as ViewMode)}>
                <option value="graph">Visual</option>
                <option value="list">List view</option>
              </select>
            </label>
            {viewMode !== 'list' && (
              <label className="theme-switcher">
                Root Only
                <input
                  className="compact-check"
                  type="checkbox"
                  checked={showRootNodesOnly}
                  onChange={(event) => setShowRootNodesOnly(event.target.checked)}
                />
              </label>
            )}
            {viewMode !== 'list' && <button onClick={untangleCurrentView}>Untangle</button>}
            {viewMode !== 'list' && <button onClick={saveCurrentView}>Save Current View</button>}
            {viewMode !== 'list' && (
              <label className="theme-switcher">
                Auto Save View
                <input
                  className="compact-check"
                  type="checkbox"
                  checked={autoSaveView}
                  onChange={(event) => setAutoSaveView(event.target.checked)}
                />
              </label>
            )}
            {viewMode !== 'list' && (
              <button className="secondary" onClick={() => setViewport({ scale: 1, tx: 0, ty: 0 })}>
                Reset View
              </button>
            )}
            <label className="theme-switcher">
              Left Width
              <input
                type="range"
                min={minSidebarWidth}
                max={maxSidebarWidth}
                step={10}
                value={sidebarWidth}
                onChange={(event) =>
                  setSidebarWidth(
                    Math.max(minSidebarWidth, Math.min(maxSidebarWidth, Number(event.target.value))),
                  )
                }
              />
            </label>
            <button onClick={addNode}>Add</button>
          </div>
        </section>

        {viewMode === 'graph' ? (
          <section className="graph-shell">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
              role="img"
              aria-label="Skill tree graph"
              onMouseDown={(event) => handleGraphMouseDown(event.clientX, event.clientY)}
              onMouseMove={(event) => handleGraphMouseMove(event.clientX, event.clientY)}
              onWheel={(event) => {
                event.preventDefault()
                handleGraphWheel(event.clientX, event.clientY, event.deltaY)
              }}
            >
              <defs>
                <marker
                  id="arrow-next"
                  markerWidth="10"
                  markerHeight="8"
                  refX="8"
                  refY="4"
                  orient="auto"
                >
                  <path d="M0,0 L10,4 L0,8 z" fill="#0c63e7" />
                </marker>
                <marker
                  id="arrow-previous"
                  markerWidth="10"
                  markerHeight="8"
                  refX="8"
                  refY="4"
                  orient="auto"
                >
                  <path d="M0,0 L10,4 L0,8 z" fill="#b02f6b" />
                </marker>
              </defs>

              <g transform={`translate(${viewport.tx}, ${viewport.ty}) scale(${viewport.scale})`}>
                {visibleEdges.map((edge) => {
                  const from = positionedById.get(edge.from)
                  const to = positionedById.get(edge.to)
                  if (!from || !to) {
                    return null
                  }

                  return (
                    <line
                      key={edge.id}
                      x1={from.x}
                      y1={from.y}
                      x2={to.x}
                      y2={to.y}
                      stroke={edgeColor(edge.type)}
                      strokeWidth={2.3}
                      strokeDasharray={edge.type === 'undirected' ? '7 5' : undefined}
                      markerEnd={
                        edge.type === 'next'
                          ? 'url(#arrow-next)'
                          : edge.type === 'previous'
                            ? 'url(#arrow-previous)'
                            : undefined
                      }
                    />
                  )
                })}

                {interactivePositions.map(({ node, x, y }) => {
                  const visibleTags = node.tagIds
                    .map((id) => tagById.get(id))
                    .filter((tag): tag is Tag => {
                      if (!tag) return false
                      return tag.visible
                    })

                  return (
                    <g
                      key={node.id}
                      transform={`translate(${x}, ${y})`}
                      onMouseDown={(event) => {
                        event.stopPropagation()
                        beginNodeDrag(node.id, event.clientX, event.clientY)
                      }}
                      onMouseMove={(event) =>
                        setHover({
                          nodeId: node.id,
                          x: event.clientX,
                          y: event.clientY,
                        })
                      }
                      onMouseEnter={(event) =>
                        setHover({
                          nodeId: node.id,
                          x: event.clientX,
                          y: event.clientY,
                        })
                      }
                      onMouseLeave={() =>
                        setHover((current) => (current?.nodeId === node.id ? null : current))
                      }
                      onClick={() => {
                        if (movedDuringDragRef.current) {
                          movedDuringDragRef.current = false
                          return
                        }
                        openNodeEditor(node.id)
                      }}
                    >
                      <circle
                        r={NODE_RADIUS}
                        fill={selectedNodeId === node.id ? 'var(--node-selected)' : 'var(--node-fill)'}
                        stroke={visibleTags[0]?.color ?? '#5b6f8a'}
                        strokeWidth={selectedNodeId === node.id ? 4 : 3}
                        className="node-circle"
                      />
                      <text
                        className="node-text"
                        textAnchor="middle"
                        y={NODE_TEXT_Y}
                        style={{ fontSize: `${NODE_FONT_SIZE}px` }}
                      >
                        {node.name.slice(0, 13)}
                      </text>
                    </g>
                  )
                })}
              </g>
            </svg>

            {hoveredNode && hover && (
              <div className="tooltip" style={{ left: hover.x + 14, top: hover.y + 14 }}>
                <h3>{hoveredNode.name}</h3>
                {hoveredNodeStatLines.map((statLine) => (
                  <p key={statLine.id} style={statLine.color ? { color: statLine.color } : undefined}>
                    {statLine.text}
                  </p>
                ))}
                {hoveredTagStatLines.map((statLine) => (
                  <p key={statLine.id} style={{ color: statLine.color }}>
                    {statLine.text}
                  </p>
                ))}
                {hoveredNodeStatLines.length === 0 && hoveredTagStatLines.length === 0 && <p>No stats.</p>}
                <p>{hoveredNode.description || 'No description.'}</p>
                <p>
                  Tags:{' '}
                  {hoveredNode.tagIds
                    .map((id) => tagById.get(id)?.name)
                    .filter(Boolean)
                    .join(', ') || 'None'}
                </p>
              </div>
            )}
          </section>
        ) : (
          <section className="panel list-view">
            <h2>List View</h2>
            <div className="list">
              {project.nodes.map((node) => (
                <div className="list-item" key={node.id}>
                  <button
                    className={selectedNodeId === node.id ? 'secondary active' : 'secondary'}
                    onClick={() => openNodeEditor(node.id)}
                  >
                    {node.name}
                  </button>
                  <button className="danger" onClick={() => deleteNode(node.id)}>
                    Delete
                  </button>
                </div>
              ))}
              {project.nodes.length === 0 && <p className="empty">No nodes yet.</p>}
            </div>
          </section>
        )}

      </main>
    </div>
  )
}

export default App

import { useEffect, useMemo, useState } from 'react'
import './App.css'

type EdgeType = 'next' | 'previous' | 'undirected'

type Tag = {
  id: string
  name: string
  color: string
  visible: boolean
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
}

type PositionedNode = {
  node: NodeData
  x: number
  y: number
}

type ThemeMode = 'light' | 'turtle-night'
type ViewMode = 'graph' | 'list'
type CollapsibleSection = 'project' | 'tags' | 'edges'

const WIDTH = 980
const HEIGHT = 680
const NODE_RADIUS = 26
const NODE_FONT_SIZE = Math.round(NODE_RADIUS * 0.42)
const NODE_TEXT_Y = Math.round(NODE_FONT_SIZE * 0.36)

const SAMPLE_DATA: ProjectData = {
  tags: [
    { id: 'tag_magic', name: 'Magic Damage', color: '#2657ff', visible: true },
    { id: 'tag_fire', name: 'Fire Element', color: '#ef5b2f', visible: true },
    { id: 'tag_ranged', name: 'Ranged', color: '#23ad77', visible: true },
    { id: 'tag_support', name: 'Support', color: '#bb53db', visible: true },
  ],
  nodes: [
    {
      id: 'node_spark',
      name: 'Spark',
      tagIds: ['tag_magic', 'tag_ranged'],
      stats: {
        quantitative: { manaCost: 8, damage: 16 },
        qualitative: { castType: 'Projectile', tier: 'Basic' },
      },
      description: 'A quick arcane bolt that introduces ranged magic play.',
    },
    {
      id: 'node_fireball',
      name: 'Fireball',
      tagIds: ['tag_magic', 'tag_fire', 'tag_ranged'],
      stats: {
        quantitative: { manaCost: 20, damage: 45 },
        qualitative: { castType: 'Projectile', tier: 'Core' },
      },
      description: 'Launches a fire projectile that explodes on impact.',
    },
    {
      id: 'node_flame_aura',
      name: 'Flame Aura',
      tagIds: ['tag_magic', 'tag_fire', 'tag_support'],
      stats: {
        quantitative: { manaCost: 15, radius: 4 },
        qualitative: { castType: 'Aura', tier: 'Core' },
      },
      description: 'Empowers allies near you with bonus fire damage.',
    },
  ],
  edges: [
    { id: 'edge_1', from: 'node_spark', to: 'node_fireball', type: 'next' },
    {
      id: 'edge_2',
      from: 'node_fireball',
      to: 'node_flame_aura',
      type: 'undirected',
    },
  ],
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
  const tags = (input.tags ?? []).map((tag) => ({
    id: String(tag.id ?? createId('tag')),
    name: String(tag.name ?? 'New Tag'),
    color: String(tag.color ?? '#4577ff'),
    visible: Boolean(tag.visible ?? true),
  }))
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

  return { tags, nodes, edges }
}

function sortProjectForExport(project: ProjectData): ProjectData {
  const tags = [...project.tags].sort((a, b) => a.id.localeCompare(b.id))
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

  return { tags, nodes, edges }
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

function App() {
  const [theme, setTheme] = useState<ThemeMode>('turtle-night')
  const [viewMode, setViewMode] = useState<ViewMode>('graph')
  const [project, setProject] = useState<ProjectData>(SAMPLE_DATA)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [isNodeEditorOpen, setIsNodeEditorOpen] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState('#4577ff')
  const [newEdgeFrom, setNewEdgeFrom] = useState('')
  const [newEdgeTo, setNewEdgeTo] = useState('')
  const [newEdgeType, setNewEdgeType] = useState<EdgeType>('undirected')
  const [quantKey, setQuantKey] = useState('')
  const [quantValue, setQuantValue] = useState('')
  const [qualKey, setQualKey] = useState('')
  const [qualValue, setQualValue] = useState('')
  const [hover, setHover] = useState<{ nodeId: string; x: number; y: number } | null>(null)
  const [collapsedSections, setCollapsedSections] = useState<Record<CollapsibleSection, boolean>>({
    project: false,
    tags: false,
    edges: false,
  })

  const visibleTagIds = useMemo(
    () => new Set(project.tags.filter((tag) => tag.visible).map((tag) => tag.id)),
    [project.tags],
  )

  const visibleNodes = useMemo(() => {
    const hasVisibleTagFilter = visibleTagIds.size > 0
    if (!hasVisibleTagFilter) {
      return project.nodes
    }
    return project.nodes.filter((node) => node.tagIds.some((tagId) => visibleTagIds.has(tagId)))
  }, [project.nodes, visibleTagIds])

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

  const selectedNode = useMemo(
    () => project.nodes.find((node) => node.id === selectedNodeId) ?? null,
    [project.nodes, selectedNodeId],
  )

  const nodesById = useMemo(() => new Map(project.nodes.map((node) => [node.id, node])), [project.nodes])
  const tagById = useMemo(() => new Map(project.tags.map((tag) => [tag.id, tag])), [project.tags])
  const positionedById = useMemo(() => new Map(positions.map((item) => [item.node.id, item])), [positions])

  const hoveredNode = hover ? nodesById.get(hover.nodeId) ?? null : null

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

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
      ...current,
      nodes: current.nodes.filter((node) => node.id !== nodeId),
      edges: current.edges.filter((edge) => edge.from !== nodeId && edge.to !== nodeId),
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
    setProject((current) => ({
      ...current,
      nodes: current.nodes.map((node) => {
        if (node.id !== nodeId) {
          return node
        }
        const hasTag = node.tagIds.includes(tagId)
        return {
          ...node,
          tagIds: hasTag ? node.tagIds.filter((id) => id !== tagId) : [...node.tagIds, tagId],
        }
      }),
    }))
  }

  function addEdge() {
    if (!newEdgeFrom || !newEdgeTo || newEdgeFrom === newEdgeTo) {
      return
    }

    const edge: EdgeData = {
      id: createId('edge'),
      from: newEdgeFrom,
      to: newEdgeTo,
      type: newEdgeType,
    }

    setProject((current) => ({ ...current, edges: [...current.edges, edge] }))
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
    } catch {
      alert('Failed to import JSON. Check file format.')
    }
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <section className="panel">
          <div className="panel-head">
            <h2>Tags (Dimensions)</h2>
            <button
              className="secondary collapse-toggle"
              onClick={() => toggleSection('tags')}
              aria-label={collapsedSections.tags ? 'Expand tags section' : 'Collapse tags section'}
            >
              {collapsedSections.tags ? '▾' : '▴'}
            </button>
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
                  <div className="list-item" key={tag.id}>
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
                    />
                    <button className="danger" onClick={() => deleteTag(tag.id)}>
                      Delete
                    </button>
                  </div>
                ))}
                {project.tags.length === 0 && <p className="empty">No tags yet.</p>}
              </div>
            </>
          )}
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Edges</h2>
            <button
              className="secondary collapse-toggle"
              onClick={() => toggleSection('edges')}
              aria-label={collapsedSections.edges ? 'Expand edges section' : 'Collapse edges section'}
            >
              {collapsedSections.edges ? '▾' : '▴'}
            </button>
          </div>
          {!collapsedSections.edges && (
            <>
              <div className="row edge-form">
                <select value={newEdgeFrom} onChange={(event) => setNewEdgeFrom(event.target.value)}>
                  <option value="">From node</option>
                  {project.nodes.map((node) => (
                    <option key={node.id} value={node.id}>
                      {node.name}
                    </option>
                  ))}
                </select>
                <select value={newEdgeTo} onChange={(event) => setNewEdgeTo(event.target.value)}>
                  <option value="">To node</option>
                  {project.nodes.map((node) => (
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
                {project.edges.map((edge) => (
                  <div key={edge.id} className="edge-row">
                    <span>
                      {(nodesById.get(edge.from)?.name ?? edge.from) + ' -> ' +
                        (nodesById.get(edge.to)?.name ?? edge.to)}
                    </span>
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
                ))}
                {project.edges.length === 0 && <p className="empty">No edges yet.</p>}
              </div>
            </>
          )}
        </section>
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
                <button
                  onClick={() => {
                    setProject(SAMPLE_DATA)
                    setSelectedNodeId(null)
                    setIsNodeEditorOpen(false)
                  }}
                >
                  Reset to Sample
                </button>
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
            <button onClick={addNode}>Add</button>
          </div>
        </section>

        {viewMode === 'graph' ? (
          <section className="graph-shell">
            <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="Skill tree graph">
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

              {positions.map(({ node, x, y }) => {
                const tags = node.tagIds
                  .map((id) => tagById.get(id))
                  .filter((tag): tag is Tag => Boolean(tag))

                return (
                  <g
                    key={node.id}
                    transform={`translate(${x}, ${y})`}
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
                    onClick={() => openNodeEditor(node.id)}
                  >
                    <circle
                      r={NODE_RADIUS}
                      fill={selectedNodeId === node.id ? 'var(--node-selected)' : 'var(--node-fill)'}
                      stroke={tags[0]?.color ?? '#5b6f8a'}
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
            </svg>

            {hoveredNode && hover && (
              <div className="tooltip" style={{ left: hover.x + 14, top: hover.y + 14 }}>
                <h3>{hoveredNode.name}</h3>
                <p>{hoveredNode.description || 'No description.'}</p>
                <p>
                  <strong>Tags:</strong>{' '}
                  {hoveredNode.tagIds
                    .map((id) => tagById.get(id)?.name)
                    .filter(Boolean)
                    .join(', ') || 'None'}
                </p>
                <p>
                  <strong>Quant:</strong>{' '}
                  {Object.entries(hoveredNode.stats.quantitative)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(', ') || 'None'}
                </p>
                <p>
                  <strong>Qual:</strong>{' '}
                  {Object.entries(hoveredNode.stats.qualitative)
                    .map(([k, v]) => `${k}: ${v}`)
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
      </main>
    </div>
  )
}

export default App

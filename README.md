# Tree Visual Maker

Interactive skill tree / ability graph editor with tag-dimension clustering, typed node connections, metadata editing, and JSON import/export. 

## What Is Implemented

- Tag (dimension) management:
  - Create, rename, recolor, delete tags
  - Toggle tag visibility
- Node management:
  - Create, rename, delete nodes
  - Attach/detach tags
  - Edit description
  - Edit quantitative and qualitative stats
- Edge management:
  - Create/delete connections between nodes
  - Edge types: `next`, `previous`, `undirected`
- Visualization:
  - SVG graph render
  - Node clustering by shared tags (Jaccard-based force simulation)
  - Edge rendering with style by type
  - Tag visibility controls which nodes are rendered
  - Hover tooltip with full node metadata
- Data portability:
  - Export current project to downloadable JSON
  - Import JSON file to continue editing

## Core Model

- `Tag` = dimension (`id`, `name`, `color`, `visible`)
- `Node` = vector across dimensions (`tagIds`) + metadata
- `Edge` = typed connection between nodes

## JSON Shape

```json
{
  "tags": [
    {
      "id": "tag_fire",
      "name": "Fire Element",
      "color": "#ef5b2f",
      "visible": true
    }
  ],
  "nodes": [
    {
      "id": "node_fireball",
      "name": "Fireball",
      "tagIds": ["tag_magic", "tag_fire", "tag_ranged"],
      "stats": {
        "quantitative": {
          "manaCost": 20,
          "damage": 45
        },
        "qualitative": {
          "castType": "Projectile",
          "tier": "Core"
        }
      },
      "description": "Launches a fire projectile that explodes on impact."
    }
  ],
  "edges": [
    {
      "id": "edge_1",
      "from": "node_spark",
      "to": "node_fireball",
      "type": "next"
    }
  ]
}
```

## Run

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```

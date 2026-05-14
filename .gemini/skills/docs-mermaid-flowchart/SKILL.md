---
name: docs-mermaid-flowchart
description: Generate, style, and structure highly readable and architecturally sound Mermaid.js flowcharts. Use this skill whenever a user asks to create a flowchart, sequence diagram, decision tree, or any Mermaid diagram. It enforces best practices for readability, layout (such as the Elk renderer), grouping with subgraphs, and consistent node/edge styling.
---

# Mermaid Flowchart Expert

You are an expert at designing and generating Mermaid.js flowcharts. Your goal is to produce diagrams that are not just syntactically correct, but visually appealing, structurally logical, and highly readable.

## Best Practices for Flowcharts

### 1. Consistent Direction

Pick a flow direction that matches the mental model of the audience:

- `TD` (Top-Down): Best for hierarchical processes, org charts, and decision trees.
- `LR` (Left-to-Right): Best for sequential workflows, timelines, and CI/CD pipelines.
- Ensure consistency. Do not mix paradigms confusingly.

### 2. Layout Engine Optimization

For large or complex diagrams, use the `elk` layout algorithm instead of the default `dagre`. The elk renderer handles complex parallel edges and nested subgraphs much better.

```mermaid
---
config:
  layout: elk
  look: handDrawn
  theme: default
  elk:
    mergeEdges: true
    nodePlacementStrategy: LINEAR_SEGMENTS
---
flowchart LR
    A[Start] --> B{Decision}
```

### 3. Use Subgraphs for Logical Grouping

Use subgraphs to create visual boundaries that mirror system architecture, team ownership, deployment environments, or security boundaries.

- **Rule of Thumb:** If a diagram has more than 8-10 nodes, group related nodes into subgraphs.
- Nesting is allowed (keep to 3 levels max for readability).

```mermaid
flowchart TB
    subgraph Cloud["AWS Cloud"]
        subgraph VPC["VPC - 10.0.0.0/16"]
            ALB[Load Balancer] --> App1[App Server 1]
        end
    end
```

### 4. Meaningful Shapes and Nodes

Instead of making everything a rectangle, use shapes meaningfully:

- `[Rectangle]`: Standard processes or components.
- `(Rounded)`: Start/End points.
- `{Diamond}`: Decisions (Yes/No branching).
- `[(Cylinder)]`: Databases or storage.

### 5. Edges and Labels

- **Label critical transitions:** Not every arrow needs a label, but decision branches should always show the condition (e.g., `|Yes|`, `|Success|`).
- **Use Edge Styles:** Use dotted lines (`-.->`) for optional/return paths and thick lines (`==>`) for the primary/critical path.
- **Invisible Links (`~~~`):** Use invisible links to force node alignment when the automatic layout struggles.

### 6. Consistent Styling (Classes)

Avoid inline styling if possible. Use `classDef` to apply consistent styles across similar nodes.

```mermaid
flowchart LR
    A[Normal Step]:::process --> B{Check}:::decision
    B -->|Yes| C[Approve]:::success
    B -->|No| D[Reject]:::error

    classDef process fill:#fdfdfd,stroke:#ccc,stroke-width:1px
    classDef decision fill:#ffffff,stroke:#444,stroke-width:2px,font-style:italic
    classDef success fill:#d4edda,stroke:#2e7d32,stroke-width:2px
    classDef error fill:#f8d7da,stroke:#c62828,stroke-width:2px
```

## How to execute

When prompted to create a flowchart:

1. Identify the core components, decision points, and logical groupings.
2. Select the optimal direction (`TD` or `LR`).
3. Add `elk` layout configuration via YAML frontmatter if the chart is complex.
4. Structure the flowchart with subgraphs where applicable.
5. Apply consistent node shapes and `classDef` styling to distinguish between node types.
6. Output the raw Mermaid code block.

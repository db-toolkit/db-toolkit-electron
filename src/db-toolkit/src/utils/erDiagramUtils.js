/**
 * Utilities for generating ER diagram from schema
 */
import dagre from 'dagre';

/**
 * Detect foreign key relationships from schema
 */
export function detectRelationships(schema) {
  const relationships = [];
  const allTables = new Map();

  if (!schema) return relationships;

  // Collect all tables first
  if (schema.databases) {
    schema.databases.forEach(database => {
      database.tables?.forEach(table => {
        allTables.set(table.name, { ...table, schemaName: database.name });
      });
    });
  } else if (schema.schemas) {
    Object.entries(schema.schemas).forEach(([schemaName, schemaData]) => {
      if (schemaData.tables) {
        Object.entries(schemaData.tables).forEach(([tableName, table]) => {
          allTables.set(tableName, { ...table, name: tableName, schemaName });
        });
      }
    });
  }

  // Detect relationships
  allTables.forEach((table, tableName) => {
    if (!table.columns || !Array.isArray(table.columns)) return;

    table.columns.forEach(column => {
      if (!column || !column.name) return;

      const sourceId = `${table.schemaName}.${tableName}`;

      // Detect foreign keys by naming convention or constraints
      if (column.foreign_key) {
        const targetId = `${table.schemaName}.${column.foreign_key.table}`;
        relationships.push({
          id: `${sourceId}-${column.name}`,
          source: sourceId,
          target: targetId,
          sourceColumn: column.name,
          targetColumn: column.foreign_key.column,
          type: 'foreignKey'
        });
      }
      // Fallback: detect by naming convention (e.g., user_id -> users.id or user.id)
      else if (typeof column.name === 'string' && column.name.endsWith('_id')) {
        const baseName = column.name.replace('_id', '');
        const potentialTargets = [baseName, `${baseName}s`, `${baseName}es`];

        for (const targetTable of potentialTargets) {
          if (allTables.has(targetTable)) {
            const target = allTables.get(targetTable);
            // Avoid self-referencing inferred relationships if not intended (optional check)

            const targetId = `${target.schemaName}.${targetTable}`;
            relationships.push({
              id: `${sourceId}-${column.name}`,
              source: sourceId,
              target: targetId,
              sourceColumn: column.name,
              targetColumn: 'id',
              type: 'inferred'
            });
            break; // Found a match, stop searching
          }
        }
      }
    });
  });

  return relationships;
}

/**
 * Convert schema to reactflow nodes
 */
export function schemaToNodes(schema) {
  const nodes = [];

  if (!schema) return nodes;

  // Handle different schema structures
  if (schema.databases) {
    // Structure: { databases: [{ name, tables: [...] }] }
    schema.databases.forEach(database => {
      database.tables?.forEach((table) => {
        nodes.push({
          id: `${database.name}.${table.name}`,
          type: 'tableNode',
          position: { x: 0, y: 0 },
          data: {
            label: table.name,
            columns: table.columns || [],
            schema: database.name
          }
        });
      });
    });
  } else if (schema.schemas) {
    // Structure: { schemas: { schemaName: { tables: { tableName: {...} } } } }
    Object.entries(schema.schemas).forEach(([schemaName, schemaData]) => {
      if (schemaData.tables) {
        Object.entries(schemaData.tables).forEach(([tableName, table]) => {
          nodes.push({
            id: `${schemaName}.${tableName}`,
            type: 'tableNode',
            position: { x: 0, y: 0 },
            data: {
              label: tableName,
              columns: table.columns || [],
              schema: schemaName
            }
          });
        });
      }
    });
  }

  return nodes;
}

/**
 * Convert relationships to reactflow edges
 */
export function relationshipsToEdges(relationships) {
  return relationships.map(rel => ({
    id: rel.id,
    source: rel.source,
    target: rel.target,
    type: 'smoothstep',
    animated: rel.type === 'inferred',
    label: `${rel.sourceColumn} → ${rel.targetColumn}`,
    style: { stroke: rel.type === 'inferred' ? '#94a3b8' : '#3b82f6' },
    markerEnd: {
      type: 'arrowclosed',
      color: rel.type === 'inferred' ? '#94a3b8' : '#3b82f6'
    }
  }));
}

/**
 * Auto-layout nodes using dagre
 */
export function getLayoutedElements(nodes, edges, direction = 'LR') {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const nodeWidth = 280; // Slightly wider for better readability

  // Dynamic spacing based on number of nodes
  const nodeCount = nodes.length;
  const nodesep = nodeCount > 20 ? 80 : nodeCount > 10 ? 100 : 120;
  const ranksep = nodeCount > 20 ? 120 : nodeCount > 10 ? 150 : 180;

  dagreGraph.setGraph({
    rankdir: direction,
    nodesep,
    ranksep,
    marginx: 50,
    marginy: 50
  });

  nodes.forEach((node) => {
    // Calculate dynamic height based on columns
    // Header (40) + Padding (20) + Columns * 28
    // Assume collapsed state for > 10 columns: Header + (PKs+FKs)*28 + "More"*20 + Padding
    const columns = node.data.columns || [];
    let estimatedHeight = 60; // Header + padding

    if (columns.length > 10) {
      const pks = columns.filter(c => c.primary_key || c.name === 'id').length;
      const fks = columns.filter(c => c.foreign_key || c.name.endsWith('_id')).length;
      const visibleCount = Math.max(pks + fks, 1); // At least 1 row
      estimatedHeight += (visibleCount * 28) + 30; // +30 for "more" link
    } else {
      estimatedHeight += (columns.length * 28);
    }

    // Min height 100, Max height 500
    const height = Math.min(Math.max(estimatedHeight, 100), 500);

    dagreGraph.setNode(node.id, { width: nodeWidth, height });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - (dagreGraph.node(node.id).height / 2),
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}

/**
 * Find primary key columns
 */
export function getPrimaryKeys(columns) {
  return columns.filter(col =>
    col.primary_key ||
    col.name === 'id' ||
    col.name.toLowerCase().includes('_pk')
  );
}

/**
 * Find foreign key columns
 */
export function getForeignKeys(columns) {
  return columns.filter(col =>
    col.foreign_key ||
    col.name.endsWith('_id')
  );
}

/**
 * Filter nodes by search query
 */
export function filterNodesBySearch(nodes, searchQuery) {
  if (!searchQuery.trim()) return nodes;

  const query = searchQuery.toLowerCase();
  return nodes.filter(node =>
    node.data?.label?.toLowerCase().includes(query) ||
    node.data?.schema?.toLowerCase().includes(query) ||
    node.data?.columns?.some(col => col?.name?.toLowerCase().includes(query))
  );
}

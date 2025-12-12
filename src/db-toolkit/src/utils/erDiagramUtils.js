/**
 * Utilities for generating ER diagram from schema
 */
import dagre from 'dagre';

/**
 * Detect cardinality of a relationship
 */
export function detectCardinality(relationship, allTables) {
  if (!relationship || !allTables) return '1:N';

  // Extract table names from IDs (format: "schemaName.tableName")
  const sourceTableName = relationship.source.split('.')[1];
  const targetTableName = relationship.target.split('.')[1];

  const sourceTable = allTables.get(sourceTableName);
  const targetTable = allTables.get(targetTableName);

  if (!sourceTable || !targetTable) return '1:N';

  // Check if source column is unique or primary key
  const sourceCol = sourceTable.columns?.find(c => c.name === relationship.sourceColumn);
  const isSourceUnique = sourceCol?.unique || sourceCol?.primary_key || relationship.sourceColumn === 'id';

  // Check if target column is unique or primary key
  const targetCol = targetTable.columns?.find(c => c.name === relationship.targetColumn);
  const isTargetUnique = targetCol?.unique || targetCol?.primary_key || relationship.targetColumn === 'id';

  // Determine cardinality
  if (isSourceUnique && isTargetUnique) return '1:1';
  if (isTargetUnique) return 'N:1';
  if (isSourceUnique) return '1:N';
  return 'N:M';
}
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
        const rel = {
          id: `${sourceId}-${column.name}`,
          source: sourceId,
          target: targetId,
          sourceColumn: column.name,
          targetColumn: column.foreign_key.column,
          type: 'foreignKey'
        };
        rel.cardinality = detectCardinality(rel, allTables);
        relationships.push(rel);
      }
      // Fallback: detect by naming convention (e.g., user_id -> users.id or user.id)
      else if (typeof column.name === 'string' && column.name.endsWith('_id')) {
        const baseName = column.name.replace('_id', '');
        const potentialTargets = [baseName, `${baseName}s`, `${baseName}es`];

        for (const targetTable of potentialTargets) {
          if (allTables.has(targetTable)) {
            const target = allTables.get(targetTable);
            const targetId = `${target.schemaName}.${targetTable}`;
            const rel = {
              id: `${sourceId}-${column.name}`,
              source: sourceId,
              target: targetId,
              sourceColumn: column.name,
              targetColumn: 'id',
              type: 'inferred'
            };
            rel.cardinality = detectCardinality(rel, allTables);
            relationships.push(rel);
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
export function relationshipsToEdges(relationships, showLabels = true) {
  return relationships.map(rel => ({
    id: rel.id,
    source: rel.source,
    target: rel.target,
    type: 'smoothstep',
    animated: rel.type === 'inferred',
    label: showLabels ? (rel.cardinality || '1:N') : '',
    style: { stroke: rel.type === 'inferred' ? '#94a3b8' : '#3b82f6' },
    markerEnd: {
      type: 'arrowclosed',
      color: rel.type === 'inferred' ? '#94a3b8' : '#3b82f6'
    },
    data: {
      ...rel,
      cardinality: rel.cardinality || '1:N'
    }
  }));
}

/**
 * Auto-layout nodes using dagre
 */
export function getLayoutedElements(nodes, edges, direction = 'LR') {
  // Force-directed layout for 'SMART' direction
  if (direction === 'SMART') {
    return getForceDirectedLayout(nodes, edges);
  }

  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const nodeWidth = 280;

  // Dynamic spacing based on number of nodes
  const nodeCount = nodes.length;
  const nodesep = nodeCount > 20 ? 100 : nodeCount > 10 ? 150 : 200;
  const ranksep = nodeCount > 20 ? 150 : nodeCount > 10 ? 200 : 250;

  dagreGraph.setGraph({
    rankdir: direction,
    nodesep,
    ranksep,
    marginx: 100,
    marginy: 100
  });

  nodes.forEach((node) => {
    // Calculate dynamic height based on columns
    // Header (40) + Padding (20) + Columns * 28
    // Assume collapsed state for > 10 columns: Header + (PKs+FKs)*28 + "More"*20 + Padding
    const columns = node.data.columns || [];
    let estimatedHeight = 60; // Header + padding

    if (columns.length > 10) {
      const pks = columns.filter(c => c && (c.primary_key || c.name === 'id')).length;
      const fks = columns.filter(c => c && (c.foreign_key || (typeof c.name === 'string' && c.name.endsWith('_id')))).length;
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
 * Force-directed layout for organic 2D spread
 */
export function getForceDirectedLayout(nodes, edges) {
  const nodeWidth = 280;
  const nodeHeight = 200;
  const centerX = 500;
  const centerY = 400;
  const radius = 300;

  // Build adjacency map
  const adjacency = new Map();
  nodes.forEach(node => adjacency.set(node.id, []));
  edges.forEach(edge => {
    adjacency.get(edge.source)?.push(edge.target);
    adjacency.get(edge.target)?.push(edge.source);
  });

  // Find root nodes (most connections)
  const connectionCounts = nodes.map(node => ({
    id: node.id,
    count: adjacency.get(node.id)?.length || 0
  }));
  connectionCounts.sort((a, b) => b.count - a.count);

  const positioned = new Set();
  const positions = new Map();

  // Position root node at center
  if (connectionCounts.length > 0) {
    const root = connectionCounts[0].id;
    positions.set(root, { x: centerX, y: centerY });
    positioned.add(root);

    // Position connected nodes in circles around root
    const connected = adjacency.get(root) || [];
    const angleStep = (2 * Math.PI) / Math.max(connected.length, 1);
    connected.forEach((nodeId, i) => {
      if (!positioned.has(nodeId)) {
        const angle = i * angleStep;
        positions.set(nodeId, {
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle)
        });
        positioned.add(nodeId);
      }
    });
  }

  // Position remaining nodes in expanding circles
  let currentRadius = radius * 1.8;
  let unpositioned = nodes.filter(n => !positioned.has(n.id));

  while (unpositioned.length > 0) {
    const angleStep = (2 * Math.PI) / Math.max(unpositioned.length, 1);
    unpositioned.forEach((node, i) => {
      const angle = i * angleStep;
      positions.set(node.id, {
        x: centerX + currentRadius * Math.cos(angle),
        y: centerY + currentRadius * Math.sin(angle)
      });
      positioned.add(node.id);
    });
    currentRadius += 300;
    unpositioned = nodes.filter(n => !positioned.has(n.id));
  }

  // Apply positions to nodes
  const layoutedNodes = nodes.map(node => ({
    ...node,
    position: positions.get(node.id) || { x: 0, y: 0 }
  }));

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
    col && (col.foreign_key ||
      (typeof col.name === 'string' && col.name.endsWith('_id')))
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

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
    Object.entries(schema.schemas).forEach(([schemaName, tables]) => {
      if (Array.isArray(tables)) {
        tables.forEach(table => {
          allTables.set(table.name, { ...table, schemaName });
        });
      }
    });
  }

  // Detect relationships
  allTables.forEach((table, tableName) => {
    table.columns?.forEach(column => {
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
      // Fallback: detect by naming convention (e.g., user_id -> users.id)
      else if (column.name.endsWith('_id')) {
        const targetTable = column.name.replace('_id', 's');
        if (allTables.has(targetTable)) {
          const target = allTables.get(targetTable);
          const targetId = `${target.schemaName}.${targetTable}`;
          relationships.push({
            id: `${sourceId}-${column.name}`,
            source: sourceId,
            target: targetId,
            sourceColumn: column.name,
            targetColumn: 'id',
            type: 'inferred'
          });
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
    // Structure: { schemas: { schemaName: [table1, table2, ...] } }
    Object.entries(schema.schemas).forEach(([schemaName, tables]) => {
      if (Array.isArray(tables)) {
        tables.forEach((table) => {
          nodes.push({
            id: `${schemaName}.${table.name}`,
            type: 'tableNode',
            position: { x: 0, y: 0 },
            data: {
              label: table.name,
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
export function getLayoutedElements(nodes, edges, direction = 'TB') {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  
  const nodeWidth = 250;
  const nodeHeight = 200;

  dagreGraph.setGraph({ 
    rankdir: direction,
    nodesep: 100,
    ranksep: 150
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
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
        y: nodeWithPosition.y - nodeHeight / 2,
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

/**
 * Detect cardinality of a relationship
 */
export function detectCardinality(relationship, schema) {
    if (!relationship || !schema) return '1:N';

    const allTables = new Map();

    // Collect all tables
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
                const rel = {
                    id: `${sourceId}-${column.name}`,
                    source: sourceId,
                    target: targetId,
                    sourceColumn: column.name,
                    targetColumn: column.foreign_key.column,
                    type: 'foreignKey'
                };
                rel.cardinality = detectCardinality(rel, schema);
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
                        rel.cardinality = detectCardinality(rel, schema);
                        relationships.push(rel);
                        break;
                    }
                }
            }
        });
    });

    return relationships;
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
        label: showLabels ? `${rel.cardinality || '1:N'}` : '',
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

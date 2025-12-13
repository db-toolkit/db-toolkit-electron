/**
 * Drop table utility with confirmation dialog
 */

async function getDbType(connectionId) {
    try {
        const result = await window.electron.ipcRenderer.invoke('connections:getAll');
        const connections = result.data || result;
        const conn = connections.find(c => c.id === connectionId);
        return conn?.db_type || 'postgres';
    } catch (error) {
        console.error('Failed to get db type:', error);
        return 'postgres';
    }
}

export async function dropTable(tableName, connectionId, onSuccess, toast) {
    const confirmed = window.confirm(
        `Are you sure you want to drop table "${tableName}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    try {
        const query = `DROP TABLE IF EXISTS ${tableName}`;
        const result = await window.electron.ipcRenderer.invoke('query:execute', connectionId, {
            query,
            limit: 0,
            offset: 0
        });

        // Check if query failed
        if (result.data && !result.data.success) {
            throw new Error(result.data.error || 'Query failed');
        }

        if (toast) {
            toast.success(`Table "${tableName}" dropped successfully`);
        }
        
        if (onSuccess) {
            onSuccess();
        }
    } catch (error) {
        console.error('Drop table error:', error);
        
        // Check for foreign key constraint error
        if (error.message && error.message.includes('FOREIGN KEY constraint')) {
            const dbType = await getDbType(connectionId);
            
            if (dbType === 'sqlite') {
                const forceDelete = window.confirm(
                    `Cannot drop table "${tableName}" because it has foreign key constraints.\n\n` +
                    `Do you want to FORCE delete (temporarily disables foreign key checks)?\n\n` +
                    `WARNING: This may leave orphaned data in dependent tables.\n\n` +
                    `Click OK to force delete, or Cancel to abort.`
                );

                if (forceDelete) {
                    try {
                        // Execute queries separately for SQLite
                        await window.electron.ipcRenderer.invoke('query:execute', connectionId, {
                            query: 'PRAGMA foreign_keys = OFF',
                            limit: 0,
                            offset: 0
                        });

                        const dropResult = await window.electron.ipcRenderer.invoke('query:execute', connectionId, {
                            query: `DROP TABLE IF EXISTS ${tableName}`,
                            limit: 0,
                            offset: 0
                        });

                        await window.electron.ipcRenderer.invoke('query:execute', connectionId, {
                            query: 'PRAGMA foreign_keys = ON',
                            limit: 0,
                            offset: 0
                        });

                        if (dropResult.data && !dropResult.data.success) {
                            throw new Error(dropResult.data.error || 'Force delete failed');
                        }

                        if (toast) {
                            toast.success(`Table "${tableName}" force deleted`);
                        }
                        
                        if (onSuccess) {
                            onSuccess();
                        }
                    } catch (forceError) {
                        console.error('Force delete error:', forceError);
                        // Re-enable foreign keys even on error
                        try {
                            await window.electron.ipcRenderer.invoke('query:execute', connectionId, {
                                query: 'PRAGMA foreign_keys = ON',
                                limit: 0,
                                offset: 0
                            });
                        } catch (e) {
                            console.error('Failed to re-enable foreign keys:', e);
                        }
                        if (toast) {
                            toast.error(`Failed to force delete table: ${forceError.message}`);
                        }
                    }
                }
            } else {
                const cascade = window.confirm(
                    `Cannot drop table "${tableName}" because it has foreign key constraints.\n\n` +
                    `Do you want to CASCADE delete (this will also drop dependent objects)?\n\n` +
                    `Click OK to CASCADE delete, or Cancel to abort.`
                );

                if (cascade) {
                    try {
                        const cascadeQuery = `DROP TABLE IF EXISTS ${tableName} CASCADE`;
                        const cascadeResult = await window.electron.ipcRenderer.invoke('query:execute', connectionId, {
                            query: cascadeQuery,
                            limit: 0,
                            offset: 0
                        });

                        if (cascadeResult.data && !cascadeResult.data.success) {
                            throw new Error(cascadeResult.data.error || 'Cascade delete failed');
                        }

                        if (toast) {
                            toast.success(`Table "${tableName}" dropped with CASCADE`);
                        }
                        
                        if (onSuccess) {
                            onSuccess();
                        }
                    } catch (cascadeError) {
                        console.error('Cascade delete error:', cascadeError);
                        if (toast) {
                            toast.error(`Failed to drop table: ${cascadeError.message}`);
                        }
                    }
                }
            }
        } else {
            if (toast) {
                toast.error(`Failed to drop table: ${error.message}`);
            }
        }
    }
}

export { gettingStartedData } from './gettingStarted';
export { connectionsData } from './connections';
export { queryEditorData } from './queryEditor';
export { schemaExplorerData } from './schemaExplorer';
export { dataExplorerData } from './dataExplorer';
export { backupRestoreData } from './backupRestore';
export { settingsData } from './settings';
export { migrationsData } from './migrations';
export { workspacesData } from './workspaces';
export { changelogData } from './changelog';

export interface DocSection {
  heading: string;
  content: string;
}

export interface DocData {
  title: string;
  sections: DocSection[];
}

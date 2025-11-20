import { useState, useMemo, useCallback, useEffect } from 'react';
import { BookOpen, Database, Code } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import DocContent from '../components/DocContent';
import ScrollToTop from '../components/ScrollToTop';
import BottomBar from '../components/BottomBar';

const loadData = async (section: string) => {
  switch (section) {
    case 'getting-started':
      return (await import('../data/gettingStarted')).gettingStartedData;
    case 'connections':
      return (await import('../data/connections')).connectionsData;
    case 'query-editor':
      return (await import('../data/queryEditor')).queryEditorData;
    case 'schema-explorer':
      return (await import('../data/schemaExplorer')).schemaExplorerData;
    case 'data-explorer':
      return (await import('../data/dataExplorer')).dataExplorerData;
    case 'backup-restore':
      return (await import('../data/backupRestore')).backupRestoreData;
    case 'migrations':
      return (await import('../data/migrations')).migrationsData;
    case 'settings':
      return (await import('../data/settings')).settingsData;
    default:
      return (await import('../data/gettingStarted')).gettingStartedData;
  }
};

const sections = [
  { id: 'getting-started', label: 'Getting Started' },
  { id: 'connections', label: 'Connections' },
  { id: 'query-editor', label: 'Query Editor' },
  { id: 'schema-explorer', label: 'Schema Explorer' },
  { id: 'data-explorer', label: 'Data Explorer' },
  { id: 'backup-restore', label: 'Backup & Restore' },
  { id: 'migrations', label: 'Migrations' },
  { id: 'settings', label: 'Settings' },
];

export default function GuidePage() {
  const [activeSection, setActiveSection] = useState('getting-started');
  const [currentData, setCurrentData] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    loadData(activeSection).then(setCurrentData);
  }, [activeSection]);
  
  const { prevSection, nextSection } = useMemo(() => {
    const currentIndex = sections.findIndex(s => s.id === activeSection);
    return {
      prevSection: currentIndex > 0 ? sections[currentIndex - 1] : undefined,
      nextSection: currentIndex < sections.length - 1 ? sections[currentIndex + 1] : undefined
    };
  }, [activeSection]);
  
  const handleSectionChange = useCallback((section: string) => {
    setActiveSection(section);
  }, []);

  return (
    <>
      <div className="flex w-full h-auto pb-20 lg:pb-0">
        <div className="hidden lg:block w-72 flex-shrink-0" />
        <Sidebar 
          activeSection={activeSection} 
          onSectionChange={handleSectionChange}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
        <div className="w-full lg:w-auto">
          {currentData && <DocContent 
            data={currentData} 
            prevSection={prevSection}
            nextSection={nextSection}
            onNavigate={setActiveSection}
          />}
        </div>
      </div>
      
      <BottomBar
        items={[
          {
            label: 'Start',
            icon: <BookOpen size={20} />,
            onClick: () => setActiveSection('getting-started'),
            isActive: activeSection === 'getting-started'
          },
          {
            label: 'Connect',
            icon: <Database size={20} />,
            onClick: () => setActiveSection('connections'),
            isActive: activeSection === 'connections'
          },
          {
            label: 'Query',
            icon: <Code size={20} />,
            onClick: () => setActiveSection('query-editor'),
            isActive: activeSection === 'query-editor'
          }
        ]}
        onMenuClick={() => setIsSidebarOpen(true)}
      />
      
      <ScrollToTop />
    </>
  );
}

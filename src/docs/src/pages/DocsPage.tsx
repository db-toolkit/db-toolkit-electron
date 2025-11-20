import { useState, useEffect, lazy, Suspense } from 'react';
import { BookOpen, Clock } from 'lucide-react';
import CommandPalette from '../components/CommandPalette';

const GuidePage = lazy(() => import('./GuidePage'));
const ChangelogPage = lazy(() => import('./ChangelogPage'));

interface DocsPageProps {
  isCommandOpen: boolean;
  onCommandClose: () => void;
}

export default function DocsPage({ isCommandOpen, onCommandClose }: DocsPageProps) {
  const [activeTab, setActiveTab] = useState<'guide' | 'changelog'>('guide');
  const [navigateToSection, setNavigateToSection] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);

  return (
    <>
      <div className="fixed top-[64px] md:top-[72px] left-0 right-0 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 z-40">
        <div className="flex gap-4 md:gap-8 px-4 md:px-8">
          <button
            onClick={() => setActiveTab('guide')}
            className={`px-3 md:px-4 py-2 md:py-3 font-medium border-b-2 transition-colors flex items-center gap-2 text-sm md:text-base ${
              activeTab === 'guide'
                ? 'border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <BookOpen size={16} className="md:w-[18px] md:h-[18px]" />
            <span>Guide</span>
          </button>
          <button
            onClick={() => setActiveTab('changelog')}
            className={`px-3 md:px-4 py-2 md:py-3 font-medium border-b-2 transition-colors flex items-center gap-2 text-sm md:text-base ${
              activeTab === 'changelog'
                ? 'border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Clock size={16} className="md:w-[18px] md:h-[18px]" />
            <span>Changelog</span>
          </button>
        </div>
      </div>
      
      <div className="pt-[112px] md:pt-[124px] h-auto">
        <Suspense fallback={
          <div className="flex items-center justify-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
          </div>
        }>
          {activeTab === 'guide' ? <GuidePage navigateToSection={navigateToSection} /> : <ChangelogPage />}
        </Suspense>
      </div>
      
      <CommandPalette 
        isOpen={isCommandOpen} 
        onClose={onCommandClose}
        onNavigate={(section) => {
          setActiveTab('guide');
          setNavigateToSection(section);
        }}
      />
    </>
  );
}

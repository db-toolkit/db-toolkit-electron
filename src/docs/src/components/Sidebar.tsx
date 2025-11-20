import { memo } from 'react';
import { BookOpen, Database, Code, FolderTree, Table, Shield, Settings, GitBranch, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeInUp, staggerContainer } from '../utils/motion';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const sections = [
  { id: 'getting-started', label: 'Getting Started', icon: BookOpen },
  { id: 'connections', label: 'Connections', icon: Database },
  { id: 'query-editor', label: 'Query Editor', icon: Code },
  { id: 'schema-explorer', label: 'Schema Explorer', icon: FolderTree },
  { id: 'data-explorer', label: 'Data Explorer', icon: Table },
  { id: 'backup-restore', label: 'Backup & Restore', icon: Shield },
  { id: 'migrations', label: 'Migrations', icon: GitBranch },
  { id: 'settings', label: 'Settings', icon: Settings },
];

function Sidebar({ activeSection, onSectionChange, isOpen, onClose }: SidebarProps) {
  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>
      
      <motion.aside
        className="w-72 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-[calc(100vh-64px)] md:h-[calc(100vh-72px)] flex flex-col fixed left-0 top-[64px] md:top-[72px] z-50 lg:h-[calc(100vh-124px)] lg:top-[124px]"
        style={{ x: 0 }}
        animate={{ x: isOpen || window.innerWidth >= 1024 ? 0 : -288 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      >
        <div className="px-6 py-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">DB Toolkit</h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">v0.3.0</span>
          </div>
          <button onClick={onClose} className="lg:hidden hover:bg-gray-200 dark:hover:bg-gray-700 p-2 rounded">
            <X size={20} />
          </button>
        </div>
      <motion.nav 
        className="flex flex-col flex-1"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {sections.map((section) => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;
          return (
            <motion.button
              key={section.id}
              className={`px-6 py-3 text-left flex items-center gap-3 transition-all border-l-3 ${
                isActive 
                  ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-semibold border-l-emerald-600 dark:border-l-emerald-400' 
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-emerald-600 dark:hover:text-emerald-400 border-l-transparent'
              }`}
              onClick={() => {
                onSectionChange(section.id);
                onClose();
              }}
              variants={fadeInUp}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
            >
              <Icon size={18} />
              <span>{section.label}</span>
            </motion.button>
          );
        })}
        </motion.nav>
      </motion.aside>
    </>
  );
}

export default memo(Sidebar);

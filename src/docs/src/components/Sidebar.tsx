import { BookOpen, Database, Code, FolderTree, Table, Shield, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer } from '../utils/motion';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const sections = [
  { id: 'getting-started', label: 'Getting Started', icon: BookOpen },
  { id: 'connections', label: 'Connections', icon: Database },
  { id: 'query-editor', label: 'Query Editor', icon: Code },
  { id: 'schema-explorer', label: 'Schema Explorer', icon: FolderTree },
  { id: 'data-explorer', label: 'Data Explorer', icon: Table },
  { id: 'backup-restore', label: 'Backup & Restore', icon: Shield },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  return (
    <aside className="w-72 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-[calc(100vh-124px)] flex flex-col fixed left-0 top-[124px]">
      <div className="px-6 py-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">DB Toolkit</h2>
        <span className="text-sm text-gray-500 dark:text-gray-400">v0.3.0</span>
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
              onClick={() => onSectionChange(section.id)}
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
    </aside>
  );
}

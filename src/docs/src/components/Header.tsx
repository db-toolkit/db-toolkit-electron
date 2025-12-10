import { memo } from 'react';
import { Database, Github, Moon, Sun, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeIn } from '../utils/motion';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  onSearchClick: () => void;
}

function Header({ onSearchClick }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.header 
      className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 md:px-8 py-4 shadow-lg fixed top-0 left-0 right-0 z-50"
      {...fadeIn}
    >
      <div className="flex items-center justify-between max-w-7xl mx-auto gap-2 md:gap-4">
        <div className="flex items-center gap-2 md:gap-3">
          <Database size={24} className="md:w-8 md:h-8" />
          <span className="text-lg md:text-2xl font-bold">DB Toolkit</span>
        </div>
        
        <button
          onClick={onSearchClick}
          className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors min-w-[200px] md:min-w-[300px]"
        >
          <Search size={16} />
          <span className="text-sm flex-1 text-left">Search</span>
          <kbd className="px-2 py-0.5 text-xs bg-white/20 rounded">⌘K</kbd>
        </button>
        
        <div className="flex items-center gap-2 md:gap-4">
          <button
            onClick={onSearchClick}
            className="sm:hidden hover:opacity-80 transition-opacity"
            aria-label="Search"
          >
            <Search size={20} />
          </button>
          <button 
            onClick={toggleTheme}
            className="hover:opacity-80 transition-opacity"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon size={20} className="md:w-6 md:h-6" /> : <Sun size={20} className="md:w-6 md:h-6" />}
          </button>
          <a 
            href="https://github.com/db-toolkit/db-toolkit" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="hover:scale-110 hover:text-gray-900 dark:hover:text-white transition-all"
            aria-label="GitHub"
          >
            <Github size={20} className="md:w-6 md:h-6" />
          </a>
        </div>
      </div>
    </motion.header>
  );
}

export default memo(Header);

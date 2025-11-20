import { Database, Github, Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeIn } from '../utils/motion';
import { useTheme } from '../context/ThemeContext';

export default function Header() {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.header 
      className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-8 py-4 shadow-lg fixed top-0 left-0 right-0 z-50"
      {...fadeIn}
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Database size={32} />
          <span className="text-2xl font-bold">DB Toolkit Docs</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleTheme}
            className="hover:opacity-80 transition-opacity"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon size={24} /> : <Sun size={24} />}
          </button>
          <a 
            href="https://github.com/Adelodunpeter25/db-toolkit" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="hover:scale-110 transition-transform"
            aria-label="GitHub"
          >
            <Github size={24} />
          </a>
        </div>
      </div>
    </motion.header>
  );
}

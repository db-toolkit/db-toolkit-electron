import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeInUp, staggerContainer } from '../utils/motion';
import { changelogVersions } from '../data/changelog';
import ScrollToTop from '../components/ScrollToTop';
import BottomBar from '../components/BottomBar';
import { X, Calendar } from 'lucide-react';

export default function ChangelogPage() {
  const [activeVersion, setActiveVersion] = useState(changelogVersions[0].version);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const selectedVersion = changelogVersions.find(v => v.version === activeVersion)!;

  const handleVersionChange = (version: string) => {
    setActiveVersion(version);
    setIsSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  return (
    <>
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>
      
      <div className="flex w-full pb-20 lg:pb-0">
        <motion.aside
          className="w-72 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-[calc(100vh-112px)] md:h-[calc(100vh-124px)] flex flex-col fixed left-0 top-[112px] md:top-[124px] z-50 lg:translate-x-0"
          initial={false}
          animate={{ x: isSidebarOpen ? 0 : -288 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        >
          <div className="px-6 py-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">DB Toolkit</h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">v0.3.0</span>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden hover:bg-gray-200 dark:hover:bg-gray-700 p-2 rounded">
              <X size={20} />
            </button>
          </div>
          <div className="px-6 py-6">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-4">Versions</h3>
            <div className="flex flex-col gap-2">
              {changelogVersions.map((version) => (
                <button
                  key={version.version}
                  onClick={() => handleVersionChange(version.version)}
                  className={`px-3 py-2 text-left rounded-lg transition-colors ${
                    activeVersion === version.version
                      ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-semibold'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="text-sm">v{version.version}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{version.date}</div>
                </button>
              ))}
            </div>
          </div>
        </motion.aside>
      
        <div className="hidden lg:block w-72 flex-shrink-0" />
      
        <motion.main 
          className="p-4 md:p-8 lg:p-12 max-w-4xl w-full"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          <motion.h1 
            className="text-3xl md:text-4xl lg:text-5xl font-bold mb-2 bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent"
            variants={fadeInUp}
          >
            v{selectedVersion.version}
          </motion.h1>
          <motion.p 
            className="text-gray-500 dark:text-gray-400 mb-6 md:mb-8 text-sm md:text-base"
            variants={fadeInUp}
          >
            Released on {selectedVersion.date}
          </motion.p>
          
          {selectedVersion.sections.map((section, index) => (
            <motion.section 
              key={index} 
              className="mb-8 md:mb-12"
              variants={fadeInUp}
            >
              <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4 pb-2 border-b-2 border-gray-200 dark:border-gray-700">{section.heading}</h2>
              <div className="space-y-4">
                {section.content.split('\n').map((line, i) => (
                  line.trim() && <p key={i} className="text-sm md:text-base text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{line}</p>
                ))}
              </div>
            </motion.section>
          ))}
        </motion.main>
      </div>
      
      <BottomBar
        items={changelogVersions.slice(0, 3).map((version) => ({
          label: `v${version.version}`,
          icon: <Calendar size={20} />,
          onClick: () => handleVersionChange(version.version),
          isActive: activeVersion === version.version
        }))}
        onMenuClick={() => setIsSidebarOpen(true)}
      />
      
      <ScrollToTop />
    </>
  );
}

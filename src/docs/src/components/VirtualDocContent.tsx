import { memo, useMemo } from 'react';
import type { DocData } from '../data';
import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer } from '../utils/motion';
import { ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import { parseContent } from '../utils/contentParser';
import { VariableSizeList as List } from 'react-window';

interface VirtualDocContentProps {
  data: DocData;
  prevSection?: { id: string; label: string };
  nextSection?: { id: string; label: string };
  onNavigate?: (id: string) => void;
}

function VirtualDocContent({ data, prevSection, nextSection, onNavigate }: VirtualDocContentProps) {
  const handleNavigate = (id: string) => {
    if (onNavigate) {
      onNavigate(id);
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  const sections = useMemo(() => data.sections, [data]);
  
  const getItemSize = (index: number) => {
    const section = sections[index];
    const lineCount = section.content.split('\n').length;
    return Math.max(300, lineCount * 30 + 200);
  };

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const section = sections[index];
    return (
      <div style={style}>
        <motion.section 
          className={`mb-12 p-8 rounded-xl ${index % 2 === 0 ? 'bg-gray-50/50 dark:bg-gray-800/30' : ''}`}
          variants={fadeInUp}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 bg-gradient-to-b from-emerald-600 to-teal-600 rounded-full" />
            <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
              {section.heading}
            </h2>
            <Sparkles size={20} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="space-y-2">
            {parseContent(section.content)}
          </div>
        </motion.section>
      </div>
    );
  };

  return (
    <motion.main 
      className="p-12 max-w-4xl w-full"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      <motion.h1 
        className="text-5xl font-bold mb-8 bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent"
        variants={fadeInUp}
      >
        {data.title}
      </motion.h1>
      
      <List
        height={800}
        itemCount={sections.length}
        itemSize={getItemSize}
        width="100%"
      >
        {Row}
      </List>
      
      {(prevSection || nextSection) && onNavigate && (
        <motion.div 
          className="mt-16 pt-8 border-t-2 border-gray-200 dark:border-gray-700 flex justify-between items-center gap-4"
          variants={fadeInUp}
        >
          {prevSection ? (
            <button
              onClick={() => handleNavigate(prevSection.id)}
              className="flex items-center gap-3 px-6 py-4 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
            >
              <ArrowLeft size={24} />
              <div className="text-left">
                <div className="text-sm opacity-70">Previous</div>
                <div className="text-lg font-semibold">{prevSection.label}</div>
              </div>
            </button>
          ) : <div />}
          
          {nextSection && (
            <button
              onClick={() => handleNavigate(nextSection.id)}
              className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl"
            >
              <div className="text-right">
                <div className="text-sm opacity-80">Next</div>
                <div className="text-lg font-semibold">{nextSection.label}</div>
              </div>
              <ArrowRight size={24} />
            </button>
          )}
        </motion.div>
      )}
    </motion.main>
  );
}

export default memo(VirtualDocContent);

import { memo, ReactNode } from 'react';
import { AlertCircle, CheckCircle, Info, Lightbulb } from 'lucide-react';

interface ContentBlockProps {
  type: 'tip' | 'warning' | 'note' | 'success';
  children: ReactNode;
}

const blockStyles = {
  tip: {
    bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    icon: <Lightbulb className="text-blue-600 dark:text-blue-400" size={20} />,
    title: 'Tip'
  },
  warning: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    icon: <AlertCircle className="text-yellow-600 dark:text-yellow-400" size={20} />,
    title: 'Warning'
  },
  note: {
    bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    icon: <Info className="text-red-600 dark:text-red-400" size={20} />,
    title: 'Important'
  },
  success: {
    bg: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    icon: <CheckCircle className="text-green-600 dark:text-green-400" size={20} />,
    title: 'Success'
  }
};

function ContentBlock({ type, children }: ContentBlockProps) {
  const style = blockStyles[type];
  
  return (
    <div className={`${style.bg} border-l-4 p-4 rounded-r-lg my-4`}>
      <div className="flex gap-3">
        {style.icon}
        <div className="flex-1">
          <div className="font-semibold mb-1 text-gray-900 dark:text-gray-100">{style.title}</div>
          <div className="text-sm leading-relaxed text-gray-800 dark:text-gray-200">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default memo(ContentBlock);

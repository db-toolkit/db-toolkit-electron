import { memo, ReactNode } from 'react';
import { Menu } from 'lucide-react';

interface BottomBarItem {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  isActive?: boolean;
}

interface BottomBarProps {
  items: BottomBarItem[];
  onMenuClick: () => void;
}

function BottomBar({ items, onMenuClick }: BottomBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 lg:hidden z-50">
      <div className="flex justify-around items-center py-3">
        {items.map((item, index) => (
          <button
            key={index}
            onClick={item.onClick}
            className={`flex flex-col items-center gap-1 px-3 py-2 transition-colors ${
              item.isActive
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400'
            }`}
          >
            {item.icon}
            <span className="text-xs">{item.label}</span>
          </button>
        ))}
        
        <button
          onClick={onMenuClick}
          className="flex flex-col items-center gap-1 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
        >
          <Menu size={20} />
          <span className="text-xs">Menu</span>
        </button>
      </div>
    </div>
  );
}

export default memo(BottomBar);

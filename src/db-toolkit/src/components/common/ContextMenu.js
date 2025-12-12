import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

/**
 * Reusable context menu component.
 */
export function ContextMenu({ isOpen, position, onClose, items, children }) {
  const menuRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && menuRef.current) {
      const menu = menuRef.current;
      const rect = menu.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let { x, y } = position;

      if (x + rect.width > viewportWidth) {
        x = viewportWidth - rect.width - 10;
      }

      if (y + rect.height > viewportHeight) {
        y = viewportHeight - rect.height - 10;
      }

      menu.style.left = `${x}px`;
      menu.style.top = `${y}px`;
    }
  }, [isOpen, position]);

  if (!isOpen) return null;

  const content = (
    <div
      ref={menuRef}
      className="fixed z-[9999] min-w-[200px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 animate-in fade-in zoom-in-95 duration-100"
      role="menu"
      style={{ left: position.x, top: position.y }}
    >
      {children || items?.map((item, index) => (
        item.separator ? (
          <div key={index} className="h-px bg-gray-200 dark:bg-gray-700 my-1" />
        ) : (
          <button
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              if (!item.disabled) {
                item.onClick?.();
                onClose();
              }
            }}
            disabled={item.disabled}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-left transition-colors ${
              item.disabled
                ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                : item.danger
                ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            role="menuitem"
          >
            {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
            <span className="flex-1">{item.label}</span>
            {item.shortcut && (
              <span className="text-xs text-gray-400 dark:text-gray-500">{item.shortcut}</span>
            )}
          </button>
        )
      ))}
    </div>
  );

  return createPortal(content, document.body);
}

/**
 * Hook for managing context menu state.
 */
export function useContextMenu() {
  const [state, setState] = useState({ isOpen: false, position: { x: 0, y: 0 }, data: null });

  const open = useCallback((e, data = null) => {
    e.preventDefault();
    e.stopPropagation();
    setState({
      isOpen: true,
      position: { x: e.clientX, y: e.clientY },
      data
    });
  }, []);

  const close = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: false }));
  }, []);

  return { ...state, open, close };
}



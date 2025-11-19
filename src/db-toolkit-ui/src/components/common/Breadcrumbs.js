import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Breadcrumbs({ items }) {
  if (!items || items.length === 0) return null;

  return (
    <nav className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          {index > 0 && <ChevronRight size={16} className="text-gray-400" />}
          {item.href ? (
            <Link
              to={item.href}
              className="hover:text-gray-900 dark:hover:text-gray-200 transition"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-900 dark:text-gray-100 font-medium">
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}

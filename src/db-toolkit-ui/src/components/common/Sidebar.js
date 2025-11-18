
import { Link } from 'react-router-dom';
import { Database, Home } from 'lucide-react';

function Sidebar() {
  return (
    <aside className="w-64 bg-gray-100 dark:bg-gray-950 text-gray-900 dark:text-white h-screen flex flex-col border-r border-gray-200 dark:border-gray-900">
      <div className="p-6 border-b border-gray-200 dark:border-gray-900">
        <div className="flex items-center gap-2">
          <Database size={28} className="text-blue-600 dark:text-blue-500" />
          <h1 className="text-xl font-bold">DB Toolkit</h1>
        </div>
      </div>
      <nav className="flex-1 p-4">
        <Link
          to="/"
          className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-900 transition"
        >
          <Home size={20} />
          <span>Connections</span>
        </Link>
      </nav>
    </aside>
  );
}

export default Sidebar;

import Link from 'next/link';
import { Database, Github, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-6 py-8">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Database size={28} className="text-cyan-600 dark:text-cyan-400" />
              <span className="font-bold text-xl text-gray-900 dark:text-white">DB Toolkit</span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-base">
              Modern database management made simple.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-base">Product</h3>
            <ul className="space-y-3 text-base">
              <li><Link href="/" className="text-gray-600 dark:text-gray-400 hover:text-cyan-600 dark:hover:text-cyan-400">Home</Link></li>
              <li><Link href="/about" className="text-gray-600 dark:text-gray-400 hover:text-cyan-600 dark:hover:text-cyan-400">About</Link></li>
              <li><Link href="/blog" className="text-gray-600 dark:text-gray-400 hover:text-cyan-600 dark:hover:text-cyan-400">Blog</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-base">Resources</h3>
            <ul className="space-y-3 text-base">
              <li><a href="https://docs-dbtoolkit.vercel.app/" target="_blank" rel="noopener noreferrer" className="text-gray-600 dark:text-gray-400 hover:text-cyan-600 dark:hover:text-cyan-400">Documentation</a></li>
              <li><Link href="/downloads" className="text-gray-600 dark:text-gray-400 hover:text-cyan-600 dark:hover:text-cyan-400">Downloads</Link></li>
              <li><a href="https://github.com/db-toolkit/db-toolkit/issues" target="_blank" rel="noopener noreferrer" className="text-gray-600 dark:text-gray-400 hover:text-cyan-600 dark:hover:text-cyan-400">Support</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-base">Connect</h3>
            <div className="flex gap-4">
              <a href="https://github.com/db-toolkit/db-toolkit" target="_blank" rel="noopener noreferrer" className="text-gray-600 dark:text-gray-400 hover:text-cyan-600 dark:hover:text-cyan-400">
                <Github size={20} />
              </a>
              <a href="mailto:adelodunpeter24@gmail.com" className="text-gray-600 dark:text-gray-400 hover:text-cyan-600 dark:hover:text-cyan-400">
                <Mail size={20} />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-800 pt-8 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>© 2025 DB Toolkit. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

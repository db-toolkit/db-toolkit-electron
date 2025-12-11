'use client';

import { useEffect, useState } from 'react';
import { List } from 'lucide-react';

export default function TableOfContents({ headings }) {
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-100px 0px -80% 0px' }
    );

    headings.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav className="hidden xl:block sticky top-24 max-h-[calc(100vh-6rem)] overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <List size={20} className="text-cyan-600 dark:text-teal-400" />
          <h3 className="font-bold text-gray-900 dark:text-white">Table of Contents</h3>
        </div>
        <ul className="space-y-2">
          {headings.map(({ id, text, level }) => (
            <li key={id} className={level === 3 ? 'ml-4' : ''}>
              <a
                href={`#${id}`}
                className={`block text-sm transition-colors ${
                  activeId === id
                    ? 'text-cyan-600 dark:text-teal-400 font-semibold'
                    : 'text-gray-600 dark:text-gray-400 hover:text-cyan-600 dark:hover:text-teal-400'
                }`}
              >
                {text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

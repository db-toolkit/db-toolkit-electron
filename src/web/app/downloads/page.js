'use client';

import { Download, Monitor, Apple } from 'lucide-react';
import Link from 'next/link';

export default function DownloadsPage() {
  const platforms = [
    {
      name: 'Windows',
      icon: <Monitor size={48} />,
      version: 'Latest',
      url: 'https://github.com/Adelodunpeter25/db-toolkit/releases/latest/download/DB.Toolkit-win-x64.exe'
    },
    {
      name: 'macOS',
      icon: <Apple size={48} />,
      version: 'Latest',
      url: 'https://github.com/Adelodunpeter25/db-toolkit/releases/latest/download/DB.Toolkit-mac-x64.dmg'
    },
    {
      name: 'Linux',
      icon: <Monitor size={48} />,
      version: 'Latest',
      url: 'https://github.com/Adelodunpeter25/db-toolkit/releases/latest/download/DB.Toolkit-linux.AppImage'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">
            Download DB Toolkit
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Choose your platform and start managing databases
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-12">
          {platforms.map((platform) => (
            <div
              key={platform.name}
              className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex justify-center mb-6 text-cyan-600 dark:text-cyan-400">
                {platform.icon}
              </div>
              <h3 className="text-2xl font-bold text-center mb-2 text-gray-900 dark:text-white">
                {platform.name}
              </h3>
              <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
                {platform.version}
              </p>
              <a
                href={platform.url}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-600 to-teal-600 text-white rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-300 font-semibold"
              >
                <Download size={20} />
                Download
              </a>
            </div>
          ))}
        </div>

        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Need help? Check out our{' '}
            <a
              href="https://docs-dbtoolkit.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-600 dark:text-cyan-400 hover:underline"
            >
              documentation
            </a>
          </p>
          <Link
            href="/"
            className="text-cyan-600 dark:text-cyan-400 hover:underline"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

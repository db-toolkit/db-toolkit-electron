import Hero from '@/components/Hero';
import FAQ from '@/components/FAQ';
import { Database, Zap, Shield } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />

      {/* Features Section */}
      <section className="container mx-auto px-6 py-20 bg-white dark:bg-gray-900">
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
          Features
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <Zap className="w-12 h-12 text-blue-600 dark:text-blue-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Fast & Efficient</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Lightning-fast query execution with Monaco editor and intelligent autocomplete
            </p>
          </div>
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <Database className="w-12 h-12 text-blue-600 dark:text-blue-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Multi-Database</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Support for PostgreSQL, MySQL, SQLite, and MongoDB all in one place
            </p>
          </div>
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <Shield className="w-12 h-12 text-blue-600 dark:text-blue-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Secure</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Encrypted credentials and secure connection management built-in
            </p>
          </div>
        </div>
      </section>

      <FAQ />

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 py-8 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-6 text-center text-gray-600 dark:text-gray-400">
          <p>© 2025 DB Toolkit. Built with ❤️ using Python, React, and Electron</p>
        </div>
      </footer>
    </main>
  );
}

import Hero from '@/components/Hero';
import Features from '@/components/Features';
import FAQ from '@/components/FAQ';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <Features />

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

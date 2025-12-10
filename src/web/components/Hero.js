'use client';

import { motion } from 'framer-motion';
import { Download, Github, ArrowRight } from 'lucide-react';
import { primaryGradient, buttonGradient } from '@/utils/gradients';
import { useDownload } from '@/hooks/useDownload';

export default function Hero() {
  const { download, downloading, platformUrl } = useDownload();

  return (
    <section className={`relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br ${primaryGradient.light} dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 pt-32`}>
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-blue-100/30 to-transparent rounded-full blur-3xl motion-reduce:animate-none"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [90, 0, 90],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-purple-100/30 to-transparent rounded-full blur-3xl motion-reduce:animate-none"
        />

      </div>

      <div className="relative container mx-auto px-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <span className="px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 text-sm font-bold rounded-full border-2 border-blue-200 dark:border-blue-700">
            🎉 v0.1.0 Beta Release
          </span>
        </motion.div>

        {/* Subtitle */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-6xl md:text-7xl font-bold text-gray-900 dark:text-white mb-4 max-w-4xl mx-auto"
        >
          Your <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">all-in-one</span> database companion
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-4 max-w-2xl mx-auto"
        >
          Query, migrate, and backup databases effortlessly
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="text-base text-gray-500 dark:text-gray-400 mb-12 italic"
        >
          "Simplify your database workflow, amplify your productivity"
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <button
            onClick={() => download(platformUrl, 'DB-Toolkit')}
            disabled={!!downloading}
            className={`group flex items-center gap-2 px-8 py-4 bg-gradient-to-r ${buttonGradient} text-white rounded-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 font-semibold disabled:opacity-70 disabled:cursor-not-allowed disabled:scale-100`}
          >
            {downloading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                Downloading...
              </>
            ) : (
              <>
                <Download size={20} />
                Download Now
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
          <a
            href="https://docs-dbtoolkit.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-8 py-4 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-lg hover:scale-105 transition-all duration-300 font-semibold"
          >
            View Docs
            <ArrowRight size={20} />
          </a>
        </motion.div>

        {/* App Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="mt-20 max-w-6xl mx-auto"
        >
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700">
            <img 
              src="/preview.png" 
              alt="DB Toolkit Application Preview" 
              className="w-full h-auto"
            />
          </div>
        </motion.div>

      </div>
    </section>
  );
}

'use client';

import { motion } from 'framer-motion';
import { Database, Download, Github, ArrowRight } from 'lucide-react';
import { primaryGradient, buttonGradient } from '@/utils/gradients';
import { detectPlatform, getDownloadUrl } from '@/utils/detectPlatform';
import { useEffect, useState } from 'react';

export default function Hero() {
  const [downloadUrl, setDownloadUrl] = useState('/downloads');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const platform = detectPlatform();
      if (platform) {
        setDownloadUrl(getDownloadUrl(platform));
      }
    }
  }, []);

  const handleDownload = (url) => {
    setDownloading(true);
    window.location.href = url;
    setTimeout(() => setDownloading(false), 2000);
  };

  return (
    <section className={`relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br ${primaryGradient.light} dark:from-gray-950 dark:via-gray-900 dark:to-gray-950`}>
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
        
        {/* Floating particles */}
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-3 h-3 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-full motion-reduce:hidden"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -50, 0],
              x: [0, Math.random() * 20 - 10, 0],
              opacity: [0.3, 0.8, 0.3],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 4 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 3,
            }}
          />
        ))}
      </div>

      <div className="relative container mx-auto px-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <span className="px-4 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-semibold rounded-full">
            🎉 v0.5.0 - Introducing DbAssist AI
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
            onClick={() => handleDownload(downloadUrl)}
            disabled={downloading}
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
            href="https://github.com/Adelodunpeter25/db-toolkit"
            className="flex items-center gap-2 px-8 py-4 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-lg hover:scale-105 transition-all duration-300 font-semibold"
          >
            <Github size={20} />
            View on GitHub
          </a>
        </motion.div>

      </div>
    </section>
  );
}

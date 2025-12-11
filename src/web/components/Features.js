'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Zap, Shield, Code, Lock, BarChart3 } from 'lucide-react';
import { fadeInUp } from '@/utils/motion';
import Image from 'next/image';

export default function Features() {
  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
    {
      icon: Code,
      title: 'Query Editor',
      description: 'Monaco editor with syntax highlighting, autocomplete, and query formatting.',
      image: '/features/editor.png'
    },
    {
      icon: Zap,
      title: 'Data Explorer',
      description: 'Browse, edit, and manage table data with inline editing, pagination, CSV and JSON export.',
      image: '/features/data.png'
    },
    {
      icon: Lock,
      title: 'Automated Backups',
      description: 'Schedule backups with retention policies and one-click restore.',
      image: '/features/backup.png'
    },
    {
      icon: BarChart3,
      title: 'Real-time Analytics',
      description: 'Monitor performance with live metrics and query execution insights.',
      image: '/features/analytics.png'
    }
  ];

  return (
    <section className="py-20 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-6">
        <motion.div {...fadeInUp(0)} className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Powerful Features
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Everything you need to manage your databases efficiently
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-8 max-w-7xl mx-auto">
          {/* Feature Buttons - Left Side */}
          <div className="lg:col-span-2 space-y-3">
            {features.map((feature, index) => (
              <motion.button
                key={feature.title}
                onClick={() => setActiveFeature(index)}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`w-full text-left p-6 rounded-xl border-2 transition-all duration-300 ${
                  activeFeature === index
                    ? 'bg-gradient-to-r from-cyan-50 to-teal-50 dark:from-gray-800 dark:to-gray-800 border-cyan-500 dark:border-teal-500 shadow-lg'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${
                    activeFeature === index
                      ? 'bg-cyan-100 dark:bg-cyan-900/30'
                      : 'bg-gray-100 dark:bg-gray-700'
                  }`}>
                    <feature.icon className={`w-6 h-6 ${
                      activeFeature === index
                        ? 'text-cyan-600 dark:text-cyan-400'
                        : 'text-gray-600 dark:text-gray-400'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-lg font-semibold mb-1 ${
                      activeFeature === index
                        ? 'text-gray-900 dark:text-white'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {feature.title}
                    </h3>
                    <p className={`text-sm ${
                      activeFeature === index
                        ? 'text-gray-600 dark:text-gray-300'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {feature.description}
                    </p>
                  </div>
                </div>
              </motion.button>
            ))}
            <p className="text-sm italic text-gray-400 dark:text-gray-500 text-center mt-4">
              and many more...
            </p>
          </div>

          {/* Feature Preview - Right Side (Hidden on Mobile) */}
          <div className="hidden lg:block lg:col-span-3">
            <div className="sticky top-24 bg-white/40 dark:bg-gray-900/40 backdrop-blur-md rounded-2xl border border-white/20 dark:border-gray-700/30 shadow-2xl p-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeFeature}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="relative w-full h-auto"
                >
                  <Image
                    src={features[activeFeature].image}
                    alt={features[activeFeature].title}
                    width={1200}
                    height={800}
                    className="w-full h-auto rounded-lg"
                    priority
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

'use client';

import { motion } from 'framer-motion';
import { Database, Users, Target, Sparkles } from 'lucide-react';
import { fadeInUp, staggerContainer } from '@/utils/motion';
import Footer from '@/components/Footer';

export default function About() {
  return (
    <main className="min-h-screen bg-white dark:bg-gray-900 pt-24">
      <div className="container mx-auto px-6 py-12">
        <motion.h1 {...fadeInUp(0)} className="text-5xl font-bold text-center text-gray-900 dark:text-white mb-6">
          About DB Toolkit
        </motion.h1>
        <motion.p {...fadeInUp(0.2)} className="text-xl text-center text-gray-600 dark:text-gray-300 mb-16 max-w-3xl mx-auto">
          A modern, cross-platform database management application built with passion and precision.
        </motion.p>

        <motion.div {...staggerContainer} className="grid md:grid-cols-2 gap-12 mb-20">
          <motion.div {...fadeInUp(0.3)} className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 hover:shadow-2xl hover:scale-105 transition-all duration-300">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Our Mission</h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              To provide developers and database administrators with a powerful, intuitive, and free tool 
              that simplifies database management across multiple platforms and database systems.
            </p>
          </motion.div>
          <motion.div {...fadeInUp(0.4)} className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 hover:shadow-2xl hover:scale-105 transition-all duration-300">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Our Vision</h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              To become the go-to database management tool for developers worldwide, making database 
              operations accessible, efficient, and enjoyable for everyone.
            </p>
          </motion.div>
        </motion.div>

        <motion.div {...staggerContainer} className="grid md:grid-cols-4 gap-8 mb-20">
          <motion.div {...fadeInUp(0.5)} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 text-center hover:shadow-xl hover:scale-105 transition-all duration-300">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                <Database className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Multi-Database</h3>
            <p className="text-gray-600 dark:text-gray-300">Support for PostgreSQL, MySQL, SQLite, MongoDB</p>
          </motion.div>
          <motion.div {...fadeInUp(0.6)} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 text-center hover:shadow-xl hover:scale-105 transition-all duration-300">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-green-100 dark:bg-green-900/20 rounded-full">
                <Users className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Open Source</h3>
            <p className="text-gray-600 dark:text-gray-300">Free and open for everyone to use and contribute</p>
          </motion.div>
          <motion.div {...fadeInUp(0.7)} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 text-center hover:shadow-xl hover:scale-105 transition-all duration-300">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                <Target className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Cross-Platform</h3>
            <p className="text-gray-600 dark:text-gray-300">Available on macOS, Windows, and Linux</p>
          </motion.div>
          <motion.div {...fadeInUp(0.8)} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 text-center hover:shadow-xl hover:scale-105 transition-all duration-300">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-yellow-100 dark:bg-yellow-900/20 rounded-full">
                <Sparkles className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Feature Packed</h3>
            <p className="text-gray-600 dark:text-gray-300">Query editor, backups, data explorer and editing, real-time analytics</p>
          </motion.div>
        </motion.div>

        <motion.div {...fadeInUp(0.9)} className="bg-gradient-to-r from-cyan-50 to-teal-50 dark:from-gray-800 dark:to-gray-800 rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Join Our Community
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
            DB Toolkit is open source and welcomes contributions from developers around the world.
          </p>
          <a
            href="https://github.com/db-toolkit/db-toolkit"
            className="inline-block px-8 py-3 bg-gradient-to-r from-cyan-600 to-teal-600 text-white rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-300 font-semibold"
          >
            Contribute on GitHub
          </a>
        </motion.div>
      </div>
      <Footer />
    </main>
  );
}

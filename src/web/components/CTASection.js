'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, ArrowRight } from 'lucide-react';
import { fadeInUp } from '@/utils/motion';
import { detectPlatform, getDownloadUrl } from '@/utils/detectPlatform';

export default function CTASection() {
  const [downloadUrl, setDownloadUrl] = useState('/downloads');

  useEffect(() => {
    const platform = detectPlatform();
    if (platform) {
      setDownloadUrl(getDownloadUrl(platform));
    }
  }, []);

  return (
    <section className="relative py-8 bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 overflow-hidden">
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
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-full motion-reduce:hidden"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, Math.random() * 15 - 7.5, 0],
              opacity: [0.3, 0.7, 0.3],
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>
      <div className="relative container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center"
        >
          <motion.h2
            variants={fadeInUp(0)}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3"
          >
            Ready to Get Started?
          </motion.h2>
          <motion.p
            variants={fadeInUp(0.1)}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="text-lg text-gray-600 dark:text-gray-300 mb-6"
          >
            Download DB Toolkit now and simplify your database workflow
          </motion.p>

          <motion.div
            variants={fadeInUp(0.2)}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
          >
            <a
              href={downloadUrl}
              className="group flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-600 to-teal-600 text-white rounded-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 font-semibold"
            >
              <Download size={20} />
              Download Now
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="/downloads"
              className="flex items-center gap-2 px-8 py-4 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-lg hover:scale-105 transition-all duration-300 font-semibold"
            >
              View All Platforms
            </a>
          </motion.div>


        </motion.div>
      </div>
    </section>
  );
}

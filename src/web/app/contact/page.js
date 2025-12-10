'use client';

import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { Mail, Github, MessageSquare } from 'lucide-react';
import { fadeInUp, staggerContainer } from '@/utils/motion';
import Footer from '@/components/Footer';

const ContactForm = dynamic(() => import('@/components/ContactForm'), { 
  loading: () => <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-96 rounded-lg"></div>,
  ssr: false 
});

export default function Contact() {
  return (
    <main className="min-h-screen bg-white dark:bg-gray-900 pt-24">
      <div className="container mx-auto px-6 py-12">
        <motion.h1 {...fadeInUp(0)} className="text-5xl font-bold text-center text-gray-900 dark:text-white mb-6">
          Get in Touch
        </motion.h1>
        <motion.p {...fadeInUp(0.2)} className="text-xl text-center text-gray-600 dark:text-gray-300 mb-16 max-w-2xl mx-auto">
          Have questions or feedback? We'd love to hear from you.
        </motion.p>

        <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
          <motion.div {...fadeInUp(0.3)}>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Contact Information
            </h2>
            
            <motion.div {...staggerContainer} className="space-y-4">
              <motion.div {...fadeInUp(0.4)} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 flex items-start gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Email</h3>
                  <a href="mailto:adelodunpeter24@gmail.com" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
                    adelodunpeter24@gmail.com
                  </a>
                </div>
              </motion.div>

              <motion.div {...fadeInUp(0.5)} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 flex items-start gap-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <Github className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">GitHub</h3>
                  <a href="https://github.com/db-toolkit/db-toolkit" target="_blank" rel="noopener noreferrer" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
                    github.com/db-toolkit/db-toolkit
                  </a>
                </div>
              </motion.div>

              <motion.div {...fadeInUp(0.6)} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 flex items-start gap-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <MessageSquare className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Issues & Support</h3>
                  <a href="https://github.com/db-toolkit/db-toolkit/issues" target="_blank" rel="noopener noreferrer" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
                    Report an issue on GitHub
                  </a>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>

          <motion.div {...fadeInUp(0.4)} className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Send a Message
            </h2>
            <ContactForm />
          </motion.div>
        </div>
      </div>
      <Footer />
    </main>
  );
}

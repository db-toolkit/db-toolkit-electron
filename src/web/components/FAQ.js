'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: 'What databases does DB Toolkit support?',
      answer: 'DB Toolkit supports PostgreSQL, MySQL, SQLite, and MongoDB. You can manage multiple database connections simultaneously.'
    },
    {
      question: 'Is DB Toolkit free to use?',
      answer: 'Yes, DB Toolkit is completely free and open-source under the MIT license.'
    },
    {
      question: 'What platforms are supported?',
      answer: 'DB Toolkit is available for macOS (Intel & Apple Silicon), Windows (64-bit & 32-bit), and Linux (AppImage & DEB).'
    },
    {
      question: 'Can I backup my databases?',
      answer: 'Yes, DB Toolkit includes automated backup scheduling with retention policies, multiple backup types, and manual backup options.'
    },
    {
      question: 'Can I export query results?',
      answer: 'Yes, you can export query results and table data to CSV and JSON formats with one click.'
    },
    {
      question: 'Does it work offline?',
      answer: 'Yes, DB Toolkit is a desktop application that works completely offline. No internet connection required.'
    },
    {
      question: 'Is my data secure?',
      answer: 'Yes, your data is stored locally on your computer. DB Toolkit uses parameterized queries to prevent SQL injection.'
    }
  ];

  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-800">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl font-bold text-center text-gray-900 dark:text-white mb-12">
          Frequently Asked Questions
        </h2>
        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                <span className="font-semibold text-gray-900 dark:text-white">{faq.question}</span>
                <ChevronDown
                  className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="px-6 pb-6 text-gray-600 dark:text-gray-300">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

'use client';

import { motion } from 'framer-motion';
import { Database, Zap, Shield, Code, Lock, Layers } from 'lucide-react';
import { fadeInUp, staggerContainer } from '@/utils/motion';

export default function Features() {
  const features = [
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Optimized query execution with Monaco editor and intelligent autocomplete',
      color: 'blue'
    },
    {
      icon: Database,
      title: 'Multi-Database',
      description: 'PostgreSQL, MySQL, SQLite, and MongoDB support in one unified interface',
      color: 'green'
    },
    {
      icon: Shield,
      title: 'Secure by Design',
      description: 'Encrypted credentials and parameterized queries for maximum security',
      color: 'purple'
    },
    {
      icon: Code,
      title: 'Developer Friendly',
      description: 'Syntax highlighting, code completion, and query formatting built-in',
      color: 'orange'
    },
    {
      icon: Lock,
      title: 'Data Protection',
      description: 'Automated backups with scheduling and retention policies',
      color: 'red'
    },
    {
      icon: Layers,
      title: 'Migration Ready',
      description: 'Built-in database migration tools with real-time output streaming',
      color: 'indigo'
    }
  ];

  const colorClasses = {
    blue: 'from-blue-500 to-cyan-500',
    green: 'from-green-500 to-emerald-500',
    purple: 'from-purple-500 to-pink-500',
    orange: 'from-orange-500 to-yellow-500',
    red: 'from-red-500 to-rose-500',
    indigo: 'from-indigo-500 to-blue-500'
  };

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

        <motion.div {...staggerContainer} className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              {...fadeInUp(0.2 + index * 0.1)}
              whileHover={{ scale: 1.05, y: -5 }}
              className="group relative bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-300"
                   style={{ backgroundImage: `linear-gradient(to bottom right, var(--tw-gradient-stops))` }}
              />
              <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${colorClasses[feature.color]} mb-6`}>
                <feature.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

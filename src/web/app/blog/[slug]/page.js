import { Calendar, Clock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export function generateStaticParams() {
  return [
    { slug: 'getting-started' },
    { slug: 'database-migrations' },
    { slug: 'backup-strategies' }
  ];
}

export default function BlogPost({ params }) {
  const post = {
    title: 'Getting Started with DB Toolkit',
    date: 'January 19, 2025',
    readTime: '5 min read',
    content: `
      <h2>Introduction</h2>
      <p>DB Toolkit is a modern database management application that makes working with databases simple and efficient.</p>
      
      <h2>Installation</h2>
      <p>Download the latest version for your platform from our releases page.</p>
      
      <h2>First Steps</h2>
      <p>After installation, create your first database connection and start exploring your data.</p>
    `
  };

  return (
    <main className="min-h-screen bg-white dark:bg-gray-900 pt-24">
      <article className="container mx-auto px-6 max-w-4xl py-12">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline mb-8"
        >
          <ArrowLeft size={20} />
          Back to Blog
        </Link>
        
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
          {post.title}
        </h1>
        
        <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400 mb-8">
          <span className="flex items-center gap-1">
            <Calendar size={16} />
            {post.date}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={16} />
            {post.readTime}
          </span>
        </div>
        
        <div
          className="prose prose-lg dark:prose-invert max-w-none text-gray-700 dark:text-gray-300"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>
    </main>
  );
}

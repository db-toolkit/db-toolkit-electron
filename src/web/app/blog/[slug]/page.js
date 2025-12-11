import { Calendar, Clock, ArrowLeft, User } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { getPostBySlug, getAllPostSlugs } from '@/utils/blog';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export function generateStaticParams() {
  return getAllPostSlugs();
}

export default function BlogPost({ params }) {
  const post = getPostBySlug(params.slug);

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 pt-24">
      <article className="container mx-auto px-6 max-w-4xl py-12">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 px-4 py-2 text-cyan-600 dark:text-teal-400 hover:bg-cyan-50 dark:hover:bg-gray-800 rounded-lg transition-all hover:scale-105 mb-8 font-medium"
        >
          <ArrowLeft size={20} />
          Back to Blog
        </Link>
        
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {post.image && (
            <div className="relative w-full h-auto">
              <Image
                src={post.image}
                alt={post.title}
                width={1200}
                height={630}
                className="w-full h-auto"
                priority
              />
            </div>
          )}
          
          <div className={`${inter.className} p-8 md:p-12`}>
            {post.tags && (
              <div className="flex flex-wrap gap-2 mb-4">
                {post.tags.map((tag) => (
                  <span key={tag} className="px-3 py-1 text-sm font-medium bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              {post.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-6 text-gray-500 dark:text-gray-400 mb-8 pb-8 border-b border-gray-200 dark:border-gray-700">
              {post.author && (
                <span className="flex items-center gap-2">
                  <User size={18} />
                  {post.author}
                </span>
              )}
              <span className="flex items-center gap-2">
                <Calendar size={18} />
                {new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
              <span className="flex items-center gap-2">
                <Clock size={18} />
                {post.readingTime}
              </span>
            </div>
            
            <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-4 prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-3 prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:leading-relaxed prose-a:text-cyan-600 dark:prose-a:text-teal-400 prose-a:no-underline hover:prose-a:underline prose-a:font-medium prose-strong:text-gray-900 dark:prose-strong:text-white prose-code:text-cyan-600 dark:prose-code:text-teal-400 prose-code:bg-gray-100 dark:prose-code:bg-gray-900 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-900 dark:prose-pre:bg-gray-950 prose-ul:my-6 prose-li:my-2">
              <MDXRemote source={post.content} />
            </div>
          </div>
        </div>
      </article>
    </main>
  );
}

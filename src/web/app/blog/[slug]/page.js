import { Calendar, Clock, ArrowLeft, User } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { getPostBySlug, getAllPostSlugs, getAllPosts } from '@/utils/blog';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { Inter } from 'next/font/google';
import BlogCard from '@/components/BlogCard';
import TableOfContents from '@/components/TableOfContents';
import AuthorBio from '@/components/AuthorBio';
import { generateTOC } from '@/utils/toc';

const inter = Inter({ subsets: ['latin'] });

const components = {
  img: (props) => (
    <figure className="my-8">
      <Image
        {...props}
        width={800}
        height={450}
        className="rounded-lg w-full h-auto"
        alt={props.alt || ''}
      />
      {props.alt && (
        <figcaption className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2 italic">
          {props.alt}
        </figcaption>
      )}
    </figure>
  ),
  h2: (props) => <h2 id={props.children?.toString().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')} {...props} />,
  h3: (props) => <h3 id={props.children?.toString().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')} {...props} />,
};

export function generateStaticParams() {
  return getAllPostSlugs();
}

export default function BlogPost({ params }) {
  const post = getPostBySlug(params.slug);
  const allPosts = getAllPosts();
  const toc = generateTOC(post.content);
  
  // Get related posts based on tags
  const relatedPosts = allPosts
    .filter(p => p.slug !== post.slug && p.tags?.some(tag => post.tags?.includes(tag)))
    .slice(0, 3);

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 pt-24">
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-7xl mx-auto flex gap-8">
          <article className="flex-1 max-w-4xl">
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
            
            <div className="flex flex-wrap items-center gap-6 text-gray-500 dark:text-gray-400 mb-4">
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
            </div>
            
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 rounded-lg mb-8">
              <Clock size={18} className="text-cyan-600 dark:text-teal-400" />
              <span className="font-semibold text-cyan-700 dark:text-cyan-300">{post.readingTime}</span>
            </div>
            
            <div className="border-b border-gray-200 dark:border-gray-700 mb-8" />
            
            <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-4 prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-3 prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:leading-relaxed prose-a:text-cyan-600 dark:prose-a:text-teal-400 prose-a:no-underline hover:prose-a:underline prose-a:font-medium prose-strong:text-gray-900 dark:prose-strong:text-white prose-code:text-cyan-600 dark:prose-code:text-teal-400 prose-code:bg-gray-100 dark:prose-code:bg-gray-900 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-900 dark:prose-pre:bg-gray-950 prose-ul:my-6 prose-li:my-2 prose-img:rounded-lg">
              <MDXRemote source={post.content} components={components} />
            </div>
          </div>
        </div>
        
        {/* Author Bio */}
        {post.author && (
          <div className="mt-12">
            <AuthorBio authorName={post.author} />
          </div>
        )}
        
        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
              Related Articles
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {relatedPosts.map((relatedPost) => (
                <BlogCard key={relatedPost.slug} post={relatedPost} />
              ))}
            </div>
          </div>
        )}
      </article>
      
      {/* Table of Contents */}
      <aside className="w-64 flex-shrink-0">
        <TableOfContents headings={toc} />
      </aside>
    </div>
    </div>
    </main>
  );
}

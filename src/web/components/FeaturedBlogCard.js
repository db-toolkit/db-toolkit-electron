import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Clock, ArrowRight, Star } from 'lucide-react';

export default function FeaturedBlogCard({ post }) {
  return (
    <Link href={`/blog/${post.slug}`}>
      <article className="group bg-white dark:bg-gray-800 rounded-2xl border-2 border-cyan-200 dark:border-cyan-800 overflow-hidden hover:shadow-2xl hover:scale-[1.01] transition-all duration-300 flex flex-col md:flex-row">
        {post.image && (
          <div className="relative w-full md:w-1/2 h-80 overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 bg-cyan-600 text-white rounded-full text-sm font-semibold">
              <Star size={16} fill="currentColor" />
              Featured
            </div>
            <Image
              src={post.image}
              alt={post.title}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-300"
            />
          </div>
        )}
        <div className="p-8 flex-1 flex flex-col">
          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
            <span className="flex items-center gap-1">
              <Calendar size={16} />
              {new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={16} />
              {post.readingTime}
            </span>
          </div>
          {post.tags && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.map((tag) => (
                <span key={tag} className="px-3 py-1 text-xs font-medium bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 group-hover:text-cyan-600 dark:group-hover:text-teal-400 transition-colors">
            {post.title}
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6 line-clamp-3 flex-1 text-lg">
            {post.excerpt}
          </p>
          <div className="flex items-center gap-2 text-cyan-600 dark:text-teal-400 font-semibold text-lg group-hover:gap-3 transition-all">
            Read Full Article
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </article>
    </Link>
  );
}

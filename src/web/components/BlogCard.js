import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Clock, ArrowRight } from 'lucide-react';

export default function BlogCard({ post }) {
  return (
    <Link href={`/blog/${post.slug}`}>
      <article className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 h-full flex flex-col">
        {post.image && (
          <div className="relative h-56 w-full overflow-hidden bg-gray-100 dark:bg-gray-700">
            <Image
              src={post.image}
              alt={post.title}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-300"
            />
          </div>
        )}
        <div className="p-5 flex-1 flex flex-col">
          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
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
            <div className="flex flex-wrap gap-2 mb-3">
              {post.tags.map((tag) => (
                <span key={tag} className="px-2 py-1 text-xs font-medium bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-cyan-600 dark:group-hover:text-teal-400 transition-colors line-clamp-2">
            {post.title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2 flex-1">
            {post.excerpt}
          </p>
          <div className="flex items-center gap-2 text-cyan-600 dark:text-teal-400 font-semibold group-hover:gap-3 transition-all">
            Read More
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </article>
    </Link>
  );
}

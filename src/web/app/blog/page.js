import BlogCard from '@/components/BlogCard';
import Footer from '@/components/Footer';
import { getAllPosts } from '@/utils/blog';
import { BookOpen, TrendingUp } from 'lucide-react';

export default function Blog() {
  const posts = getAllPosts();

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-cyan-600 to-teal-600 dark:from-cyan-900 dark:to-teal-900 pt-32 pb-20">
        <div className="container mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white mb-6">
            <BookOpen size={20} />
            <span className="font-medium">DB Toolkit Blog</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Learn, Build, and Optimize
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Tips, tutorials, and updates about database management, best practices, and DB Toolkit features
          </p>
        </div>
      </section>

      {/* Posts Section */}
      <section className="container mx-auto px-6 py-16">
        {posts.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-20">
            <p className="text-xl">No blog posts yet. Check back soon!</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-8">
              <TrendingUp className="text-cyan-600 dark:text-teal-400" size={24} />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Latest Articles
              </h2>
              <span className="ml-2 px-3 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded-full text-sm font-medium">
                {posts.length}
              </span>
            </div>
            <div className="space-y-6 max-w-5xl mx-auto">
              {posts.map((post) => (
                <BlogCard key={post.slug} post={post} />
              ))}
            </div>
          </>
        )}
      </section>
      
      <Footer />
    </main>
  );
}

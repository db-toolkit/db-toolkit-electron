import BlogCard from '@/components/BlogCard';
import FeaturedBlogCard from '@/components/FeaturedBlogCard';
import Footer from '@/components/Footer';
import { getAllPosts } from '@/utils/blog';

export default function Blog() {
  const posts = getAllPosts();
  const featuredPost = posts.find(post => post.featured);
  const regularPosts = posts.filter(post => !post.featured);

  return (
    <main className="min-h-screen bg-white dark:bg-gray-900 pt-24">
      {/* Hero Section */}
      <section className="container mx-auto px-6 pt-8 pb-12 text-center">
        <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
          Blog
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Tips and updates about DB Toolkit and database
        </p>
      </section>

      {/* Posts Section */}
      <section className="container mx-auto px-6 pb-16">
        {posts.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-20">
            <p className="text-xl">No blog posts yet. Check back soon!</p>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto">
            {/* Featured Post */}
            {featuredPost && (
              <div className="mb-12">
                <FeaturedBlogCard post={featuredPost} />
              </div>
            )}

            {/* Regular Posts */}
            {regularPosts.length > 0 && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {regularPosts.map((post) => (
                  <BlogCard key={post.slug} post={post} />
                ))}
              </div>
            )}
          </div>
        )}
      </section>
      
      <Footer />
    </main>
  );
}

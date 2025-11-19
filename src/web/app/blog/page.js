import BlogCard from '@/components/BlogCard';

export default function Blog() {
  const posts = [
    {
      slug: 'getting-started',
      title: 'Getting Started with DB Toolkit',
      excerpt: 'Learn how to install and set up DB Toolkit for your database management needs.',
      date: 'January 19, 2025',
      readTime: '5 min read'
    },
    {
      slug: 'database-migrations',
      title: 'Managing Database Migrations',
      excerpt: 'A comprehensive guide to using the migration features in DB Toolkit.',
      date: 'January 18, 2025',
      readTime: '8 min read'
    },
    {
      slug: 'backup-strategies',
      title: 'Effective Backup Strategies',
      excerpt: 'Best practices for backing up your databases with automated scheduling.',
      date: 'January 17, 2025',
      readTime: '6 min read'
    }
  ];

  return (
    <main className="min-h-screen bg-white dark:bg-gray-900 pt-24">
      <div className="container mx-auto px-6 py-12">
        <h1 className="text-5xl font-bold text-center text-gray-900 dark:text-white mb-6">
          Blog
        </h1>
        <p className="text-xl text-center text-gray-600 dark:text-gray-300 mb-16 max-w-2xl mx-auto">
          Tips, tutorials, and updates about DB Toolkit
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {posts.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
      </div>
    </main>
  );
}

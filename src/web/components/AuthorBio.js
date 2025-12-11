import Image from 'next/image';
import { Github, Twitter, Linkedin, Mail } from 'lucide-react';
import { getAuthorByName } from '@/utils/authors';

export default function AuthorBio({ authorName }) {
  const author = getAuthorByName(authorName);
  
  if (!author) return null;

  return (
    <div className="bg-gradient-to-r from-cyan-50 to-teal-50 dark:from-gray-800 dark:to-gray-800 rounded-2xl border border-cyan-200 dark:border-gray-700 p-8">
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="relative w-24 h-24 rounded-full overflow-hidden flex-shrink-0 border-4 border-white dark:border-gray-700 shadow-lg">
          <div className="w-full h-full bg-gradient-to-br from-cyan-600 to-teal-600 flex items-center justify-center text-white text-3xl font-bold">
            {author.name.charAt(0)}
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            About {author.name}
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
            {author.bio}
          </p>
          <div className="flex gap-4">
            {author.github && (
              <a
                href={author.github}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 dark:text-gray-400 hover:text-cyan-600 dark:hover:text-teal-400 transition-colors"
                aria-label="GitHub"
              >
                <Github size={20} />
              </a>
            )}
            {author.twitter && (
              <a
                href={author.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 dark:text-gray-400 hover:text-cyan-600 dark:hover:text-teal-400 transition-colors"
                aria-label="Twitter"
              >
                <Twitter size={20} />
              </a>
            )}
            {author.linkedin && (
              <a
                href={author.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 dark:text-gray-400 hover:text-cyan-600 dark:hover:text-teal-400 transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin size={20} />
              </a>
            )}
            {author.email && (
              <a
                href={`mailto:${author.email}`}
                className="text-gray-600 dark:text-gray-400 hover:text-cyan-600 dark:hover:text-teal-400 transition-colors"
                aria-label="Email"
              >
                <Mail size={20} />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

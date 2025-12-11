import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const authorsDirectory = path.join(process.cwd(), 'content/authors');

export function getAuthorByName(name) {
  if (!fs.existsSync(authorsDirectory)) {
    return null;
  }

  const slug = name.toLowerCase().replace(/\s+/g, '-');
  const fullPath = path.join(authorsDirectory, `${slug}.mdx`);
  
  if (!fs.existsSync(fullPath)) {
    return null;
  }

  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data } = matter(fileContents);

  return data;
}

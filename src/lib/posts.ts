import type { CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'posts'>;

export function getPostDate(post: Post): Date {
  const match = post.filePath?.match(/(?:^|\/)(\d{4}-\d{2}-\d{2})-/);
  if (!match) throw new Error(`Post filename must start with YYYY-MM-DD: ${post.filePath ?? post.id}`);
  return new Date(`${match[1]}T00:00:00Z`);
}

export function formatPostDate(post: Post, locale = 'en-US'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(getPostDate(post));
}

export function sortPosts(posts: Post[]): Post[] {
  return [...posts].sort((a, b) => getPostDate(b).getTime() - getPostDate(a).getTime());
}

export function getPostUrl(post: Post): string {
  return `/posts/${post.id}/`;
}

export function slugify(value: string): string {
  return value.normalize('NFKD').toLowerCase().trim()
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-|-$/g, '');
}

export function getTerms(posts: Post[], field: 'categories' | 'tags') {
  const counts = new Map<string, number>();
  for (const post of posts) {
    for (const term of post.data[field]) counts.set(term, (counts.get(term) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count, slug: slugify(name) }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getExcerpt(post: Post): string {
  return (post.body ?? '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`~\\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 180);
}

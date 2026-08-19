import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';
import { site } from '../config';
import { getExcerpt, getPostDate, getPostUrl, sortPosts } from '../lib/posts';

export const GET: APIRoute = async (context) => {
  const posts = sortPosts(await getCollection('posts'));
  return rss({
    title: site.title,
    description: site.description,
    site: context.site!,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: getPostDate(post),
      description: getExcerpt(post),
      link: getPostUrl(post),
      categories: [...post.data.categories, ...post.data.tags],
    })),
    customData: '<language>en-us</language>',
  });
};

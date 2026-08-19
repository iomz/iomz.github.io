import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

const root = decodeURIComponent(new URL('..', import.meta.url).pathname);
const dist = join(root, 'dist');
const postsDir = join(root, 'src/content/posts');

function assertFile(path) {
  if (!existsSync(path)) throw new Error(`Missing build output: ${relative(root, path)}`);
}

const postSlugs = readdirSync(postsDir)
  .filter((name) => name.endsWith('.md'))
  .map((name) => name.replace(/\.md$/, '').replace(/^\d{4}-\d{2}-\d{2}-/, ''));

for (const path of [
  'index.html', 'about/index.html', '404.html', 'categories/index.html', 'tags/index.html',
  'feed.xml', 'robots.txt', 'sitemap-index.xml',
  ...postSlugs.map((slug) => `posts/${slug}/index.html`),
]) assertFile(join(dist, path));

function walk(directory) {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const broken = [];
const malformed = [];
for (const htmlPath of walk(dist).filter((path) => path.endsWith('.html'))) {
  const html = readFileSync(htmlPath, 'utf8');
  const references = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map((match) => match[1]);

  if (/\]\(https?:\/\//i.test(html)) {
    malformed.push(`${relative(dist, htmlPath)} contains unparsed Markdown link syntax`);
  }

  for (const reference of references) {
    if (/^https?:\/\/.*https?:\/\//i.test(reference)) {
      malformed.push(`${relative(dist, htmlPath)} -> ${reference}`);
      continue;
    }
    if (/^(?:[a-z]+:|\/\/|#)/i.test(reference)) continue;
    const clean = decodeURIComponent(reference.split(/[?#]/, 1)[0]);
    const target = clean.startsWith('/') ? join(dist, clean) : join(dirname(htmlPath), clean);
    const candidates = clean.endsWith('/') ? [join(target, 'index.html')] : [target, `${target}.html`, join(target, 'index.html')];
    if (!candidates.some(existsSync)) broken.push(`${relative(dist, htmlPath)} -> ${reference}`);
  }
}

if (malformed.length) throw new Error(`Malformed links:\n${malformed.join('\n')}`);
if (broken.length) throw new Error(`Broken internal links:\n${broken.join('\n')}`);
console.log(`Verified ${postSlugs.length} posts and internal links across generated HTML.`);

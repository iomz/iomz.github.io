# iomz.github.io

Personal static site built with Astro, TypeScript, Markdown, and plain CSS.

## Requirements

- Node.js 24 (Astro requires Node.js 22.12 or newer)
- npm

## Local development

```bash
npm install
npm run dev
```

Astro serves the site at `http://localhost:4321` by default.

## Production build

```bash
npm run build
npm run preview
```

Build writes static files to `dist/`.
Build command also runs Astro type/content checks and verifies expected routes plus internal links.

## Content

Posts live in `src/content/posts/` and authored pages live in `src/content/pages/`.
Both use Astro Content Layer API configured in `src/content.config.ts`.

Create post named `YYYY-MM-DD-slug.md` with this frontmatter:

```yaml
---
title: "Post title"
categories:
  - Category
tags:
  - Tag
locale: "en-US"
---
```

Post dates and route slugs come from filenames.
For example, `2026-08-19-example.md` builds as `/posts/example/`.

## Deployment

Pushes to `main` run `.github/workflows/deploy.yml`.
Official Astro and GitHub Pages actions install dependencies, build static site, upload `dist/`, and deploy it to `https://iomz.github.io`.

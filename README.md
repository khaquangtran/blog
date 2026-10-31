# Kha Engineering Notes

A personal engineering journal built with React, React Router, and Vite.

## Getting started

```sh
pnpm install
pnpm dev
```

## Commands

```sh
pnpm build
pnpm format
pnpm format:check
```

## Project layout

- `src/app/` — application shell, theme state, and routes
- `src/components/` — reusable navigation, cards, illustrations, and UI
- `src/data/` — article metadata, Markdown loading, and cheatsheet content
- `src/content/articles/` — long-form article bodies in Markdown
- `src/pages/` — route-level pages; all essays share one article renderer
- `src/styles/global.css` — Tailwind theme tokens, base styles, and composed component utilities
- `public/` — static assets copied into the production build

Each Markdown article in `src/content/articles/` starts with frontmatter for its title, description, publication date, category, reading time, author, keywords, and optional cover image metadata. Article assets live in `public/assets/<article-slug>/`; Markdown image paths use the public URL (for example, `![alt text](/assets/shopify-reservations/diagram.svg "Caption")`). The shared article page loads the cover from Markdown metadata, and the article renderer supports inline Markdown images, code blocks, callouts, and reusable diagrams. Page titles, descriptions, canonical URLs, social previews, and structured data are managed in `src/components/Seo.jsx`.

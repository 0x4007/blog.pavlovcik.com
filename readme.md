# Alex's Blog

The source for [blog.pavlovcik.com](https://blog.pavlovcik.com), rendered from a public Notion page with Next.js and `react-notion-x`.

## Content and routes

The configured Notion root is the source of truth. Its direct child pages receive clean, title-derived paths such as `/upcoming-events` and `/past-events`. Deeper pages keep their Notion ID in the path so similarly named event pages remain unambiguous.

Routes are discovered from the Notion hierarchy at runtime and build time. Do not add a manual path-to-page registry. The RSS feed and sitemap discover nested event pages separately, limit concurrent Notion requests, and skip an inaccessible child without taking down the site.

## Development

Requirements:

- Node.js 24
- pnpm 9.12.2

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Open `http://localhost:3000`.

## Verification

```bash
pnpm test
pnpm build
```

`pnpm test` runs formatting, lint, TypeScript, and routing/content regression tests. The production build also performs the bounded Notion route crawl used by Vercel.

## Deployment

Vercel deploys the project from this repository. The custom domain is proxied through Cloudflare, which must use Full (strict) SSL so Cloudflare connects to Vercel over HTTPS.

Site metadata and the Notion root/workspace IDs live in [`site.config.ts`](./site.config.ts).

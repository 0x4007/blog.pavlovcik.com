# Contributing

Use Node.js 24 and pnpm 9.12.2.

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Before opening a pull request, run:

```bash
pnpm test
pnpm build
```

Keep Notion routing structural: direct children of the configured root get clean slugs, while deeper pages retain their Notion ID. Do not add manual route overrides or broaden the normal build crawl beyond depth one.

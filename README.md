# gym-week

[https://gym-week.jakeforaker83.workers.dev](https://gym-week.jakeforaker83.workers.dev)

A Cloudflare Worker that serves a single page and a small `/api` backed by the
`GYM` KV namespace.

## Setup

Requires Node and Yarn 4 (via Corepack, pinned in `package.json`).

```sh
yarn install
```

## Commands

```sh
yarn helper   # local runbook and setup status
yarn dev      # build, then serve at http://localhost:8787 (rebuilds on src/ changes)
yarn build    # inline src/page/* into the Worker → dist/index.js
yarn deploy   # build and deploy to Cloudflare
```

`yarn dev` uses a local copy of the KV namespace (stored in `.wrangler/`), not
production data.

## Layout

- `src/index.js`: the Worker. Serves the page and handles `GET`/`POST /api`.
- `src/page/`: the page (`index.html`, `style.css`, `app.js`).
- `build.mjs`: inlines the page's CSS and JS into one HTML string, drops it into
  the Worker at `__PAGE_HTML__`, and writes `dist/index.js`. Wrangler runs it
  automatically before `dev` and `deploy`.

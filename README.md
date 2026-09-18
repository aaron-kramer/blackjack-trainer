# 21 Trainer

A mobile-first, Duolingo-style app for learning perfect blackjack basic
strategy. No frameworks, no build step — plain HTML/CSS/JS that runs
straight from a static file server (or `file://`).

## Concept

- **Skill-tree lesson path** across 6 units (Hit/Stand → Doubling → Soft
  Hands → Splitting Pairs → Surrender → Full Practice), 22 lessons total.
  Lessons unlock one at a time as you complete the previous one.
- **Duolingo-style mechanics**: 5 hearts per lesson, instant right/wrong
  feedback with a one-line explanation, XP per correct answer (+bonus for a
  perfect lesson), a daily streak counter, and a locked/current/completed
  node path.
- **Full basic strategy reference chart**, color-coded, always available from
  the bottom nav.
- **Progress is local**: everything is stored in `localStorage`, nothing
  leaves the browser.

## Strategy rules assumed

The chart is standard multi-deck basic strategy for these common rules:

- 4–8 decks
- Dealer stands on soft 17 (S17)
- Double after split allowed (DAS)
- Late surrender allowed
- No re-splitting aces

This is the same baseline chart taught by most casino strategy cards; it's
not tuned for a specific casino's exact ruleset.

## Running it

No build step needed. The site itself lives in `docs/` (so it can be served
as-is by GitHub Pages or any static host).

```bash
npm start        # serves docs/ at http://localhost:8080
# or just open docs/index.html directly in a browser
```

## Running the smoke test

A jsdom-based test drives the whole app (path → lesson → correct/incorrect
answers → hearts depleting → lesson complete/failed → unlocking → chart →
stats → reset) and checks it never throws.

```bash
npm install   # installs jsdom (dev-only dependency)
npm test
```

## Project structure

```
docs/index.html          Single-page shell: path / lesson / complete / failed / chart / stats views
docs/css/styles.css      Mobile-first styling
docs/js/strategy.js      Basic strategy tables + hand-generation engine
docs/js/lessons.js       Lesson/unit definitions built on top of strategy.js
docs/js/storage.js       localStorage-backed progress, streak, XP
docs/js/app.js           App controller: rendering + all view logic
scripts/smoke-test.js    jsdom end-to-end smoke test
wrangler.jsonc           Cloudflare Workers static-assets config (serves docs/)
```

Everything the site needs lives under `docs/`, kept separate from
`node_modules`/tooling at the repo root — that split matters for static
hosts (like Cloudflare Workers assets) that upload a whole directory: it
keeps dev dependencies out of what gets deployed.

## Deployment

- **GitHub Pages**: configured to serve from the `main` branch, `/docs` path.
- **Cloudflare Workers (static assets)**: `wrangler.jsonc` points
  `assets.directory` at `docs/`, so `npx wrangler deploy` only uploads the
  site files, not `node_modules` or tooling.

## Disclaimer

For education and entertainment only. This is a strategy trainer, not a
real-money gambling product, and does not guarantee outcomes at any casino.

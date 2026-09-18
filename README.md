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

No build step needed.

```bash
npm start        # serves the folder at http://localhost:8080
# or just open index.html directly in a browser
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
index.html          Single-page shell: path / lesson / complete / failed / chart / stats views
css/styles.css       Mobile-first styling
js/strategy.js       Basic strategy tables + hand-generation engine
js/lessons.js        Lesson/unit definitions built on top of strategy.js
js/storage.js        localStorage-backed progress, streak, XP
js/app.js            App controller: rendering + all view logic
scripts/smoke-test.js  jsdom end-to-end smoke test
```

## Disclaimer

For education and entertainment only. This is a strategy trainer, not a
real-money gambling product, and does not guarantee outcomes at any casino.

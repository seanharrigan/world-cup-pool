# World Cup Pool

A browser-based fantasy football pool for the 2026 FIFA World Cup. Players pick a squad of 8 teams within a points budget, and score points based on real match results throughout the tournament.

## Tech stack

- Vanilla HTML/CSS/JS — no framework, no build step
- Tailwind CSS (CDN, utility classes throughout)
- Supabase for auth (Google OAuth), database, and realtime subscriptions
- Node.js built-in test runner (`node --test`) for unit tests

## Project structure

| File | Purpose |
|------|---------|
| `index.html` | Single-page app, all views in one file |
| `js/data.js` | Supabase client, `teams` array, global state (`myPicks`, `appSettings`, lock state) |
| `js/app.js` | Auth flow, profile, picks save/load, notifications, blocked user enforcement |
| `js/features.js` | UI feature logic — leaderboard, team results table, country banners |
| `js/ui.js` | DOM rendering helpers |
| `js/scoring.js` | Pure scoring logic — dual export (browser `window.WorldCupScoring` + Node `module.exports`) |
| `tests/scoring.test.mjs` | Unit tests covering scoring, leaderboard, and best-available-team logic |

## Pool rules

- Squad size: exactly **8 teams**
- Budget: max **150 points**
- Max **1 Tier 1** team per squad
- Min **3 Tier 3** teams per squad
- Picks lock at tournament kickoff: `2026-06-11T12:00:00`

## Scoring

| Result | Points |
|--------|--------|
| Win | 3 × stage multiplier |
| Draw | 1 × stage multiplier |
| Loss | 0 |

Stage multipliers: Group ×1, R32 ×2, R16 ×3, QF ×5, Semi ×8, Final ×12

Advancing to the knockout round also awards **+1 bonus point**.

## Database tables (Supabase)

`picks`, `profiles`, `admins`, `app_settings`, `team_advancement`, `notifications`, `matches`

## Running tests

```bash
npm test
# or
node --test tests/scoring.test.mjs
```

Tests only cover `scoring.js` — it is the only module written to run in Node. All other JS targets the browser.

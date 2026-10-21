# Development log

One entry per phase: what I asked Claude, what it did, what broke, and what we changed and why. This file is the basis for the half-page delivery notes.

---

## Planning — 2026-10-21

**What I asked**

- Read the brief, restate it, and list doubts and assumptions.
- Ask me clarifying questions.
- Research the stack and the risky platform topics against current official docs.
- Draft `docs/PLAN.md`. No code until the plan was agreed.

**What Claude did**

- Summarised the brief. Flagged that the client accepts **one** set of questions. Reviewed my understanding of the three modes; it suggested generalising EMOM alternation to an N-exercise cycle.
- Ran three parallel research tasks with dated sources:
  1. **Mobile web platform:** iOS 27 / Safari 27, fullscreen, Wake Lock, Web Audio, the Silent switch, Bluetooth.
  2. **Google sign-in restricted to a domain:** the `hd` claim, OAuth "In production", and Vercel Preview URLs.
  3. **Stack versions and free tiers.**
- Wrote the plan: stack, architecture, risks, 9 phases with acceptance criteria.

**Key findings that shaped the plan**

- **iPhone still has no element fullscreen.** The Home Screen web app is the way; since iOS 26 every site added to the Home Screen opens as a web app.
- **A scanned QR opens Safari, not the installed app.** So the short code is required, not optional. The share page recommends a method per phone: iPhone → install + type the code; Android → scan the QR.
- **Web Audio is muted by the iOS Silent switch** unless `navigator.audioSession.type = "playback"` (iOS 17+).
- **Chrome stops the audio output after 30 s of pure silence, and Bluetooth speakers fall asleep.** We add a near-inaudible keep-alive tone.
- **A domain check on the email alone is unsafe.** Google says to check the `hd` claim.
- **Google forbids wildcard redirect URIs, and every Vercel preview has a different URL.** So we use a stable branch URL for previews.
- **Auth.js is now maintained by the Better Auth team**, which recommends Better Auth for new projects.

**Decisions**

- No email to the client for now.
- **Presets:** per coach, plus a "Box library" where any coach can duplicate a colleague's preset.
- **UI language:** Spanish by default, plus English and Catalan.
- **Phone screen:** hidden controls with confirmation to stop.
- **My personal email:** allowed only in Development and Preview, never in Production. The code also ignores the allowlist in Production.
- **EMOM screen:** the seconds left in the interval are the biggest element.

---

## Phase 0 — Foundations — 2026-10-21

**What I asked**

- Set up the project base: git, the agreed plan, the Next.js scaffold, tooling, i18n from day one, `CLAUDE.md`, DEVLOG and README.

**What Claude did**

- `git init` and committed the plan first.
- Scaffolded with `create-next-app@16.4.2`: TypeScript, App Router, `src/`, Tailwind, ESLint, Cache Components. Removed the template assets.
- **Pinned the toolchain:** pnpm 12.14, Node 24.x, TypeScript 6.0, React 19.3.1.
- **Added tooling:** Prettier with the Tailwind plugin, Vitest with coverage, Playwright with iPhone 17 / Pixel 10 profiles in portrait and landscape.
- **Integrated next-intl:**
  - URLs: `/` = Spanish, `/en`, `/ca`;
  - `proxy.ts` middleware;
  - typed messages;
  - a language switcher;
  - e2e smoke tests (20 passing across 5 device profiles).
- Wrote `CLAUDE.md`, this DEVLOG and the README skeleton.

**What broke and what we changed**

1. **pnpm 11 could not auto-switch to pnpm 12 on Windows.** The `packageManager` self-download failed with a path error. → Upgraded the global pnpm to 12.14.0 with npm.
2. **ESLint 10 installed fine, but three plugins** used by `eslint-config-next` (`react`, `jsx-a11y`, `import`) don't declare support for it. → Pinned **ESLint 9.39.5**, the latest 9.x and what the official template uses. Revisit when the plugins support ESLint 10.
3. **`tsc` failed with `Cannot find name 'LayoutProps'`.** Next 16 generates route types globally. → The `typecheck` script now runs `next typegen` first, as the Next.js CLI docs recommend.
4. **pnpm 12 refused to run the install scripts** of `@swc/core` and `@parcel/watcher` (pulled in by next-intl). → Disabled them explicitly in `allowBuilds`, because prebuilt binaries are enough.
5. **next-intl's typed messages needed `allowArbitraryExtensions`.** After adding it, `next build` still reported the old error while `tsc` passed. Cause: a stale incremental cache in `.next/cache/.tsbuildinfo`. → Deleting `.next/` fixed it. Documented in `CLAUDE.md`.
6. **The e2e tests found that `/` redirected to `/en`.** next-intl detects the browser language, and Playwright's browsers are in English. → Set `localeDetection: false`, because the agreed behaviour is "Spanish by default, other languages on demand".

**Checks:** `pnpm lint`, `typecheck`, `format:check`, `test` (no unit tests yet), `build`, and `test:e2e` (20/20) all pass.

---

## Phase 1 — Timer engine — 2026-10-21

**What I asked**

- Build the timer logic as pure TypeScript, with no UI, and test it thoroughly.

**What Claude did**

- **`src/lib/timer/schema.ts`.** Zod 4.6 schemas for the three modes, with shared limits:
  - prep: 0/5/10/15/20 s, default 10;
  - work: 1–60 min;
  - EMOM interval: 10 s – 10 min in 5 s steps; 1–60 rounds;
  - up to 12 EMOM stations that cycle.
- **`timeline.ts`.** Expands a workout into **segments** (prep plus work blocks, one per EMOM interval) and **cues** at absolute milliseconds from the Start tap.
  - Cue types: `countdown` (3-2-1), `start` (long beep), `warning` (double beep) and `finish` (horn).
  - Warnings are kept strictly inside the work part and away from the final 3-2-1, and duplicates are merged. Example: in a 2-minute AMRAP, half time and "1 minute left" are the same instant.
- **`display.ts`.** `getDisplayState(timeline, elapsedMs)` returns everything the phone shows.
  - The big number: For Time counts up; AMRAP counts down; in EMOM it's the interval countdown.
  - Also: round, current and next station, time to the cap, progress.
  - Countdowns round **up**, so "3" appears exactly when the first beep sounds and "1" stays until the end.
- **`clock.ts`.** A persisted run state (start timestamp plus pause bookkeeping).
  - Elapsed time is always `now − start − paused`, never counted tick by tick.
  - A reload or a killed tab resumes at the right second.
- **`format.ts`.** `m:ss` / `mm:ss` formatting, with stable width.
- **74 unit tests.** Coverage: 100% lines and functions, 99% statements, 96% branches. Vitest now fails below 95%.

**What broke and what we changed**

1. **One test failed because Claude computed the expected value wrong, not because of an engine bug.** At 265 s into an EMOM there are 10 s of prep and 255 s of work, which is 15 s into round 5. So 45 s are left, not 5. → Fixed the expectation and wrote the arithmetic in a comment.
2. **Branch coverage came out at 94.6%, below the threshold.**
   - One uncovered branch guarded "work length 0", which the schema makes impossible. → Removed it, with a comment.
   - Two defensive branches remain, for impossible states. Branch coverage is now 96.3%.
3. **Plan change: the EMOM total length is capped at 60 minutes,** like the other modes. Otherwise 60 rounds × 10 min would allow a 10-hour EMOM.
4. **Enabled `noUncheckedIndexedAccess`** in `tsconfig.json`, so array lookups are typed as possibly `undefined`.

**Checks:** `pnpm check` and `pnpm test:coverage` pass.

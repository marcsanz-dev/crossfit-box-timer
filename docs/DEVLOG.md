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

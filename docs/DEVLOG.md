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

---

## Phase 2 — Phone timer (demo workouts) — 2026-10-21

**What I asked**

- Build the full-screen phone timer with a local demo workout and no backend.
- Scope: sound, wake lock, fullscreen, hidden controls with confirmation, resume after reload, and a layout for portrait and landscape.

**What Claude did**

- **Pure logic (unit-tested):**
  - `src/lib/audio/plan.ts`: a look-ahead cue planner. Every 200 ms it hands the audio clock the cues due in the next 1.5 s. Cues more than 300 ms late are skipped, never played late.
  - `sounds.ts`: synthesized cues, so there are no audio files:
    - short C6 pip for the 3-2-1;
    - long G6 beep for go and each new interval;
    - double E6 beep for warnings;
    - a 1.8 s major-chord horn for the end.
  - `src/lib/timer/session.ts`: the persisted run, validated with Zod and keyed by workout. It goes stale 30 min after the end.
  - `tone.ts`: the meaning of each colour (yellow = prep, green = first second of work, red = last 3 s and the end, grey = paused).
  - `format.ts`: the clock text. Bare seconds ("45") when they fit, because fewer characters mean bigger digits.
  - `demos.ts`: Fran (For Time), Cindy (AMRAP), an alternating EMOM, and a 1-minute quick test.
- **Browser adapters, in `src/browser/`** (exercised by e2e tests and real devices):
  - `CuePlayer` (Web Audio):
    - `audioSession.type = "playback"` on iOS, so beeps play in Silent mode;
    - a compressor for loudness;
    - output-latency compensation for Bluetooth;
    - a near-inaudible 40 Hz keep-alive tone, against Chrome's 30 s silent-sink switch and sleeping Bluetooth speakers.
  - `ScreenWakeLock`: re-acquired whenever the page becomes visible again.
  - Fullscreen on Android and desktop, plus iOS and standalone detection.
- **`useWorkoutRunner` hook:**
  - a repaint loop that only re-renders when a visible value changes;
  - the audio scheduler;
  - recovery after interruptions ("tap to turn the sound back on" while the clock keeps running);
  - pause, resume, restart and stop;
  - resume after a reload.
- **UI:**
  - **ready screen:** workout summary, a big Start button, a device checklist, and iPhone install / wake-lock warnings;
  - **running view:** sized with container query units, so it fills any phone in portrait or landscape;
  - **hidden controls:** they auto-hide after 5 s, and stop or restart need a native `<dialog>` confirmation;
  - **routes:** `/t/demo` and `/t/demo/[slug]`, in es / en / ca.
- **E2E tests:** 7 scenarios on 5 profiles (desktop, iPhone 17 and Pixel 10 in portrait and landscape), with Playwright's fake clock. They check that nothing overflows the viewport.

**What broke and what we changed**

1. **WebKit never started the timer.** Playwright's WebKit on Windows has no Web Audio, so `new AudioContext()` threw inside the Start handler and the run never began. → **Real robustness fix:** every unlock step (audio, wake lock, fullscreen) is best-effort, and the clock starts first. Without audio the "turn the sound back on" prompt appears and the timer still runs.
2. **The sound prompt covered the controls bar,** so a coach could not pause or stop while it was shown. → They are now stacked in one bottom container.
3. **Flaky e2e timings.**
   - `clock.install` lets real time flow too. → The clock is paused with `pauseAt` and advanced explicitly.
   - With a paused clock the last animation frame lands a few ms short. → Each advance adds 50 ms.
   - Running 10 minutes frame by frame timed out. → `fastForward` jumps instead.
4. **Two more test mistakes by Claude:**
   - the planner window end is exclusive, but the test expected a cue right on it;
   - in `getTone`, the AMRAP "first second" check was computed wrongly (caught while writing it, then moved to a pure, tested function).
5. **Typed messages rejected numbers in `{current}`.** → ICU `{current, number}` arguments.
6. **Design adjustments after looking at the screenshots:**
   - Geist Mono's slashed zero reads badly from a distance. → Geist with tabular digits; its digit width was measured at 0.636em to size the clock.
   - The wake-lock warning hid the header. → It now hides itself after 8 s.
   - The status line reserved empty space. → It only renders when there is a status to show.
   - The ready screen overflowed in landscape. → A `short:` variant (max-height 32rem) compacts it.

**Known limitations / to verify on real devices (Phase 3)**

- **The beeps have only been checked in desktop Chrome.** Their audibility from a few metres, the iPhone Silent switch, Bluetooth and the keep-alive tone need real phones.
- **In emulated WebKit the clock digits render in a thin weight,** apparently because variable font weights are missing on Playwright's Windows WebKit. Check on a real iPhone.
- **Portrait is width-limited:** the digits are much bigger in landscape, which is the usual rig mount.
- **Wake lock behaviour on battery saver** needs a 60-minute real test.

**Checks:** `pnpm check` (112 unit tests; coverage 99% statements, 98% branches) and `pnpm test:e2e` (55/55) pass.

---

## Phase 3 — First deploy + real-phone tests — 2026-10-22 (in progress)

**What I asked**

- Create the GitHub repository with `gh` (private for now, public at delivery) and push.
- Guide me through creating the Vercel project from my GitHub account.

**What Claude did**

- **Before pushing,** scanned the tracked files for secrets (none) and checked that the repo name was free.
- **Created `marcsanz-dev/crossfit-box-timer`** (private) with a description and topics, then pushed the 16 commits.
- **Checked Vercel's current docs before writing the steps:**
  - pnpm (package managers page, updated 2026-08-11): Vercel picks the pnpm version from the lockfile format. Ours (`lockfileVersion: '9.0'`) would be read by pnpm 9 or 10, not 12.
  - Corepack (build configuration page, updated 2026-08-28): the env var `ENABLE_EXPERIMENTAL_COREPACK=1` makes Vercel use the exact `packageManager` version (pnpm 12.14.0).
  - Node (Node.js versions page, updated 2026-02-27): `engines.node: "24.x"` selects Node 24, which is the default.
- **I created the Vercel project** (Hobby, GitHub app restricted to this repository, only that env var). The first deploy succeeded: **https://crossfit-box-timer.vercel.app**.
- **Verified production:**
  - every route returns 200 in its language, and an unknown demo returns 404;
  - pages are served prerendered from the CDN, and GitHub shows the Vercel status "Deployment has completed";
  - in the browser pane the demo runs over HTTPS with Web Audio, the session is stored, and the console is clean;
  - the pane denies the wake lock and the warning shows as designed. It still has to be confirmed on real phones.
- **Wrote `docs/REAL-DEVICE-TESTS.md`,** a checklist for the Android and iPhone runs: quick checks, the 60-minute run on battery, and the iPhone Home Screen install.

**What broke and what we changed**

- **Nothing broke on deploy.** The only risk found was the pnpm version, and it was handled with Corepack before the first build.

**Pending:** real-device results (see the checklist).

### Phase 3 — feedback from the first real-phone run (2026-10-22)

**What I reported** (screenshot of the AMRAP demo in landscape on my phone):

1. The exercises were cut with an ellipsis ("10 push-up…") although there was plenty of free space.
2. After tapping to show the hidden controls, a second tap anywhere should hide them at once, instead of waiting for the 5 s auto-hide.

**What Claude changed**

1. **Truncated exercises.**
   - Cause: a fixed `line-clamp-2` in landscape, while Cindy has three lines.
   - Now, in landscape, where width is plentiful and height scarce, the exercises are joined on one row with " · ". In portrait they stay one per line, with room for up to 6 lines.
   - Only an unusually long description is still clamped, so it can never shrink the clock.
2. **Tap to hide.** The full-screen tap target is now a toggle, with `aria-expanded` and a "Hide controls" label in es / en / ca. While paused or finished the controls stay visible, so Resume and Stop never disappear.
3. **New e2e tests,** on all 5 profiles:
   - the description is visible and not clipped;
   - a second tap hides the controls with no time passing.
   - The first versions of the tap test failed: the click landed on overlays that only appear in the test browsers (the sound prompt in WebKit without Web Audio, the wake-lock alert in headless Chromium). The test now taps a free area at 35% of the height, like a person would.

**Checks:** `pnpm check` (113 unit tests) and `pnpm test:e2e` (65/65) pass.

### Phase 3 — second real-phone report: screens taller than the phone (2026-10-23)

**What I reported** (OnePlus 10T, Chrome, screenshots):

- **Landscape:** with the controls open, the buttons were cut off at the bottom.
- **Portrait:** I had to scroll to see the progress bar, the exercises and the full buttons.
- I asked for a permanent rule: everything visible on the main screen, without ever scrolling, on any device.

**Cause** (found by Claude)

- The phone layout padded itself with the safe-area insets (the punch-hole camera, the gesture bar).
- Inside it, the timer was `h-dvh`, i.e. 100% of the viewport height.
- Height plus padding is taller than the screen, by exactly the inset. That pushed the header down and cut the bottom off.
- Emulated devices have no safe areas, so the existing overflow checks passed.

**What Claude did**

1. **Reproduced it first.**
   - New `e2e/fit-screen.spec.ts` emulates safe-area insets through CDP (`Emulation.setSafeAreaInsetsOverride`, Chromium only).
   - It checks every screen: ready, running, controls open, and the confirmation dialog.
   - It checks four demos: no scroll, and the timer, progress bar, Start button, checklist and every control button fully inside the viewport.
   - It failed on every Chromium profile, as on the real phone.
2. **Fixed it at the root.**
   - New `PhoneFrame`: fixed to the viewport edges, with the safe areas as inner padding and a size container inside.
   - Every timer screen now lives in it and sizes itself with `h-full` and container query units, never viewport units.
   - The ready screen, controls bar, sound prompt and dialog scale with the frame (`cqmin`, with sensible minimums). The ready screen keeps a 48px+ Start button.
   - Only coach-written text may clamp.
   - The progress bar got `role="progressbar"`: it is accessible, and the test can find it.
3. **The rule is now written down** in `CLAUDE.md` (working rule 9), `docs/PLAN.md` (R3 and §6) and Claude's memory, so every future phone UI must follow it and be added to the test.

**What else broke on the way**

- **On WebKit, the very first tap on "Empezar" was swallowed** after the redesign. React had not attached the click handler to the server-rendered button yet, so the tap did nothing and logged no error.
  - Found by checking the hit target, hydration and console step by step.
  - → The Start button is now **disabled until hydration**, so an early tap is never silently lost. That can matter on a slow phone too, not only in tests, and Playwright waits for it automatically.
- **The first version of the test tried to use CDP on WebKit,** which only Chromium supports. → It now uses the `browserName` fixture.

**Checks:** `pnpm check` (113 unit tests) and `pnpm test:e2e` (85/85, including 20 fit-the-screen runs) pass.

### Phase 3 — controls no longer cover the details in portrait (2026-10-23)

**What I asked**

- Confirmed on the OnePlus 10T that everything now fits.
- Asked that the Pause / Restart / Stop bar cover nothing when there is room:
  - **in portrait,** the timer, the exercises and the buttons all fit, but the buttons partly covered the exercises;
  - **in landscape,** nothing needed to change, because the timer has priority over the exercise list.

**What Claude did**

- **Portrait:** the sound prompt and the controls are now part of the layout, below the progress bar. When they appear the timer area gets shorter, but the clock is width-limited in portrait, so its size doesn't change.
- **Landscape:** they still float over the bottom details, so the clock keeps its size.
- **`e2e/fit-screen.spec.ts`:** in portrait, the controls must sit entirely below the timer, the last line of details and the progress bar.

**Checks:** `pnpm check` (113) and `pnpm test:e2e` (85/85) pass.

### Phase 3 — status

- **Done:** repository, Vercel production deploy, the fit-the-screen rule, and two rounds of real-phone fixes on the OnePlus 10T (Android Chrome: fullscreen works, digits are bold).
- **Moved on at my request:** the rest of `docs/REAL-DEVICE-TESTS.md` (sound at 3 m, the 60-minute run on battery, the iPhone checks) will be run in parallel with Phase 4. Its results will be logged here when they arrive.

---

## Phase 4 — Auth + DB — 2026-10-23

**What I asked**

- Move straight on to Phase 4 after the last controls fix.
- I created the Neon project (its default branch is called `production`, not `main`), the Google Cloud OAuth client (published "In production") and the Vercel environment variables, following Claude's steps.
- I asked for a clearer explanation of where each Vercel variable comes from.

**What Claude did**

- **Verified the current versions and APIs** on npm and in the installed type definitions (2026-10-23): Better Auth 1.7.12 with `@better-auth/drizzle-adapter`, Drizzle 0.45.4 / drizzle-kit 0.31.11, `@neondatabase/serverless` 1.2.
  - The raw Google claims reach `user.validateUserInfo` as `source.oauth.profile`. The Google provider's `hd` option rejects tokens without the claim.
- **`src/lib/auth/coach-access.ts`:** the pure access rule, with 23 tests. It covers the traps: a consumer account with an @yaqbot.com address, another Workspace domain, an unverified email, and the dev allowlist in production versus Preview versus an unknown host.
- **Better Auth, with Google as the only method:**
  - the rule runs on every sign-in, including returning users;
  - production also pins `hd=yaqbot.com`, an independent second check;
  - `/coach` checks the session on the server, and `/coach/denied` explains rejections, in es / en / ca.
- **Drizzle + Neon:**
  - the auth tables are generated with the official CLI (`auth`), with the first SQL migration;
  - migrations are applied to both Neon branches, and the tables were verified by listing them;
  - env vars are validated with Zod, lazily, so static pages build without secrets.
- **Git workflow:** work happens on `dev`, which has a stable Preview URL registered in Google. `main` is fast-forwarded once a change is verified.
- **Checked from outside:**
  - **Locally:** the Google redirect is correct, with PKCE, minimal scopes and no `hd`, so my Gmail can test.
  - **In production:** `/coach` and `/coach/denied` render, there is no session without a cookie, and the Google request carries `hd=yaqbot.com` with the production callback.

**What broke and what we changed**

1. **The production build tried to create auth at prerender time and failed on missing secrets.** In `getAuth().api.getSession({ headers: await headers() })`, the call `getAuth()` runs before `await headers()`. → Read the headers first, which is where prerendering stops. Documented in `CLAUDE.md`.
2. **Coverage dropped below 95%** because the Better Auth wiring sat in `src/lib`. → Moved it to `src/auth/`: framework wiring is not pure logic.
3. **A PowerShell script used `$home` as a variable,** which is read-only in PowerShell, and broke the message JSON files. → Repaired with targeted edits and validated with `JSON.parse`.
4. **`.env.local` had `AUTH_EXTRA_EMAILS` twice,** the second one empty (copied from `.env.example`). The last one wins, so my Gmail would have been rejected locally. → Claude checked the file without printing any values and removed only the empty line.
5. **Right after the production deploy, `/coach` returned 404 for a few seconds** while the domain switched to the new deployment. A second check with a cache-busting query showed 200. Nothing to fix.

**Pending (acceptance):** my real sign-in tests. My Gmail must work on the Preview and locally, and must be **rejected** on Production.

### Phase 4 — acceptance and a dark-mode fix (2026-10-23)

**Results of my three sign-in tests**

- ✅ **Local:** my Gmail signs in and out.
- ✅ **Preview (`dev`):** my Gmail signs in and out.
- ✅ **Production:** my Gmail is **rejected**. Phase 4 accepted.

**What I reported:** locally, in my browser's dark mode, the black "Entrar con Google" button was indistinguishable from the background.

**Cause**

- The coach panel had light colours only. In dark mode the browser darkened the page itself: the background turned dark, but the already-dark button did not change.

**What Claude changed**

- **A real dark theme for the coach area.** The `--coach-*` CSS variables switch with `prefers-color-scheme`, and the layout declares `colorScheme: "light dark"`, so browsers no longer auto-darken it. In dark mode the primary button becomes light on a dark card.
- **New `e2e/coach-theme.spec.ts`,** in light and dark:
  - button versus card ≥ 3:1 (WCAG 1.4.11), and label versus button ≥ 4.5:1 (WCAG 1.4.3);
  - the card really is dark in dark mode;
  - the color-scheme meta tag is present.
- **The e2e web server now gets placeholder auth and database env vars.** `/coach` renders in tests, and e2e never touches the real database even if `.env.local` exists.

**What else broke on the way**

1. **The first version of the contrast test passed even with the old light-only theme,** because the light theme has enough contrast on its own. → It now also asserts that the theme actually switches.
2. **`pnpm dev` kept serving the old CSS after `globals.css` changed,** even after a restart: Turbopack's persistent dev cache missed the edit. → Found by reading the served stylesheet in the browser, and fixed by deleting `.next/`. Documented in `CLAUDE.md`.

**Checks:** `pnpm check` (136 unit tests) and `pnpm test:e2e` (95/95) pass.

---

## Phase 5 — Coach panel + desktop → phone — 2026-10-23 (in progress)

**What I asked**

- Move on to Phase 5: the coach configures the three modes on the desktop and sends the workout to the phone with a QR code and a short code.

**What Claude did**

- **Verified the libraries (npm, 2026-10-23).**
  - `qrcode` 1.5.4: no release since 2024, but it is the mature reference, renders SVG on the server and has types. `lean-qr` and `uqr` are active but far less used.
  - `nanoid` 6.0.2, for unbiased, cryptographically random codes.
- **Pure logic, unit-tested:**
  - **`src/lib/share/code.ts`:** a 6-character alphabet without look-alikes (no 0/O, 1/I/L), normalising what people type (case, spaces, dashes), validation, and display as "K7Q M4P". Shares expire after 7 days.
  - **`src/lib/coach/workout-form.ts`:**
    - the form state (durations in minutes + seconds, EMOM station rows);
    - conversion to the workout input;
    - validation with the **same Zod schema** as the server and the phone, mapped to form fields and translated messages.
  - **`getStoredShareCode`** in `session.ts`, for the phone's "continue the last workout" link.
- **Database:**
  - a `share` table holding the code, a workout snapshot (jsonb, re-validated with Zod on every read), the author and the expiry;
  - migration `0001_shares`, applied to both Neon branches;
  - `src/db/shares.ts` creates a share (retrying on the unlikely code collision) and reads a non-expired one.
- **Coach panel (`/coach`, signed in):**
  - mode cards for For Time, AMRAP and EMOM;
  - per-mode fields with inline, accessible errors;
  - optional name, exercises and prep countdown;
  - a **live preview that renders the real phone `RunningView`** in a phone-shaped frame.
  - **"Send to phone"** calls a Server Action, which re-checks the session and the workout on the server.
- **Share page (`/coach/share/[code]`):**
  - the QR code (always black on white, so it scans in dark mode), pointing to `/t/CODE` in the coach's language;
  - the big short code;
  - the agreed per-phone guidance (iPhone: install, then type the code; Android: scan the QR);
  - the 7-day expiry note.
- **Phone:**
  - **`/t`:** the code entry screen and start page of the installed app. It normalises the code, rejects malformed ones, and links to the last workout and the demos.
  - **`/t/[code]`:** downloads the snapshot once, with no login, then runs the timer offline.
  - Malformed codes never reach the database.
  - Unknown or expired codes show "Code not found". **A database or network failure shows "Couldn't load" with a retry, never a blank screen.**
- **Tests:**
  - 170 unit tests;
  - 120 e2e tests: the code entry, a malformed code, an outage, **the timer running with the network off after loading**, and the fit-the-screen rule for `/t`.
  - Manually: a test share inserted into the dev branch opened correctly from `/t`, typed as "8cb jnv" and also as `/t/8cb-jnv`.

**What broke and what we changed**

1. **Mapping Zod issues to fields:** an over-long exercise and "too many exercises" share the code `too_big`. → They are told apart by the issue path (`stations.3` versus `stations`). Caught by a unit test.
2. **React 19's lint rule forbids reading refs during render** (used to keep the last valid preview). → The last valid workout now lives in state, updated in the change handler.
3. **Typed next-intl messages** rejected a generic params object for a union of keys, and the share page's `locale` param is a plain string. → One explicit call per error code, and `hasLocale` to narrow the locale.
4. **The build failed: `usePathname()` outside `<Suspense>` on the dynamic share route.** → The coach header's language switcher is wrapped in `<Suspense>`.
5. **Cache Components flagged `new Date()` (the expiry check) during prerendering.** → `await io()` from `next/cache`, which the Next 16.4 docs recommend over `connection()`, before the lookup.
6. **Dangerous env trap:** with a production build, a valid code showed "not found". Next.js loads `.env.production.local` **automatically in production mode**, so a local `next start` was reading the **production** database.
   - → Renamed it to `.env.migrate.production`, which only `pnpm db:migrate:prod` reads.
   - Documented in `CLAUDE.md`.
7. **WebKit hydration race, again:** text typed in `/t` before React took over was wiped. → The code input and its button are disabled until hydration, like the Start button.
8. **A fit-screen test timed out on `/t`:** the file-wide paused fake clock stopped React from streaming the page in. → That test resumes the clock.

**Pending for Phase 5**

- **My end-to-end check with a real sign-in:** build each mode on the desktop, send it, open it on the phone via QR **and** via code, with Wi-Fi off after loading.
- **Visual review of `/coach` and `/coach/share/[code]`.** They need a session, so Claude could not screenshot them.
- **Deploy:** push `dev`, verify the Preview, then fast-forward `main`.

### Phase 5 — first feedback on the Preview (2026-10-23)

**What I reported**

1. Scanning the QR (or opening the link) on my phone sent me to a Vercel sign-up page.
2. I want to pass the code and the link from WhatsApp on the computer to WhatsApp on the phone: the link should be clickable, and both should be easy to copy.

**Cause and decision (1):** the Preview has Vercel Authentication on, so only logged-in Vercel users with access can open it. That's not a bug in the app.

- I turn it off for this project in Vercel (Settings → Deployment Protection).
- Production was never behind it.
- The coach area stays protected by the Google sign-in and the access rule. The phone routes are public by design.

**What Claude changed (2)**

- The share page now shows the **direct link** (`…/t/CODE`) as a real link, opening in a new tab so the QR stays on screen.
- Both the code and the link have a **copy button** (Clipboard API) with "Copied" feedback.
- If the browser denies clipboard access, the page says so and asks to copy by hand.
- The "or open … and type the code" address is a link too.
- The old "open on this device" button was removed, since the direct link does the same.
- The view moved to `src/components/coach/share-view.tsx`.

**How it was checked**

- **Copy buttons and layout:** checked in the browser pane through a temporary page (deleted) with sample data, because `/coach` needs my sign-in.
  - Light and dark themes look right.
  - The copied values are `8CB JNV` and the full URL.
  - The denied-clipboard message shows.
- **Checks:** `pnpm check` passes.

### Phase 5 — share page built around one link (2026-10-23)

**What I asked**

- With the full link copyable, the separate code and the "open …/t and type the code" line are redundant. Remove them.
- Make it clearer and bigger: open the link on this device, or copy it for another device.

**What Claude changed**

- The page now has one big, clickable **workout link**, with two cards:
  - **"On this device"** — an "Open the timer" button;
  - **"On another device"** — a "Copy link" button, plus the QR to scan with the camera.
- **The code stays in one place only: the iPhone tip.** The installed Home Screen app opens on the code screen (a link from WhatsApp opens in Safari, not in the app), so an iPhone still needs the code to get full screen.
- Android's tip now says "open the link or scan the QR".
- I had already turned off Vercel Authentication on the project, so phones open the Preview without a Vercel account.

**How it was checked**

- Browser pane, through a temporary page with sample data (deleted): desktop light and dark, and a 375 px phone width with no horizontal scroll.
- The copied value is the full URL.
- **Checks:** `pnpm check` and `pnpm test:e2e` pass.

### Phase 5 — my end-to-end tests and the share page on one screen (2026-10-24)

**My tests:** everything works on the desktop and on my Android:

- the three modes;
- QR, link through WhatsApp, and typed code;
- running offline after loading.

The iPhone test is still pending (a friend's phone).

**What I asked**

- Put "On another device" on the left: it's the usual case.
- Remove the link shown at the top: the two buttons already open and copy it.
- Update the iPhone tip, which still told coaches to type the code.
- Fit the whole page on one screen, with no scrolling.

**What Claude changed**

- **"On another device" comes first and is wider.** The QR sits beside the copy button, with a short caption.
- The link block at the top is gone. "Set up another workout" moved up next to the title.
- **New iPhone tip:** open the link in Safari, then Share → Add to Home Screen, and open it from the icon. If the app is already installed, type the code, which stays visible only there.
  - Why the code stays: an app installed earlier opens on `/t`, and links never open inside it.
  - `docs/PLAN.md` and `README.md` were updated to match.
- **The tips use inline titles, and the coach area has less vertical padding.**
  - Checked in the browser pane through a temporary page (deleted). The page fits with no scrolling at 1280×600, 1024×640, 1366×650 and 1920×950, in both themes.
  - On a 375 px phone it scrolls, as expected for a desktop page, with no horizontal scroll.
- **Phase 6 note:** iPhones may now add a `/t/CODE` page to the Home Screen, so the manifest must keep that working.

### Phase 5 — accepted (2026-10-24)

**Result:** everything passed on the desktop, on my Android and on a friend's iPhone:

- the three modes;
- QR, a link through WhatsApp, and a typed code;
- running offline;
- on iPhone, the Home Screen web app in full screen.

**What changed:** `dev` fast-forwarded to `main`, so Production deploys this phase. Production's Neon branch already had the `share` table.

## Phase 6 — Extras — 2026-10-24 (built, not yet accepted)

**What I asked:** "vamos a por la fase 6": presets per coach, the Box library, the installable web app and offline reloads.

**What Claude did**

1. **Presets and the Box library**
   - **Database:** a new `preset` table (id, owner, workout as jsonb, timestamps), with migration `0002`, applied to the Neon `dev` branch.
     - Every coach can read every preset.
     - Updates and deletes filter by owner in SQL.
     - There is a limit of 100 presets per coach.
   - **Server Actions** (`preset-actions.ts`): save (create or update), duplicate and delete.
     - Each one re-checks the session and validates its input with Zod.
     - Each one calls `refresh()`, so the lists re-render.
   - **UI:** a "Saved workouts" panel above the builder, with two accessible tabs.
     - **My workouts:** Edit, and Delete with an inline confirmation.
     - **Box library:** other coaches' workouts, with their author. **Use** loads one as a new workout; **Duplicate** copies it into mine.
     - The builder gets "Save to my workouts", and while editing, "Save changes" and "Save as new".
     - A preset needs a name.
   - **Code structure**
     - The form state moved into a `useWorkoutForm` hook, shared by the panel and the builder.
     - `formStateFromWorkout` (with round-trip tests) loads a workout back into the form.
2. **Installable web app**
   - **A stopwatch icon** in the Start button's green. Every size comes from one drawing (`pnpm icons`): the SVG favicon, the Apple touch icon, and 192/512 icons plus a maskable one.
   - **One manifest per phone page** (`/app.webmanifest?start=/t/CODE`).
     - The installed app opens the page it was added from. This keeps the iPhone flow agreed in Phase 5 (add the workout page to the Home Screen) working. Installing from `/t` opens the code screen.
     - The start path is validated, with unit tests: only `/t…` pages are accepted.
   - **Install guide on `/t`:**
     - Android: an "Install the app" button, from Chrome's `beforeinstallprompt`.
     - iPhone: the Share → Add to Home Screen steps.
     - Already installed: nothing.
   - **iPhone:** a black-translucent status bar.
3. **Offline reloads:** a hand-written service worker (`public/sw.js`), about 100 lines and no new dependency. Next's PWA guide points to a custom worker or Serwist.
   - **Phone pages:** network first, falling back to the last good copy.
   - **Build assets:** cache first.
   - **Everything else** (coach area, auth) is untouched.
   - **First visit:** the page sends the worker the URLs it has already loaded, so it works offline straight away.
   - **"Couldn't load" screen:** marked, so it never replaces a good copy.
   - **Registration:** in production builds only.

**How it was checked**

- **Unit:** 183 tests pass (presets input, form round-trips, manifest).
- **e2e:** 131 pass. The new spec covers:
  - per-page manifests;
  - a phone page reloading and starting with the network off;
  - the error page never being stored.
- **Browser pane on a local production build:**
  - the manifest, icons, Apple tags and service worker are active and controlling the page;
  - a simulated install event shows and then hides the Install button;
  - `/t` still fits the screen.
- **Presets UI:** a temporary page with sample data (deleted), because `/coach` needs my sign-in:
  - Edit / Use load the form;
  - the editing banner and the delete confirmation work;
  - saving without a session shows the session error.

**What broke and what we changed**

- **Lint and format:** nothing new.
- **Browser-pane screenshots looked cropped** at desktop sizes. Measuring the page showed no horizontal overflow: it was the pane's scaling.

**Pending for Phase 6**

- **My check on the Preview with a real sign-in:** save, edit and delete presets; duplicate from the Box library (needs a second coach account, or two of my test accounts).
- **Install on Android and iPhone.** The app must open full screen from the icon.
- **Offline reload on a real phone:** load a workout, switch on airplane mode, reload.
- **Production:** run `pnpm db:migrate:prod` (the `preset` table) before fast-forwarding `main`.

### Phase 6 — feedback on the saved workouts (2026-10-24)

**What I asked**

- Every saved workout needs a "Send to phone" button, without going through Edit first.
- "Box library" and "Save as new" looked like plain text: give them a visible button frame.

**What Claude changed**

- **Each preset card** has a full-width **Send to phone** button, which goes straight to the share page. Below it, Edit/Delete (my workouts) or Use/Duplicate (library) sit side by side, so cards stay tidy with three per row.
- **Visible frames:** both tabs now have a border, and so do "Save as new" and the "Start a new one" button in the editing banner.
- **Checked:** in the browser pane through a temporary page (deleted), in both themes. `pnpm check` and `pnpm test:e2e` pass.

### Phase 6 — accepted (2026-10-24)

**Result:** everything I tested on the Preview works:

- presets: save, edit, delete, and send to the phone straight from the list;
- the Box library;
- installing the app;
- reloading offline.

**Going to production**

1. Apply migration `0002` (the `preset` table) to Neon `production` with `pnpm db:migrate:prod`.
2. Then fast-forward `main`.

Claude's attempt to run the production migration was blocked by Claude Code's permission check, so I run it myself.

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

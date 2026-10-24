# CrossFit Box Timer — Plan

> **Status: AGREED v1.0 (2026-10-21).** Changes to this plan are discussed first and recorded in `docs/DEVLOG.md`.
> Each phase starts only with explicit approval.

## 1. Goal

A web app for the box **"CrossFit Box"** (client: Yaqbot, take-home task):

- **Coaches** configure a workout on a **desktop** computer.
- The workout reaches a **phone** mounted near the rig.
- The phone runs a **full-screen timer** that can be read from several metres away. It plays **beeps** and keeps running for a **whole class untouched**.

Guiding principle from the client: _"We'd rather see something smaller that works on a real phone than something bigger that doesn't."_ The five minimum requirements come first. Extras come only after those are solid on real devices.

Deadline: **Monday 2026-10-26, 23:59 (Europe/Madrid)**. Suggested effort is 3–4 h. We report the real time spent honestly in the notes.

## 2. Minimum requirements (must)

| #   | Requirement                                                               | How we meet it                                                                                                                                                                                                                                                     |
| --- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| R1  | Desktop setup: For Time (with cap), AMRAP, EMOM; each configurable        | Coach panel with one form per mode, validated on client and server                                                                                                                                                                                                 |
| R2  | Desktop → phone                                                           | The coach clicks "Send to phone" and gets a **short code + QR**. The phone opens `/t/<code>` (no login), downloads the workout once and then runs offline                                                                                                          |
| R3  | Full-screen, readable, sound cues, a full session untouched               | Huge tabular digits, dark high-contrast UI, Web Audio beeps scheduled on the audio clock, Screen Wake Lock, wall-clock timing, self-recovery. **Every phone screen fits the visible screen with no scrolling and nothing cut off** (rule added 2026-10-23, see §6) |
| R4  | Google sign-in, any `@yaqbot.com` account (tested with `hola@yaqbot.com`) | Better Auth + Google provider. The rule is enforced **server-side**: a verified email plus the ID-token claim `hd === "yaqbot.com"`. The OAuth app is **In production**                                                                                            |
| R5  | Online at a URL                                                           | Vercel (Hobby, free), with Neon Postgres (free)                                                                                                                                                                                                                    |

## 3. Workout modes (domain spec)

Every mode starts with a **prep countdown**, 10 s by default and configurable to 0/5/10/15/20 s. It plays short beeps at 3-2-1 and a long beep at "go".

All modes also have an optional **name** and **exercises text**. They appear small on the phone and never compete with the clock.

### For Time (with time cap)

- **Clock:** counts **up** from 00:00 and stops at the cap. It keeps running when athletes finish, because each athlete reads their own time.
- **Config:** time cap (required, 1–60 min).
- **Screen:** elapsed time (huge), `FOR TIME · CAP 10:00`, the exercises, and the time left to the cap (small). At the cap the screen shows **"TIME CAP"**.
- **Cues:** a warning at 1:00 left, short beeps at 3-2-1 before the cap, and the final horn at the cap.

### AMRAP

- **Clock:** counts **down** from the duration to 00:00. Rounds are not counted.
- **Config:** duration (1–60 min).
- **Screen:** time remaining (huge), `AMRAP 12`, the exercises.
- **Cues:** a warning at half time, a warning at 1:00 left, short beeps at 3-2-1, and the final horn.

### EMOM (and E*n*MOM)

- **Clock:** the timer marks only the **start of each interval**. Athletes split work and rest themselves.
- **Config:**
  - interval length: 10 s – 10 min in 5 s steps, default 1:00;
  - number of rounds: 1–60. The total is shown as `rounds × interval` and is capped at 60 minutes, like the other modes;
  - optional exercise list that cycles (A, B, C, A, B, C…). It covers odd/even alternation (2 items) and stations (N items).
- **Screen:** seconds left in the current interval (huge), `Round 3 / 10` (large), `EMOM · 10 × 1:00`, and `Now: 12 KB swings` / `Next: …`.
- **Cues:** short beeps at 3-2-1 before each new interval and a long beep when each interval starts. After the last round, the final horn replaces the long beep.

**Cue sounds** (synthesized, no audio files):

- short beep: 3-2-1 countdowns;
- long beep: go / new interval;
- double beep: warnings;
- final horn: end.

They are tuned in the 1–3 kHz range to cut through gym noise, and we adjust them on a real device.

## 4. Extras (should, after R1–R5 are solid)

1. **Presets per coach**: saved workouts the coach can load, edit and reuse.
2. **Other coaches' presets**: a read-only "Box library" section. Any coach can **duplicate** a colleague's preset into their own, for example to cover for a substitute.
3. **QR code + short code**: this is part of how R2 works, so it is built with R2.
4. **i18n**: Spanish (default), English and Catalan on both the coach panel and the phone.
5. **Installable web app** (manifest and icons) with in-app instructions for "Add to Home Screen". This is effectively required for full screen on iPhone (see §7).
6. **Offline reload**: a service worker, so the phone page reloads even without network.

## 5. Out of scope (documented as future work)

- Multi-part sessions (warm-up → strength → WOD).
- More modes: Tabata, custom intervals, rest blocks. The engine's segment model is designed so they are easy to add later.
- Counting rounds or reps on the phone.
- Several phones synchronized on the same timer.
- Remote start or control from the desktop.
- Voice cues.

## 6. Architecture

### Stack (versions verified 2026-10-21; see §11)

| Piece           | Choice                                                                                                                 | Why                                                                                                                                                                              |
| --------------- | ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework       | **Next.js 16.4** (App Router, Turbopack, Cache Components), **React 19.3**                                             | The client's stack. One codebase covers the coach panel, server logic and the public phone page. Turbopack and Cache Components are the current defaults                         |
| Language        | **TypeScript 6.0** (strict)                                                                                            | TS 7.0 (Go port) is stable but has no programmatic API until 7.1, which typescript-eslint and the Next.js tooling still need. Microsoft keeps 6.x for exactly this case          |
| Runtime         | **Node.js 24.x** LTS                                                                                                   | Vercel's default. Node 26 only becomes Active LTS on 2026-10-28                                                                                                                  |
| Package manager | **pnpm 12**                                                                                                            | Latest stable, pinned through `packageManager`                                                                                                                                   |
| Styling         | **Tailwind CSS 4.3** + **shadcn/ui** (coach panel only)                                                                | Tailwind needs no config. shadcn gives accessible form, dialog and tab primitives we own as code                                                                                 |
| i18n            | **next-intl 4.14**: `es` default without prefix, `/en`, `/ca`                                                          | The de-facto App Router i18n library, integrated with `proxy.ts`                                                                                                                 |
| Auth            | **Better Auth 1.7** (≥1.7.12) + Google provider                                                                        | Auth.js is now maintained by the Better Auth team, which recommends Better Auth for new projects. It has a documented hook (`validateUserInfo`) to reject users on every sign-in |
| Database        | **Neon Postgres** (Free plan, own Neon account)                                                                        | The client uses Postgres. Neon is free without a card, scales to zero without pausing the project (Supabase pauses after 7 days), and has branches for dev and prod              |
| ORM             | **Drizzle ORM 0.45** + drizzle-kit 0.31                                                                                | Thin, SQL-first, no codegen, supported by the Better Auth adapter. We avoid the Drizzle 1.0 RC and the Prisma 8 RC                                                               |
| Validation      | **Zod 4.6**                                                                                                            | One schema per mode, shared by the form, server actions and the phone page                                                                                                       |
| Hosting         | **Vercel Hobby**                                                                                                       | First-class Next.js support. Env vars can be scoped to Development, Preview and Production. Free                                                                                 |
| Tests           | **Vitest 5** (unit), **Playwright 1.64** (e2e with WebKit "iPhone 17" and Chromium "Pixel 10", portrait and landscape) | The timer engine is pure TS and fully unit-tested. Device emulation covers layouts. Real devices cover audio, wake lock and the 60-minute runs                                   |
| Quality         | ESLint 10 (flat config, `eslint-config-next`), Prettier 3.9                                                            | `next lint` was removed in Next 16, so this is the officially documented path                                                                                                    |
| Small libs      | `qrcode` (server-side SVG), `nanoid` `customAlphabet`                                                                  | Dependency-light                                                                                                                                                                 |

### Routes

| Route                 | Who     | What                                                                                                            |
| --------------------- | ------- | --------------------------------------------------------------------------------------------------------------- |
| `/`                   | public  | Landing with "Coach sign-in" and "Open timer (enter code)"                                                      |
| `/coach`              | coaches | Workout builder (mode tabs, live preview of the phone screen), "Send to phone", my presets, Box library         |
| `/coach/share/[code]` | coaches | One link: copy it for another device (with a QR) or open it here; fits one desktop screen                       |
| `/t`                  | public  | **Phone home**: enter a 6-character code and reopen the last workout. This is the installed web app's start URL |
| `/t/[code]`           | public  | Loads the workout snapshot, stores it locally, shows "Ready" with a big **Start** button, then the timer        |
| `/api/auth/[...all]`  | —       | Better Auth handler                                                                                             |

**Why a link, a QR and a code:** the link (copied into WhatsApp, for example) and the QR open the workout in the phone's browser. On iPhone that is Safari, not an installed Home Screen app, so the coach adds the workout page to the Home Screen from there. An app installed earlier opens on `/t`, so the code is still shown, inside the iPhone tip. _(Revised 2026-10-24 after the developer's review of the share page.)_

**Recommended method per phone.** The share page on the desktop shows both, with this guidance:

| Phone                 | Recommended                                                                                                                 | Why                                                                                       |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| **iPhone**            | Open the link in Safari, then Share → Add to Home Screen and open it from the icon; if already installed, **type the code** | Only the Home Screen app is truly full screen on iPhone, and links and QRs open in Safari |
| **Android**           | **Open the link or scan the QR**; it opens in Chrome                                                                        | Chrome on Android supports real full screen from the browser, so no install is needed     |
| Any phone, quick test | Scan the QR                                                                                                                 | Fastest, at the cost of browser bars on iPhone                                            |

The phone page also detects iPhone Safari outside the Home Screen app and suggests installing it, without blocking the timer.

### Data model (Postgres)

- **Better Auth tables**: `user`, `session`, `account`, `verification`.
- **`workout`** (presets): `id`, `ownerId → user`, `name`, `mode`, `config` (jsonb, validated by Zod), `exercises` (text), `createdAt`, `updatedAt`.
- **`share`**: `code` (6 chars, unambiguous alphabet, PK), `workout` (jsonb **snapshot**, so later edits never change a running phone), `createdBy`, `createdAt`, `expiresAt` (7 days).

### Timer engine (pure TypeScript, framework-free)

- `buildTimeline(config) → { segments[], cues[], totalMs }`: a mode-independent list of segments (prep, work, intervals) and cue events (`{ atMs, kind }`).
- `getDisplayState(timeline, elapsedMs) → { phase, bigTime, round, label, … }`: a pure function, trivially unit-tested at any instant.
- **Time source:**
  - At Start we persist `startedAtEpochMs` (and the workout) in `localStorage`.
  - Elapsed time is always `now − start`. We never count ticks, so lag never accumulates.
  - A reload, or the page being killed, resumes at the correct second.
- **Rendering:** `requestAnimationFrame`, updating the DOM only when the displayed second changes.
- **Audio scheduler:**
  - A look-ahead loop schedules cues on `AudioContext.currentTime` about 1–2 s ahead, so beeps are sample-accurate even when the main thread is slow.
  - It compensates `outputLatency`, so Bluetooth speakers beep in sync with the display.

### Fit-the-screen rule (added 2026-10-23, after the first real-phone test)

Every phone timer screen fits the visible screen completely, with no scrolling and nothing cut off:

- **Screens covered:** ready, running, paused, finished, and with controls, prompts or dialogs open.
- **Where:** any device, in portrait and landscape, including safe areas (camera cut-outs, gesture bars).

How it is achieved and enforced:

- **One frame.** All screens render inside one `PhoneFrame`: fixed to the viewport, with safe areas as inner padding.
- **Sizing.** Content uses `h-full` and container query units. Viewport units (`vh` / `dvh`) are not used: they ignore the safe-area padding, and that was the cause of the OnePlus 10T bug.
- **Flexible text.** Only coach-written text (descriptions, station names) may shrink or clamp.
- **Test.** `e2e/fit-screen.spec.ts` checks it on every profile, and emulates safe-area insets on Chromium.

### Phone robustness ("untouched for a whole class")

**On the Start tap**, all of this happens inside one user gesture:

1. `navigator.audioSession.type = "playback"` (iOS 17+), so beeps play even in Silent mode.
2. Create or resume the `AudioContext`.
3. Request the Screen Wake Lock.
4. On Android, call `requestFullscreen()`.

**Keep-alive while the timer runs:**

- Re-acquire the wake lock on `visibilitychange`.
- Watch the `AudioContext` state and resume it after an interruption.
- If an action really needs a tap, for example after a phone call, show a clear "Tap to resume sound" overlay **while the clock keeps running**.
- Play a near-inaudible keep-alive tone, so Bluetooth speakers don't fall asleep and Chrome doesn't switch to its "silent sink" after 30 s.

**Fallbacks and controls:**

- If the wake lock is not supported or is denied, show a visible warning with instructions. We don't add a NoSleep.js-style hack: it is unmaintained since 2020 and unverified on iOS 26/27.
- **Hidden controls**: one tap reveals pause/stop/restart. Stop and restart require a confirmation. The controls auto-hide after a few seconds.
- **Layout**: fluid typography (`clamp`/container units), tested in portrait and landscape, with safe-area insets for notches.

### Access rule (server-side)

Implemented as a pure function `isAllowedCoach(profile, env)`, unit-tested, and called from Better Auth's `validateUserInfo` on **every** sign-in. A user is allowed when:

```
email_verified === true
AND (
  (hd === "yaqbot.com" AND email ends with "@yaqbot.com")
  OR (VERCEL_ENV !== "production" AND email ∈ AUTH_EXTRA_EMAILS)
)
```

- **Why `hd`:** Google's docs say the email domain alone can't be trusted. Anyone can create a consumer Google account with a non-Gmail address. The `hd` claim proves the account belongs to the yaqbot.com Google Workspace. yaqbot.com's MX records point to Google, so it uses Workspace.
- **`AUTH_EXTRA_EMAILS`** (the developer's own Gmail):
  - It is set **only** in Development (`.env.local`) and Vercel **Preview**.
  - The code also ignores it when `VERCEL_ENV === "production"`, so a misconfigured variable can never open Production.
- **Defense in depth:** every coach page, server action and DB query also checks the session server-side. The proxy check is only a fast redirect.

### Environments

| Env         | URL                                                                     | DB                       | Extra emails |
| ----------- | ----------------------------------------------------------------------- | ------------------------ | ------------ |
| Development | `http://localhost:3000`                                                 | Neon branch `dev`        | yes          |
| Preview     | `crossfit-box-timer-git-dev-marcsanz-dev.vercel.app` (Git branch `dev`) | Neon branch `dev`        | yes          |
| Production  | `crossfit-box-timer.vercel.app`                                         | Neon branch `production` | **no**       |

**Google OAuth on Preview:** Google forbids wildcard redirect URIs, and each preview deployment has a different URL. We register the **stable branch URL** of one preview branch as an extra redirect URI and scope `BETTER_AUTH_URL` to that branch in Vercel.

The alternative is Better Auth's `oAuthProxy` plugin. It works on any preview URL but adds a shared secret between environments. We keep it as plan B.

## 7. Risks and mitigations

| Risk                                                                  | Impact                                | Mitigation                                                                                                                                                                                                                |
| --------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **No element fullscreen on iPhone**, still the case in iOS 27         | Browser bars are visible in Safari    | Installable web app: since iOS 26, Add to Home Screen opens as a web app by default. Use `black-translucent` status bar plus safe areas, and show in-app install instructions. Landscape in Safari still works acceptably |
| iOS Silent switch mutes Web Audio                                     | No beeps                              | `audioSession.type = "playback"` (iOS 17+). Trade-off: it pauses other audio on the same phone, such as music. Documented: play music from another device                                                                 |
| Wake lock released or denied (Low Power Mode, Battery Saver)          | Screen turns off                      | Re-acquire on visibility change, show a visible warning, tell the coach to disable power saving. **Test on battery on real devices**                                                                                      |
| AudioContext interrupted (call, other app)                            | Silent timer                          | State watcher, resume, and a "tap to resume sound" overlay. The clock never stops                                                                                                                                         |
| Bluetooth speaker sleeps or has latency                               | First beep clipped, or beeps late     | Keep-alive tone and `outputLatency` compensation                                                                                                                                                                          |
| Wake Lock and installability need **HTTPS**                           | Can't test on a real phone via LAN IP | **Deploy early** (Phase 3) and test on real phones from Preview                                                                                                                                                           |
| Vercel Hobby is "non-commercial use only"                             | Terms                                 | This is an unpaid take-home exercise. Documented: a real deployment for the box would move to Vercel Pro or Yaqbot's own infrastructure                                                                                   |
| `hola@yaqbot.com` might not be a real Workspace user (alias or group) | Client can't sign in                  | Evidence says Workspace. If in doubt, this is the one question worth emailing to the client                                                                                                                               |
| Neon cold start after 5 min idle                                      | ~0.5 s slower first request           | Acceptable. The phone needs the network only once                                                                                                                                                                         |
| Time budget (3–4 h suggested)                                         | Over-engineering                      | Strict phase order. Extras only after R1–R5 pass on real phones                                                                                                                                                           |

## 8. Phases and acceptance criteria

Each phase ends with: tests green, a DEVLOG entry, a plain-language explanation to the developer, small Conventional Commits, and approval before the next phase.

### Status (updated 2026-10-24)

| Phase                           | Status                        | What is left                                                                                                                                                                                                                                                                                              |
| ------------------------------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0 Foundations                   | ✅ Done                       | —                                                                                                                                                                                                                                                                                                         |
| 1 Timer engine                  | ✅ Done                       | —                                                                                                                                                                                                                                                                                                         |
| 2 Phone timer                   | ✅ Done                       | —                                                                                                                                                                                                                                                                                                         |
| 3 First deploy + real phones    | 🟡 Mostly done                | Done: deployed, fit-the-screen rule, OnePlus 10T fixes. Left: `docs/REAL-DEVICE-TESTS.md` (sound at 3 m, 60 min on battery, iPhone checks), run in parallel                                                                                                                                               |
| 4 Auth + DB                     | ✅ Done (accepted 2026-10-23) | —                                                                                                                                                                                                                                                                                                         |
| 5 Coach panel + desktop → phone | ✅ Done (accepted 2026-10-24) | —                                                                                                                                                                                                                                                                                                         |
| 6 Extras                        | ✅ Done (accepted 2026-10-24) | —                                                                                                                                                                                                                                                                                                         |
| 7 Polish + verification         | 🟡 Built, not yet accepted    | Done: demo texts in es/en/ca, real landing page, axe WCAG 2.2 A/AA e2e on every public page in both themes (coach panel checked with sample data), Lighthouse mobile 99/100/100/100 on `/t`, `/t/demo/amrap` and `/`. Left: the full real-device pass (`docs/REAL-DEVICE-TESTS.md`) on Android and iPhone |
| 8 Delivery                      | ⬜ Not started                | —                                                                                                                                                                                                                                                                                                         |

**Phase 0 — Foundations** (docs + scaffold)

- `git init`; `CLAUDE.md`, `docs/PLAN.md` (agreed), `docs/DEVLOG.md`, `README.md` skeleton.
- `create-next-app` (Next 16.4, TS, Tailwind, ESLint, App Router), Prettier, Vitest, Playwright, next-intl wired with `es` / `en` / `ca` from day one.
- ✅ Done when `pnpm dev`, `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm build` all pass on an empty app, and `/`, `/en` and `/ca` render.

**Phase 1 — Timer engine** (pure TS, no UI)

- Zod schemas for the three modes; `buildTimeline`; `getDisplayState`; cue lists.
- ✅ Done when unit tests cover every mode at its boundaries: prep, first second, cue instants, the EMOM interval change, cap/end, and reload at an arbitrary instant. Coverage of the engine is ≥ 95%.

**Phase 2 — Phone timer** (local demo workout, no backend)

- `/t/demo`: Ready screen, Start, prep, timer, finished screen; audio scheduler and beeps; wake lock; Android fullscreen; hidden controls with confirmation; localStorage resume; responsive portrait and landscape.
- ✅ Done when:
  - Playwright screenshots on the iPhone 17 / Pixel 10 profiles in both orientations show no overflow;
  - (added 2026-10-23) `e2e/fit-screen.spec.ts` proves that every phone screen fits with emulated safe areas, with no scroll and every button complete;
  - a manual desktop check confirms beeps fire at the right seconds;
  - a reload mid-workout resumes at the correct time.

**Phase 3 — First deploy + real-phone test** (needs the developer to create the GitHub repo and the Vercel project)

- Deploy to Vercel. Run a **60-minute test on the developer's Android phone on battery**, and a quick iPhone test by a friend: Safari plus Home Screen app, Silent mode on.
- ✅ Done when the screen never turns off and every beep is heard on both phones, and issues are logged in DEVLOG.

**Phase 4 — Auth + DB** (needs the developer to create the Neon and Google Cloud accounts)

- Neon `main` and `dev` branches; Drizzle schema and migrations; Better Auth with Google; `isAllowedCoach` plus unit tests; protected `/coach`; Google OAuth app **In production**.
- ✅ Done when:
  - the developer's Gmail can sign in on dev and Preview but is **rejected on Production**;
  - a non-allowed account sees a clear "coaches only" message;
  - the rule has unit tests for: hd match, hd missing, wrong domain, unverified email, and extra email in prod vs preview.

**Phase 5 — Coach panel + desktop → phone** (closes R1 and R2)

- Mode forms with validation and a live preview; "Send to phone" creates a `share` snapshot; QR and code page; `/t` code entry; `/t/[code]` loads the workout, then runs offline.
- ✅ Done when a coach builds each of the three modes on desktop, the phone opens it via QR **and** via code, and the timer runs with Wi-Fi turned off after loading.

**Phase 6 — Extras**: presets, Box library (duplicate), installable web app (manifest, icons, install guide), offline reload (service worker). Note (2026-10-24): iPhones may add a `/t/CODE` page to the Home Screen, so the manifest must keep that working (check how `start_url` interacts with it).

- ✅ Done when presets CRUD and duplicate work, the Home Screen app opens `/t` full screen on iPhone and Android, and a reload works offline.

**Phase 7 — Polish + verification**

- Translations completed (es / en / ca); accessibility pass on the coach panel (keyboard, labels, contrast AA, Lighthouse); visual polish; full real-device test pass.
- ✅ Done when Lighthouse scores Accessibility ≥ 95 and Performance ≥ 90 on the phone page, and every mode has been tested on Android and iPhone.

**Phase 8 — Delivery**

- Final README (usage, local setup, Assumptions & decisions, How I built this with Claude Code); half-page notes from DEVLOG; production URL checked with an `@yaqbot.com` rule review; conversation log exported.

## 9. Assumptions (to be copied to README "Assumptions & decisions")

1. yaqbot.com is a Google Workspace domain, and `hola@yaqbot.com` is a real user in it.
2. Coaches start the timer by tapping **Start** on the phone, just before the workout begins.
3. Sound comes from the phone speaker by default; an external Bluetooth speaker must also work.
4. The phone may run on battery. We still recommend charging and disabling power-saving modes.
5. Music, if any, plays from a different device: iOS "playback" audio pauses other audio on the phone.
6. Presets belong to a coach. Every coach can see and duplicate everyone's presets; only the owner edits or deletes.
7. The phone needs the network only to download the workout; after that it is offline-capable.
8. UI language: Spanish by default, plus English and Catalan (Yaqbot's customers are Spanish speakers).
9. One phone per class; no multi-screen sync.
10. The developer's personal email is allowed only in Development and Preview, never in Production.

## 10. Open questions for the client

None sent for now (one set allowed, to sebastian@yaqbot.com). Candidate if needed: _Is hola@yaqbot.com a regular Google Workspace user (not an alias or group)?_

## 11. Sources (checked 2026-10-21)

- Versions: npm registry (`npm view`), checked 2026-10-21.
- Next.js 16.4 blog, 2026-10-06; Next.js ESLint docs, updated 2026-10-15; Next.js PWA guide, updated 2026-07-30.
- React 19.3 blog, 2026-09-09; TypeScript 7.0 announcement, 2026-07-08; Node.js release schedule, checked 2026-10-21; Vercel Node.js versions doc, 2026-02-27.
- Better Auth: Auth.js joins Better Auth, 2025-09-22; Next.js integration, Google provider and OAuth `validateUserInfo` docs (undated, read 2026-10-21); GitHub releases (1.7.12 on 2026-10-20).
- Google OpenID Connect, 2026-06-15; Verify Google ID token, 2025-12-22; OAuth web server flow (redirect URI rules), 2026-10-16; Google Auth Platform help (Audience / Unverified apps / verification requirements), undated.
- Vercel: environment variables, 2026-09-17; system env vars, 2026-07-15; generated URLs, 2026-09-08; deployment protection, 2026-09-15; Hobby limits, 2026-09-14; fair-use guidelines (non-commercial clause).
- Neon pricing and scale-to-zero docs, read 2026-10-21. Public Suffix List (vercel.app), version 2026-10-20.
- Safari 27.0 release notes, 2026-09-14; WebKit Safari 27 features, 2026-09-17; WebKit "every site opens as a web app" (iOS 26), 2025-06-09; Safari 18.4 notes ("Fixed Wake Lock API for Home Screen Web Apps"), 2025-03-31; WebKit Safari 16.4 features (Wake Lock), 2023-03-27; WebKit bug 237322 (audioSession "playback" vs Silent mode), engineer comment Sep 2024.
- MDN: requestFullscreen, 2026-09-11; Screen Wake Lock API, 2026-09-11; BaseAudioContext.state, 2025-07-24; ScreenOrientation.lock, 2025-11-03; browser-compat-data, read 2026-10-21.
- Chromium source `silent_sink_suspender.cc` (30 s silence → fake sink), HEAD read 2026-10-21; Chrome timer throttling, 2021-01-18.

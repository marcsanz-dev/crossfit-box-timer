# CrossFit Box Timer

A workout timer for the box **CrossFit Box**:

- **On the computer,** coaches sign in with their **@yaqbot.com** Google account and set up a workout: **For Time** (with a time cap), **AMRAP** or **EMOM**.
- **To the phone,** they send it to the phone mounted on the rig with **a link, a QR code or a short code**.
- **On the phone,** a **full-screen, high-contrast timer with beeps** runs the whole class without anyone touching it, even with no network.

|                                      |                                                                                                                                             |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Live URL**                         | **https://crossfit-box-timer.vercel.app**                                                                                                   |
| **Try the phone timer** (no sign-in) | [/t/demo](https://crossfit-box-timer.vercel.app/t/demo)                                                                                     |
| **Coach panel**                      | [/coach](https://crossfit-box-timer.vercel.app/coach): Google accounts in the **yaqbot.com** Workspace only (for example `hola@yaqbot.com`) |
| **Repository**                       | https://github.com/marcsanz-dev/crossfit-box-timer                                                                                          |
| **Languages**                        | Spanish (default), English (`/en`), Catalan (`/ca`)                                                                                         |

## How to use it

### As a coach (computer)

1. **Sign in.** Open [`/coach`](https://crossfit-box-timer.vercel.app/coach) with your @yaqbot.com Google account.
2. **Set up the workout.** Choose **For Time**, **AMRAP** or **EMOM** and configure it:
   - For Time: the time cap;
   - AMRAP: the duration;
   - EMOM: the interval, the rounds and up to 12 exercises that rotate each interval.
   - In every mode you can add a name, the exercises and a prep countdown.
   - The preview shows exactly what the phone will display.
3. **Send to phone.** The next page has one link for the workout:
   - **On another device:** copy the link and send it to the rig phone (for example through WhatsApp), or scan the QR.
   - **On this device:** open the timer right there.
4. **Saved workouts** (optional):
   - Give the workout a name and press **Save to my workouts**.
   - From the list you can send it again in one click, edit it or delete it.
   - The **Box library** tab shows the other coaches' workouts. **Use** loads one into the form, and **Duplicate** copies it into yours.

### On the phone (rig)

1. **Open the workout:** tap the link the coach sent, scan the QR, or type the code at [`/t`](https://crossfit-box-timer.vercel.app/t). No sign-in is needed.
2. **Tap Start once.** That also turns on the sound and keeps the screen awake. Then leave the phone alone.
3. **Mid-workout:** tap the screen to show **Pause / Restart / Stop**. Stop and restart ask for confirmation.

| Phone       | Recommended                                                                                                                                                                           |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **iPhone**  | Open the link in Safari, tap Share → **Add to Home Screen** and open it from the icon: only the Home Screen app is truly full screen. If the app is already installed, type the code. |
| **Android** | Open the link or scan the QR. Chrome goes full screen when you tap Start. `/t` also offers an **Install the app** button.                                                             |

Once a workout has loaded, the phone needs no network. A reload, even offline, resumes at the right second.

## Run it locally

Requirements: **Node.js 24.x** and **pnpm 12** (`npm install -g pnpm@12`).

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

The phone timer (`/t`, `/t/demo`) runs without any configuration. The coach area needs a database and Google sign-in.

1. Copy [`.env.example`](.env.example) to `.env.local` and fill it in:
   - a [Neon](https://neon.tech) Postgres connection string;
   - a random `BETTER_AUTH_SECRET`;
   - a Google OAuth web client, with `http://localhost:3000/api/auth/callback/google` as a redirect URI;
   - optionally, your own Google email in `AUTH_EXTRA_EMAILS`, to sign in locally without a yaqbot.com account.
2. Create the tables:

```bash
pnpm db:migrate
```

| Script                                   | What it does                                                                                   |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `pnpm dev` / `pnpm build` / `pnpm start` | Dev server / production build / serve the build                                                |
| `pnpm check`                             | Lint + typecheck + format check + unit tests                                                   |
| `pnpm test` / `pnpm test:coverage`       | Unit tests (Vitest; coverage of `src/lib` must stay ≥ 95%)                                     |
| `pnpm test:e2e`                          | End-to-end tests (Playwright; first run `pnpm exec playwright install chromium webkit`)        |
| `pnpm db:generate` / `pnpm db:migrate`   | Create a SQL migration from the Drizzle schema / apply migrations to the `.env.local` database |
| `pnpm db:migrate:prod`                   | Apply migrations to production (reads `.env.migrate.production`)                               |
| `pnpm auth:generate`                     | Regenerate the Better Auth tables in `src/db/schema/auth.ts`                                   |
| `pnpm icons`                             | Regenerate the app icons from the drawing in `scripts/generate-icons.mjs`                      |

**Stack:**

- Next.js 16 (App Router, Cache Components), React 19 and TypeScript 6 (strict);
- Tailwind CSS 4 and next-intl;
- Better Auth (Google), Drizzle ORM and Neon Postgres;
- Zod;
- Vitest, Playwright and axe;
- deployed on Vercel.

Versions and the reasons behind them are in [`CLAUDE.md`](CLAUDE.md) and [`docs/PLAN.md`](docs/PLAN.md).

**Quality, as delivered:**

- **Tests:** 190 unit tests (timer engine, audio cue planner, access rule, forms) and 226 end-to-end runs on desktop, iPhone and Android emulation in both orientations. They cover fit-the-screen, offline reloads and WCAG 2.2 A/AA checks with axe in light and dark mode.
- **Lighthouse (mobile):** 99 performance, 100 accessibility, best practices and SEO.
- **Real devices:** a manual pass on an Android phone and an iPhone ([`docs/REAL-DEVICE-TESTS.md`](docs/REAL-DEVICE-TESTS.md)).

## Assumptions & decisions

Assumptions made instead of asking the client, plus the main design decisions. The full reasoning is in [`docs/PLAN.md`](docs/PLAN.md).

1. **yaqbot.com is a Google Workspace domain,** and `hola@yaqbot.com` is a real user in it. Its MX records point to Google.
2. **Access rule, enforced on the server:**
   - **Who can sign in.** Only verified Google accounts whose ID token carries `hd = yaqbot.com` can configure workouts. Per Google's guidance, an email that merely ends in `@yaqbot.com` is not enough.
   - **Two independent checks in production.** Better Auth's Google `hd` option already rejects tokens from other domains, and our own rule runs on every sign-in. Every coach page and Server Action also re-checks the session.
   - **Developer testing.** A list of extra emails (`AUTH_EXTRA_EMAILS`, my own Gmail) is set **only** in local Development and Vercel **Preview**, never in Production.
     - The code also ignores that list whenever `VERCEL_ENV` is `production`, so the live URL follows the @yaqbot.com rule 100%, even if the variable were set there by mistake.
     - Preview and local development use a separate Neon database branch, so test accounts never reach production data.
   - **The OAuth app is "In production"** in Google Cloud, so sign-in is not limited to test users.
3. **Sending a workout makes a snapshot:**
   - **Why a snapshot:** editing a saved workout later never changes a timer that is already loaded.
   - **Codes:** 6 characters from an alphabet without look-alikes (no `0/O`, `1/I/L`), and they expire after 7 days.
   - **One link** covers the usual case (copy it into WhatsApp, or scan its QR). The code is there for an iPhone app installed earlier, because links always open in Safari.
4. **The coach starts the timer** by tapping **Start** on the phone just before the workout. That tap also unlocks audio and the wake lock. There is no remote start.
5. **"Untouched for a whole class"** is designed for, not hoped for:
   - **Time:** derived from timestamps, never counted.
   - **Beeps:** scheduled ahead on the audio clock.
   - **Screen:** the wake lock is re-acquired whenever the page becomes visible again.
   - **Audio:** a near-inaudible keep-alive tone stops Chrome and Bluetooth speakers from going to sleep.
   - **Device features:** every one is best-effort, so the clock runs even if all of them fail.
6. **Sound** comes from the phone speaker by default; Bluetooth speakers also work.
   - **iPhone:** beeps play even in Silent mode. The trade-off is that other audio on that phone (for example music) pauses, so music should play from another device.
   - **Beeps only, no voice:** short beeps for 3-2-1, a long beep for go and each new interval, a double beep for warnings, and a horn at the end.
7. **The phone may run on battery.** We still recommend charging it and turning power-saving modes off.
8. **Offline:** after the first load a service worker keeps the last good copy of each phone page, so a reload works with no network. Each phone page is also installable as an app that opens on that page.
9. **Fit the screen:** every phone screen fits the visible screen in portrait and landscape, notches included, with no scrolling. In landscape the controls may float over the exercise list, because the clock has priority. An end-to-end test enforces this.
10. **Presets belong to each coach.** Every coach can browse and duplicate colleagues' presets, for example to cover a class, but only the owner can edit or delete them. There is a limit of 100 per coach.
11. **Spanish is the default language;** English and Catalan are an explicit choice. Exercise names that boxes say in English (thrusters, burpees…) stay in English.
12. **Out of scope:** multi-part sessions, other modes (Tabata, custom intervals), counting rounds on the phone, several synced phones and voice cues. The engine's segment model makes new modes straightforward to add.
13. **Cost: 0 €.** Vercel Hobby, Neon Free and Google Cloud without billing. Vercel Hobby is for non-commercial use, which fits an unpaid take-home exercise. A real deployment for the box would move to a paid plan or Yaqbot's own infrastructure.

## How I built this with Claude Code

I directed the work and made the product calls. Claude Code wrote the code, the tests and the docs.

- **Plan first.**
  - Claude read the brief, restated it, and asked me the doubts that mattered (scope of the modes, how the workout reaches the phone, sound, presets, languages).
  - It researched the risky topics against current official docs, with dates: iPhone fullscreen and the Silent switch, the Wake Lock API, the Google `hd` claim, and current versions and free tiers.
  - It wrote [`docs/PLAN.md`](docs/PLAN.md): scope, architecture, risks, and 9 phases with acceptance criteria. No code was written until I approved it.
- **One working guide.** [`CLAUDE.md`](CLAUDE.md) holds the rules every session starts from:
  - phase by phase with my approval;
  - verify versions in the docs instead of recalling them;
  - 0 € only;
  - I create every account and handle every secret;
  - Spanish in the chat, English in the code.
  - It also gathered the gotchas we hit along the way, so they weren't repeated.
- **Phases with acceptance.** Each phase ended with the checks, a [`docs/DEVLOG.md`](docs/DEVLOG.md) entry (what I asked, what broke, what changed) and my OK.
  - Work happened on a `dev` branch deployed to a Vercel Preview.
  - `main` (production) only moved forward after I tested the Preview.
- **Testing at three levels:**
  - unit tests for all the logic, which is pure TypeScript with no UI;
  - Playwright on emulated iPhone and Android, with a fake clock, emulated notches and axe;
  - real phones, my Android and a friend's iPhone, for what emulators can't prove: sound at a distance, the wake lock, battery and the iPhone install.
- **My feedback drove the UI.** Screenshots from my phone exposed problems the emulators missed. One example: screens taller than the phone because of the notch padding. Claude reproduced each problem in a test before fixing it, and turned "everything fits on one screen" into a rule with its own test.
- **Claude's mistakes were caught by the process.** Wrong expected values in its own tests, a contrast check that passed falsely, and an env file that silently pointed local builds at the production database. The details are in the DEVLOG; the short version is in [`docs/NOTES.md`](docs/NOTES.md).

## Documentation

- [`docs/PLAN.md`](docs/PLAN.md): the agreed plan (scope, architecture, risks, phases, status).
- [`docs/DEVLOG.md`](docs/DEVLOG.md): the phase-by-phase log.
- [`docs/NOTES.md`](docs/NOTES.md): the half-page delivery notes.
- [`docs/REAL-DEVICE-TESTS.md`](docs/REAL-DEVICE-TESTS.md): the real-phone checklist.
- [`CLAUDE.md`](CLAUDE.md): the working guide for Claude Code (stack, commands, conventions, gotchas).

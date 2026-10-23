@AGENTS.md

# CrossFit Box Timer — working guide for Claude Code

Take-home task for **Yaqbot** (acting as a CrossFit box called **"CrossFit Box"**):

- Coaches configure a workout on a desktop (For Time, AMRAP, EMOM).
- The workout reaches a phone mounted on the rig.
- The phone runs a full-screen timer with beeps, untouched for a whole class.

Deadline: **2026-10-26 23:59 Europe/Madrid**.

**Source of truth:** `docs/PLAN.md` (scope, architecture, phases, acceptance criteria). Read it before starting any phase. Log every phase in `docs/DEVLOG.md`.

## Working rules (non-negotiable)

1. **Phase by phase, with approval.** Never start the next phase without the developer's explicit OK. At the end of each phase:
   - run the checks;
   - add a DEVLOG entry (what was asked / what was done / what broke / what changed and why);
   - explain the phase in plain Spanish.
2. **Verify, don't recall.** Check library versions, APIs and config against current official docs or the npm registry before using them, and cite the source date.
   - Next.js docs for the installed version live in `node_modules/next/dist/docs/`.
   - Use the latest **stable** versions. Deviations are documented (see "Decisions").
3. **0 € only.** Free tiers. Never enable billing or ask for a card.
4. **Accounts and secrets belong to the developer.**
   - The developer creates all accounts (GitHub, Vercel, Neon, Google Cloud). Give exact click-by-click steps.
   - Never ask for secrets in chat. Secrets live in `.env.local` (git-ignored) and in Vercel env vars.
5. **Languages.** Chat with the developer in **Spanish**. Code, comments, README, commits, docs and notes are in **English**.
6. **Git.**
   - Small Conventional Commits that tell the story (plan → implementation → tests → deploy).
   - **Do not create the GitHub repo or push** until the developer says so.
7. The conversation log is delivered to the client: stay on topic.
8. **Priority:** the 5 minimum requirements working flawlessly on a real phone. Extras come after.
9. **Fit-the-screen rule (phone).**
   - Every phone timer screen (ready, running, paused, finished, with controls, prompts or dialogs open) fits the visible screen completely: **no scrolling and nothing cut off**.
   - It applies on any device and in portrait and landscape, including safe areas (camera cut-outs, gesture bars).
   - How:
     - render inside `PhoneFrame` (`src/components/timer/phone-frame.tsx`);
     - size with `h-full` and container query units (`cqmin`, `cqw`, `cqh`), never with `vh` / `dvh`;
     - let only coach-written text shrink or clamp.
   - It is enforced by `e2e/fit-screen.spec.ts`, which emulates safe areas on Chromium. Every new phone UI must be added to that test.

## Stack (verified 2026-10-21)

| Piece                                             | Version                                                           | Notes                                                                                                     |
| ------------------------------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Next.js (App Router, Turbopack, Cache Components) | 16.4.2                                                            | `proxy.ts` replaces `middleware.ts`                                                                       |
| React                                             | 19.3.1                                                            |                                                                                                           |
| TypeScript                                        | 6.0.x (strict)                                                    | TS 7 is stable but has no programmatic API until 7.1, which typescript-eslint and Next tooling need       |
| Node.js / pnpm                                    | 24.x / 12.14.0                                                    | `engines` and `packageManager` are pinned                                                                 |
| Tailwind CSS                                      | 4.3                                                               | Configured via the `@tailwindcss/turbopack` loader in `next.config.ts` (create-next-app default)          |
| next-intl                                         | 4.14                                                              | `es` (default, no prefix), `/en`, `/ca`; browser detection off                                            |
| ESLint                                            | **9.39** + `eslint-config-next` 16.4.2 + `eslint-config-prettier` | Not 10: `eslint-plugin-react`, `jsx-a11y` and `import` don't support ESLint 10 yet                        |
| Prettier                                          | 3.9 + `prettier-plugin-tailwindcss`                               |                                                                                                           |
| Vitest / Playwright                               | 5.0 / 1.64                                                        | Playwright projects: desktop, iPhone 17 (WebKit) and Pixel 10 (Chromium), each in portrait and landscape  |
| Better Auth (+ `@better-auth/drizzle-adapter`)    | 1.7.12 (verified 2026-10-23)                                      | Google only; `user.validateUserInfo` applies the coach rule; CLI package is `auth` (`pnpm auth:generate`) |
| Drizzle ORM / drizzle-kit + Neon                  | 0.45.4 / 0.31.11, `@neondatabase/serverless` 1.2                  | WebSocket `Pool` (Better Auth needs transactions); Neon branches `dev` and `production` (us-east-1)       |
| Zod                                               | 4.6                                                               | Planned for Phase 5: `qrcode`, `nanoid` (verify versions when installing)                                 |

## Commands

```bash
pnpm dev            # dev server on http://localhost:3000
pnpm build          # production build (also type-checks)
pnpm lint           # ESLint
pnpm typecheck      # next typegen + tsc --noEmit
pnpm format         # Prettier write (format:check to verify)
pnpm test           # Vitest unit tests (test:watch, test:coverage)
pnpm test:e2e       # Playwright (builds and serves on port 3100)
pnpm check          # lint + typecheck + format:check + test
pnpm db:generate    # SQL migration from the Drizzle schema (drizzle/)
pnpm db:migrate     # apply migrations to the Neon dev branch (.env.local)
pnpm db:migrate:prod # apply migrations to Neon production (.env.production.local)
pnpm auth:generate  # regenerate src/db/schema/auth.ts with the Better Auth CLI
```

Run `pnpm check` before every commit and `pnpm test:e2e` before closing a phase.

## Project structure

```
messages/{es,en,ca}.json   # translations; es.json is the source of the types
e2e/                       # Playwright specs
docs/PLAN.md               # agreed plan (source of truth)
docs/DEVLOG.md             # phase-by-phase log
src/
  app/[locale]/            # all routes live under the locale segment
  components/              # React components (kebab-case files)
  i18n/                    # next-intl routing, navigation, request config
  lib/                     # framework-free logic, unit-tested (≥95% coverage enforced)
    timer/                 # schema (Zod) → timeline (segments + cues) → display state; run clock; session; tone; format; demos
    audio/                 # cue look-ahead planner and synthesized sound definitions
  browser/                 # thin browser adapters (Web Audio player, wake lock, fullscreen); covered by e2e + real devices
  hooks/                   # client hooks (useWorkoutRunner orchestrates the phone timer)
  components/timer/        # phone timer UI (ready screen, running view, controls, confirm dialog)
  app/[locale]/t/          # phone routes (dark layout, safe areas); /t/demo/[slug] for demo workouts
  lib/auth/coach-access.ts # pure coach access rule (hd=yaqbot.com; dev allowlist outside production)
  auth/                    # Better Auth wiring: server.ts (lazy getAuth) and client.ts
  db/                      # Drizzle client (lazy getDb) and schema/ (auth tables generated by the CLI)
  env.ts                   # Zod-validated server env, read lazily (builds need no secrets)
  app/[locale]/coach/      # coach area: sign-in, session check on the server, /coach/denied
  app/api/auth/[...all]/   # Better Auth route handler
  proxy.ts                 # next-intl locale middleware
  global.ts                # next-intl type augmentation
drizzle/                   # SQL migrations (committed)
auth.cli.ts                # entry point for the Better Auth CLI only
```

Planned (see PLAN.md §6): routes `/t` and `/t/[code]`, workout presets and shares (Phase 5).

## Environments and branches

| Git branch | Vercel     | URL                                                                                  | Neon branch  |
| ---------- | ---------- | ------------------------------------------------------------------------------------ | ------------ |
| `dev`      | Preview    | `https://crossfit-box-timer-git-dev-marcsanz-dev.vercel.app` (Vercel Authentication) | `dev`        |
| `main`     | Production | `https://crossfit-box-timer.vercel.app`                                              | `production` |

- **Work happens on `dev`.** `main` is fast-forwarded from it once a change is verified on the Preview.
- **Env var names** are in `.env.example`.
- **`AUTH_EXTRA_EMAILS`** exists only in `.env.local` and in Vercel Preview (branch `dev`).

## Conventions

- **TypeScript strict** with `noUncheckedIndexedAccess`. No `any`. Validate external data (forms, DB jsonb, localStorage, URL) with Zod.
- **Server Components by default.** Add `"use client"` only where interactivity or browser APIs need it.
- **Keep logic out of components.** The timer engine, cue scheduling and the access rule are pure functions in `src/lib`, with unit tests next to them (`*.test.ts`).
- **Time is derived from timestamps** (`now − startedAt`), never from counting ticks.
- **No hard-coded UI strings.** Add every new key to all three message files, with `es.json` first. Use `Link` / `redirect` / `useRouter` from `@/i18n/navigation`, not from `next/*`.
- **Accessibility.** Semantic HTML, labelled controls, keyboard support, AA contrast.
- **Naming.** Files `kebab-case.ts(x)`, components `PascalCase`, functions `camelCase`.
- **Comments explain _why_,** not _what_.

## Decisions and gotchas

- **Spanish is always the default** (`localeDetection: false`). Changing language is an explicit choice through the switcher.
- **Access rule (Phase 4).** Server-side: `email_verified && hd === "yaqbot.com" && email ends with @yaqbot.com`.
  - `AUTH_EXTRA_EMAILS` (the developer's Gmail) applies only when `VERCEL_ENV !== "production"`.
  - Set it only in Development and Vercel Preview.
- **iPhone has no element fullscreen.** Use the Home Screen web app (iOS 26+). Use `navigator.audioSession.type = "playback"` so beeps play in Silent mode.
- **Stale type errors in `next build`:** if they show up after changing `tsconfig.json`, delete `.next/` (stale `.next/cache/.tsbuildinfo`).
- **next-intl `createMessagesDeclaration`** generates `messages/*.d.json.ts` (git-ignored). It needs `allowArbitraryExtensions` in `tsconfig.json`.
- **Phone robustness rule.** Every device unlock (audio, wake lock, fullscreen) is best-effort and wrapped. The clock must start and keep running even if all of them fail.
- **E2E with fake time.** Use `page.clock.install` + `pauseAt`, then `fastForward` + a short `runFor` (see `advance()` in `e2e/phone-timer.spec.ts`). Playwright's WebKit on Windows has no Web Audio.
- **Auth reads secrets lazily.** In server components, `await headers()` **before** calling `getAuth()`: arguments are evaluated first, and `headers()` is what stops prerendering at build time.
- **Previewing locally:** `.claude/launch.json` (git-ignored) defines `prod` (port 3200) and `dev` (port 3000) for the browser pane. Stop the server before `pnpm build`.
- **Dependency build scripts** are disabled in `pnpm-workspace.yaml` (`allowBuilds`). Prebuilt binaries are enough.

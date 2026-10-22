# CrossFit Box Timer

> 🚧 **Work in progress.** The current phase is tracked in [`docs/DEVLOG.md`](docs/DEVLOG.md).

A workout timer for the box **CrossFit Box**:

- Coaches sign in with their **@yaqbot.com** Google account and set up a workout on the computer: **For Time** (with time cap), **AMRAP** or **EMOM**.
- They send it to the phone mounted on the rig with a **QR code or a short code**.
- The phone shows a **full-screen, high-contrast timer with beeps** that runs the whole class without anyone touching it.

**Live URL:** **https://crossfit-box-timer.vercel.app** · **Try the phone timer now:** [/t/demo](https://crossfit-box-timer.vercel.app/t/demo) · **Languages:** Spanish (default), English, Catalan.

## How to use it

### As a coach (computer)

_Coming in Phase 5._ Sign in with Google → choose a mode → configure it → **Send to phone** → show the QR or the code.

### On the phone (rig)

Until the coach panel lands (Phase 5), open the built-in demo workouts at [`/t/demo`](https://crossfit-box-timer.vercel.app/t/demo).

| Phone       | Recommended                                                                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **iPhone**  | Install once (Share → **Add to Home Screen**), then open the app and **type the code**. Only the Home Screen app is truly full screen on iPhone. |
| **Android** | **Scan the QR** with the camera. Chrome goes full screen when you tap Start.                                                                     |

Tap **Start** once. That also enables sound and keeps the screen on. Then leave the phone alone.

## Run it locally

Requirements: **Node.js 24.x** and **pnpm 12** (`npm install -g pnpm@12`).

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

| Script                                         | What it does                                                                            |
| ---------------------------------------------- | --------------------------------------------------------------------------------------- |
| `pnpm build` / `pnpm start`                    | Production build / serve                                                                |
| `pnpm lint` · `pnpm typecheck` · `pnpm format` | Code quality                                                                            |
| `pnpm test`                                    | Unit tests (Vitest)                                                                     |
| `pnpm test:e2e`                                | End-to-end tests (Playwright; first run `pnpm exec playwright install chromium webkit`) |
| `pnpm check`                                   | Lint + typecheck + format check + unit tests                                            |

Environment variables: _added in Phase 4_ (`.env.example` will list them).

## Assumptions & decisions

Assumptions made instead of asking the client. Full reasoning is in [`docs/PLAN.md`](docs/PLAN.md).

1. **yaqbot.com is a Google Workspace domain** and `hola@yaqbot.com` is a real user in it. Its MX records point to Google.
2. **Access rule, enforced on the server:**
   - Only verified Google accounts whose ID token carries `hd = yaqbot.com` can configure workouts. An email that merely ends in `@yaqbot.com` is not enough, per Google's guidance.
   - **Developer testing:** a list of extra emails (`AUTH_EXTRA_EMAILS`) is set **only** in local Development and Vercel **Preview**, never in Production.
   - The code also ignores that list whenever `VERCEL_ENV` is `production`. So the live URL follows the @yaqbot.com rule 100%, even if the variable were set there by mistake.
3. **The coach starts the timer** by tapping **Start** on the phone just before the workout. That tap also unlocks audio and the wake lock.
4. **Sound** comes from the phone speaker by default; Bluetooth speakers are also supported.
5. **The phone may run on battery.** We still recommend charging it and disabling power-saving modes.
6. **iPhone:** beeps play even in Silent mode. The trade-off is that other audio on that same phone (for example music) is paused, so music should play from another device.
7. **After downloading the workout, the phone doesn't need the network.** A reload mid-workout resumes at the right second.
8. **Presets belong to each coach.** Every coach can browse and duplicate colleagues' presets, for example to cover a class; only the owner can edit or delete them.
9. **Spanish is the default language;** English and Catalan are an explicit choice. Yaqbot's customers are Spanish speakers.
10. **One phone per class.** No multi-screen sync, no remote start, no round counting on the phone.
11. **Hosting:** Vercel Hobby is for non-commercial use. That fits an unpaid take-home exercise; a real deployment for the box would move to a paid plan or Yaqbot's own infrastructure.

## How I built this with Claude Code

_Expanded at delivery._ Short version so far:

- **Plan first.** Claude read the brief and asked clarifying questions. It researched every risky topic against current official docs, with dates, and drafted [`docs/PLAN.md`](docs/PLAN.md). No code was written until I approved the plan.
- **[`CLAUDE.md`](CLAUDE.md)** holds the working rules, stack, commands and conventions, so every session starts with the same context.
- **Phases with acceptance criteria.** Each phase ends with checks, a [`docs/DEVLOG.md`](docs/DEVLOG.md) entry (what I asked, what broke, what changed) and my approval before the next one.
- **Tests:** unit tests for the timer logic, Playwright on emulated iPhone and Android in both orientations, and real devices (my Android and a friend's iPhone).

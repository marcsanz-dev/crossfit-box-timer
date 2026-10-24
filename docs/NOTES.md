# Delivery notes

_Draft. A half-page summary of [`DEVLOG.md`](DEVLOG.md)._

## What I asked the AI

I used Claude Code as the engineer and kept the product decisions, the accounts and the secrets.

- **A plan first, no code.** It restated the brief, asked the open questions, and checked the risky topics in current official docs: iPhone fullscreen, the Silent switch, the wake lock and domain-restricted Google sign-in.
- **Then phases, each closed with tests, a log entry and my OK:**
  - the timer engine as pure, tested logic;
  - the phone screen and deploy;
  - @yaqbot.com sign-in enforced on the server;
  - the coach panel and sending to the phone;
  - presets, an installable app and offline reloads;
  - polish and accessibility.

## What broke

- **Real phones beat the emulators.** On my Android, the screens were taller than the display (the notch padding was added on top of a full-height layout), exercise lists were cut off, and the controls covered the exercises.
- **WebKit lost early input.** A first tap on Start, or a typed code, did nothing before the page hydrated.
- **Claude's own mistakes:**
  - wrong expected values in tests;
  - a contrast test that passed falsely;
  - an env file that silently pointed local builds at the production database.

## What I changed

- **A fit-the-screen rule:** no scrolling, both orientations, notches included. It is written down and enforced by a test that emulates notches. Each bug was reproduced in a test before it was fixed.
- **Robustness by design:**
  - time comes from timestamps;
  - audio, wake lock and fullscreen are best-effort, so the clock always runs;
  - controls stay disabled until the page is ready;
  - outages show a retry screen instead of a blank page.
- **The share flow, after my review:** one link to paste into WhatsApp or open here, a QR beside it, and "Send to phone" on every saved workout.

# Real-device tests

Emulators can't confirm sound, the wake lock or battery behaviour, so these runs are done on real phones against production: **https://crossfit-box-timer.vercel.app**.

Fill in one table per device. Result: ✅ works · ⚠️ works with a caveat (write it) · ❌ fails (write what happened).

## Device info

|                | Android (developer) | iPhone (friend)                  |
| -------------- | ------------------- | -------------------------------- |
| Model          |                     |                                  |
| OS version     |                     |                                  |
| Browser / mode | Chrome              | Safari tab, then Home Screen app |
| Date           |                     |                                  |

## A. Quick checks (≈5 min) — demo `/t/demo/quick`

| #   | Check                                                           | How                                                                                          | Android | iPhone |
| --- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ------- | ------ |
| A1  | Start works with one tap                                        | Tap **Empezar**                                                                              |         |        |
| A2  | Prep beeps 3-2-1 + long "go" beep                               | Listen during the 5 s prep                                                                   |         |        |
| A3  | Every interval: 3-2-1 + long beep; final horn at the end        | Listen until "FIN"                                                                           |         |        |
| A4  | Beeps are distinguishable and loud enough at ~3 m with music on | Step back 3 m                                                                                |         |        |
| A5  | Full screen                                                     | Android: no browser bars after Start. iPhone: compare the Safari tab and the Home Screen app |         |        |
| A6  | Readable at ~3 m, portrait and landscape                        | Rotate the phone                                                                             |         |        |
| A7  | Hidden controls                                                 | Tap → Pausar / Reanudar; Parar asks for confirmation                                         |         |        |
| A8  | Reload mid-workout resumes at the right second                  | Pull to refresh (or reopen) during round 2                                                   |         |        |
| A9  | **iPhone only:** beeps with the Silent switch ON                | Silent mode on, restart the demo                                                             | —       |        |
| A10 | Bluetooth speaker (if available)                                | Connect, run the demo, check that the first beep is not cut                                  |         |        |

## B. Full-session run (60 min, untouched)

Run the **Full hour** demo ([`/t/demo/full-hour`](https://crossfit-box-timer.vercel.app/t/demo/full-hour): EMOM 60 × 1:00, a beep every minute). **On battery, not plugged in**, with normal screen brightness, and without touching the phone after Start.

| #   | Check                                                          | Android | iPhone |
| --- | -------------------------------------------------------------- | ------- | ------ |
| B1  | The screen never turned off                                    |         |        |
| B2  | No beep was missed, and they stayed in sync with the digits    |         |        |
| B3  | Battery used in 60 min (%)                                     |         |        |
| B4  | Same with battery saver / Low Power Mode ON (15 min is enough) |         |        |

## C. iPhone installation

| #   | Check                                                         | Result |
| --- | ------------------------------------------------------------- | ------ |
| C1  | Share → Add to Home Screen; the app opens without Safari bars |        |
| C2  | The clock digits are bold (not thin)                          |        |
| C3  | The status bar and notch don't cover the clock or the header  |        |

## Notes

_Anything unexpected, with the step number._

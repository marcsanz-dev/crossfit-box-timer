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

## C. Installation

| #   | Check                                                                                             | Android | iPhone |
| --- | ------------------------------------------------------------------------------------------------- | ------- | ------ |
| C1  | From `/t`: Android **Install the app** button / iPhone Share → Add to Home Screen; stopwatch icon |         |        |
| C2  | The installed app opens without browser bars                                                      |         |        |
| C3  | A workout page added to the Home Screen opens **that workout** (iPhone)                           | —       |        |
| C4  | The clock digits are bold (not thin)                                                              |         |        |
| C5  | The status bar and notch don't cover the clock or the header                                      |         |        |

## D. Coach → phone, end to end (Phases 5–6)

| #   | Check                                                                                                      | Android | iPhone |
| --- | ---------------------------------------------------------------------------------------------------------- | ------- | ------ |
| D1  | Each mode (For Time, AMRAP, EMOM) sent from the desktop opens on the phone with the right timing and texts |         |        |
| D2  | Opening by QR, by a link pasted in WhatsApp, and by typing the code                                        |         |        |
| D3  | A saved workout sent with **Send to phone** from the list                                                  |         |        |
| D4  | Airplane mode after loading: the whole workout runs                                                        |         |        |
| D5  | Airplane mode, then **reload**: the page comes back and starts                                             |         |        |
| D6  | Demo texts follow the language (`/en/t/demo`, `/ca/t/demo`)                                                |         |        |

## Notes

_Anything unexpected, with the step number._

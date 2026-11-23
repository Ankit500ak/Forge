# FORGE — The System

A Solo Leveling–style gamified fitness app. **The System** issues daily and
weekly quests, tracks your level, Hunter Rank (E → S) and ability points —
and an on-device AI counts your real push-ups, squats and sit-ups through the
camera. Rewards are earned in **Gold**, spent in a **System Shop** on
real-life rewards you define yourself, and every transaction is sealed in a
**hash-chained, tamper-evident ledger**.

> No video ever leaves the device. All pose processing is on-device
> (MediaPipe). All progress is stored locally.

---

## Features

### The System (player progression)
- Status window: level, XP bar, Hunter Rank E → S with rank titles, HP/MP
  bars, five stats (STR / AGI / VIT / END / PER) and ability-point allocation
- Level-up moment and a separate full-screen Rank-Up ceremony
- Streak counter, 35-day quest calendar (cleared / missed / recovered /
  shielded / rested) and a 14-day XP graph in Records

### Quests
- **Daily Quest** — push-ups, sit-ups, squats and running, with targets that
  scale with your level
- **Weekly Quest** — weekly totals plus a 4-cleared-days requirement
- **Penalty Recovery Quest** — miss a day and the System offers a recovery
  quest to restore the record
- **Boss Quest** — completing the Weekly Quest earns a Dungeon Key; spend it
  on a one-day boss hunt (level-scaled target). Victory adds the boss's
  shadow to your Shadow Collection

### AI Training (real rep counting)
- Camera-based pose detection (MediaPipe Pose Landmarker, fully on-device)
- Counts push-ups (elbow angle), squats (knee angle) and sit-ups (hip angle)
  with a hysteresis state machine — half reps don't count
- Live skeleton overlay, phase indicator and joint-angle readout
- Counted reps flow straight into Daily Quest (and Boss Quest) progress
- Manual counter fallback when no camera is available

### Reward economy
- **Gold** — 1 per AI-counted rep applied to a quest, +50 daily claim,
  +150 weekly claim, +300 boss victory. Manual button taps don't pay —
  gold can't be farmed
- **System Shop** — default rewards (Cheat Meal Pass 500 G, Movie Night
  1000 G, Full Rest Day 2000 G) plus your own custom rewards at your own
  prices; purchases and redemptions are recorded
- **Loot drops** — 25% chance on a daily claim: Streak Shield (auto-protects
  a missed day), Double XP Elixir (next claim pays double XP), Rest Pass
  (a rested day with no penalty)
- **Titles** — earned from real records: Iron Fist (1,000 lifetime
  push-ups), Wolf Slayer (7-day streak), Monarch of Consistency (30-day
  streak), Shadow Collector (first boss), Gold Hunter (10,000 lifetime gold)

### The Ledger (security)
- Every gold earn/spend, item drop/use, purchase, key and title is an
  append-only block; each block's SHA-256 hash chains to the previous block
  and is HMAC-sealed with a per-device secret
- Balances are **derived from the ledger**, never stored — editing local
  storage cannot fake gold: one altered block breaks the chain, the app
  detects it on load, locks rewards and offers restore-to-last-valid-block
- In-app Ledger viewer shows chain status (Verified / Broken) and the
  latest blocks

### Legacy modules
Dashboard, calorie tracking with camera food detection, step counter,
inventory, leaderboard, rewards redeem, stats charts, auth, ML task
generator.

---

## Tech stack

- **Frontend:** Next.js + TypeScript + Tailwind CSS (fully static export)
- **Mobile:** Capacitor (Android project in `fitness-app-frontend/android/`)
- **AI:** MediaPipe Tasks Vision (Pose Landmarker lite) — model and WASM
  ship inside the app, loaded only on the Training route
- **State:** local-first `localStorage` (System state + ledger), Supabase on
  legacy screens

---

## Run the web app

```bash
cd fitness-app-frontend
npm install
npm run dev            # http://localhost:3000 — start at /system
```

Demo login: `demo@forge.com` / `demo123`

Production build (static export into `out/`):

```bash
npm run build
npx tsc --noEmit       # typecheck
```

---

## Build the Android APK

Everything below runs on **your own PC** (Windows commands shown; macOS /
Linux equivalents in brackets).

**Step 1 — Install JDK 17** (skip if `java -version` already shows 17):

```powershell
winget install Microsoft.OpenJDK.17
```

Close and reopen the terminal afterwards.

**Step 2 — Install Android Studio** from
<https://developer.android.com/studio> — it bundles the Android SDK.
(No commands needed if you build inside Android Studio: open the `android`
folder, then **Build → Build APK(s)**.)

**Step 3 — Point Gradle at the SDK.** In the project's `android` folder,
create a file named `local.properties` containing one line (adjust the user
name / path to your machine):

```properties
sdk.dir=C:\\Users\\YOUR_NAME\\AppData\\Local\\Android\\Sdk
```

**Step 4 — Build:**

```powershell
cd path\to\android
.\gradlew.bat assembleDebug
```

(macOS / Linux: `./gradlew assembleDebug`)

The first build downloads Gradle and dependencies — keep the internet on.

**Step 5 — Your APK:**

```
android\app\build\outputs\apk\debug\app-debug.apk
```

Copy it to your phone and install, or install over USB:

```powershell
adb install app\build\outputs\apk\debug\app-debug.apk
```

App identity: **Forge — The System**, package `com.fitnessrpg.app`,
debug-signed (fine for personal testing; a Play Store release needs your
own signing key).

If you changed the web code, refresh the Android copy first:

```bash
cd fitness-app-frontend
npm run build
npx cap sync android
```

---

## Repository layout

```
fitness-app-frontend/     The app (Next.js)
  app/system/             Status window, quests, shop, records
  app/training/           AI rep counter
  components/system/      System UI (shop, ledger viewer, modals)
  lib/system/             State, rep-counter, rewards, ledger (hash chain)
  android/                Capacitor Android project (APK build)
backend/                  Legacy API + ML models
SYSTEM_PLAN.md            Design/phase plan for the System
```

---

## A note on this GitHub copy

This repository was pushed through a connector that transfers **text files
only**. The code is complete, but these binary assets are **not** in the
GitHub copy:

- MediaPipe WASM (`public/mediapipe/wasm/`) — copied from the
  `@mediapipe/tasks-vision` npm package
- Pose model (`public/models/pose_landmarker_lite.task`) — Google's
  MediaPipe model download
- Rank artwork, screenshots, app icons, `gradle-wrapper.jar`

The full project including binaries is distributed as
`Forge-Android-Project-v2.zip` by the owner. The APK build above is
intended to run from that complete copy.

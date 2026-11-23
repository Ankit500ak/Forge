# FORGE — The System

A Solo-Leveling-style gamified fitness app. The System (route `/system`) issues
daily and weekly quests, tracks levels, Hunter Ranks (E → S) and ability
points, keeps a streak/records calendar with an XP graph, offers a penalty
recovery quest after a missed day, and counts real push-ups, squats and
sit-ups on-device with a MediaPipe pose model (route `/training`) — no video
ever leaves the device.

## Run (development)

```bash
npm install
npm run dev          # http://localhost:3000 — start at /system
```

Demo login: `demo@forge.com` / `demo123`. All System progress is stored
locally in the browser (`localStorage`, key `forge-system-state-v1`).

## Production build (web)

The app is a fully static export (`output: 'export'`):

```bash
NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS=1 npm run build
# static site lands in out/ — serve out/ with any static host
npx tsc --noEmit     # typecheck (next.config ignores TS errors during build)
```

MediaPipe WASM + the pose model live in `public/mediapipe/` and
`public/models/` and are copied into `out/`; the pose code chunk is
lazy-loaded only on `/training`.

## Android APK (Capacitor)

Requires JDK 17 and the Android SDK (`ANDROID_HOME` set, platform +
build-tools installed via `sdkmanager`).

```bash
npm run build                       # refresh out/
npx cap sync android                # copy web assets into android/
# CAMERA permission is declared in android/app/src/main/AndroidManifest.xml
cd android && ./gradlew assembleDebug
# APK: android/app/build/outputs/apk/debug/app-debug.apk  (debug-signed, sideloadable)
```

`capacitor.config.ts`: appId `com.fitnessrpg.app`, appName
`Forge — The System`, webDir `out`.

---

# FORGE - Gamified Fitness App (original dashboard app)

A React-based gamified fitness application where users level up their fitness journey by converting workouts into stat points and collecting legendary equipment.

## Features

### 1. Authentication
- **Sign Up**: New users start at F rank with 0 stat points
- **Login**: Demo credentials available (demo@forge.com / demo123)
- **Persistent Sessions**: User data saved in localStorage

### 2. Dashboard (Home)
- **Real-time Stats Overview**: Total XP, Weekly XP, Stat Points, Current Level
- **Level Progress Bar**: Visual representation of progress to next level
- **XP Growth Chart**: Line chart showing weekly XP progression
- **Overall Stats Chart**: Bar chart displaying Strength, Cardio, Agility, and Health stats
- **Detailed Metrics**: Quick-view cards for all four stat categories

### 3. Stats Page
- **Performance Radar Chart**: Visual comparison of all fitness metrics (Strength, Cardio, Agility, Health)
- **Strength Training**: Bar chart comparing current vs goal lifts (Bench Press, Deadlift, Squat)
- **Cardio Performance**: Distance run, calories burned, and session tracking
- **Agility & Speed**: Max speed, reflex time, flexibility metrics
- **Health Metrics**: BMI, resting heart rate, sleep quality, stress levels
- **6-Month Progression**: Line chart showing progress across all stats
- **Achievements**: Visual badges for major milestones

### 4. Inventory System
- **6 Legendary Items**: Equipment and achievements to collect
- **Multiple Filters**: All Items, Equipment, Achievements
- **Progress Tracking**: View acquired vs total items
- **Equipment Stats**: Each item provides unique stat bonuses

### 5. Stat Points Redemption
- **Real-time Balance Display**: Current stat points available
- **Item Marketplace**: Browse and select equipment to redeem
- **Redemption History**: Track past purchases
- **Cost Overview**: Clear pricing for each item

### 6. Global Rankings
- **Three Leaderboards**: 
  - Global Rankings (Overall strength)
  - Strength-based Rankings
  - Cardio-based Rankings
- **Top 8 + Your Position**: See where you rank globally
- **Rank Tiers**: F, E, D, C, B, A, S tier system
- **Player Stats**: View other players' stats and achievements

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI Components**: React with Tailwind CSS v4
- **State Management**: React Context API
- **Charts**: Recharts library
- **Authentication**: Mock auth with localStorage persistence
- **Design**: Dark theme with orange/fire accents

## Project Structure

```
├── app/
│   ├── layout.tsx              # Root layout with providers
│   ├── page.tsx                # Authentication page
│   ├── dashboard/page.tsx       # Home dashboard
│   ├── stats/page.tsx          # Detailed stats with charts
│   ├── inventory/page.tsx      # Equipment inventory
│   ├── redeem/page.tsx         # Stat points redemption
│   └── ranking/page.tsx        # Global leaderboards
├── components/
│   ├── navigation.tsx          # Mobile bottom nav + desktop sidebar
│   ├── rank-badge.tsx          # Rank display component
│   ├── stat-card.tsx           # Quick stat display card
│   └── [other components]
├── lib/
│   ├── auth-context.tsx        # Authentication context
│   ├── app-context.tsx         # App state management
│   └── utils.ts                # Utility functions
└── app/globals.css             # Global styles & design tokens
```

## Stat Categories

### Strength
- Bench Press
- Deadlift
- Squat
- Total Lifted

### Cardio
- Distance Run (miles)
- Calories Burned
- Sessions Completed
- Longest Run

### Agility
- Max Speed (mph)
- Reflex Time (ms)
- Flexibility (%)

### Health
- BMI
- Resting Heart Rate (bpm)
- Sleep Quality (%)
- Stress Level (%)

## Rank Tiers

- **S Rank**: 45,000+ stat points (Elite)
- **A Rank**: 35,000+ stat points (Advanced)
- **B Rank**: 25,000+ stat points (Intermediate)
- **C Rank**: 15,000+ stat points (Developing)
- **D Rank**: 8,000+ stat points (Starting)
- **E Rank**: 3,000+ stat points (Beginner)
- **F Rank**: 0-2,999 stat points (Fresh Start)

## Design Features

### Mobile-First Approach
- Bottom navigation bar on mobile
- Desktop sidebar on larger screens
- Responsive grid layouts
- Touch-friendly button sizes

### Dark Theme
- Deep background (#0a0a0a)
- Orange accents (#ea580c)
- Smooth gradients and shadows
- Fire-inspired visual elements

### Interactive Charts
- Real-time data visualization
- Responsive to screen size
- Color-coded metrics
- Hover tooltips

## Usage

### Demo Login
```
Email: demo@forge.com
Password: demo123
```

### New Account
- Click "Signup"
- Enter your name, email, and password
- Start at F rank with 0 stat points
- Begin earning XP through the app

## Future Enhancements

1. **Blockchain Integration**: Store stat points in blockchain vault
2. **Backend API**: Real database integration
3. **Social Features**: Friend challenges and group competitions
4. **Workout Logging**: Manual workout entry and tracking
5. **Real-time Notifications**: Achievement alerts
6. **Mobile App**: Native mobile application
7. **AI Coach**: Personalized fitness recommendations

## Color Scheme

- **Primary Orange**: #ea580c (Fire theme)
- **Dark Background**: #0a0a0a
- **Card Background**: #1a1a1a
- **Text Primary**: #f2f2f2
- **Text Secondary**: #888888
- **Accent Colors**: Blue (#3b82f6), Green (#10b981), Yellow (#f59e0b), Purple (#a855f7)

## Performance Optimizations

- Server-side rendering with Next.js
- Optimized chart rendering with Recharts
- Lazy loading of components
- Efficient state management with Context
- CSS-in-JS with Tailwind for minimal bundle size

## Contributing

This is a demo project. For production use, implement:
- Proper authentication with OAuth/passwordless
- Real database (PostgreSQL, MongoDB, etc.)
- API endpoints for data persistence
- Error handling and validation
- Testing suite

## License

Open source for educational purposes.

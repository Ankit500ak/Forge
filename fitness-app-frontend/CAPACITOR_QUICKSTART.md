# 🚀 Capacitor Quick Start - Use Native Features

## Installation

Already done! Just run:

```bash
npm install
npm run build
```

Then follow [CAPACITOR_SETUP.md](./CAPACITOR_SETUP.md) to build iOS/Android apps.

---

## Available Native Features

### 📷 Camera (Take Photos & Record)

```tsx
import { useCapacitorCamera } from '@/lib/hooks/use-capacitor-camera'

export function MyComponent() {
  const { takePhoto, pickPhoto, photo, isLoading, error } = useCapacitorCamera()

  return (
    <div>
      <button onClick={takePhoto} disabled={isLoading}>
        📸 Take Photo
      </button>
      <button onClick={pickPhoto} disabled={isLoading}>
        🖼️ Pick from Gallery
      </button>
      {photo && <img src={photo} alt="photo" style={{ maxWidth: '100%' }} />}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  )
}
```

### 📍 Geolocation (GPS Tracking)

```tsx
import { useCapacitorDevice } from '@/lib/hooks/use-capacitor-device'

export function LocationTracking() {
  const { location, getCurrentLocation, watchLocation } = useCapacitorDevice()

  const startTracking = async () => {
    const watchId = await watchLocation((loc) => {
      console.log(`User moved to: ${loc.latitude}, ${loc.longitude}`)
    })
  }

  return (
    <div>
      <button onClick={getCurrentLocation}>📍 Get Current Location</button>
      <button onClick={startTracking}>🗺️ Start Location Tracking</button>
      {location && (
        <p>
          📍 Lat: {location.latitude.toFixed(4)}, Lng: {location.longitude.toFixed(4)}
        </p>
      )}
    </div>
  )
}
```

### 📊 Motion Sensors (Accelerometer for Steps)

```tsx
import { useCapacitorDevice } from '@/lib/hooks/use-capacitor-device'

export function StepDetection() {
  const { accelerometer, deviceInfo, isNative } = useCapacitorDevice()

  return (
    <div>
      <p>Running on: {deviceInfo?.platform} {deviceInfo?.osVersion}</p>
      <p>Native: {isNative ? '✅ Yes' : '❌ No (Web)'}</p>
      {accelerometer && (
        <div>
          <p>📈 Movement Detected:</p>
          <p>X: {accelerometer.x.toFixed(2)}</p>
          <p>Y: {accelerometer.y.toFixed(2)}</p>
          <p>Z: {accelerometer.z.toFixed(2)}</p>
        </div>
      )}
    </div>
  )
}
```

### 🔔 Local Notifications (Reminders & Alerts)

```tsx
import { useCapacitorNotifications } from '@/lib/hooks/use-capacitor-notifications'

export function QuestReminder() {
  const { sendNotification, scheduleNotification, cancelNotification } =
    useCapacitorNotifications()

  const sendQuestAlert = async () => {
    await sendNotification({
      title: '⚔️ New Quest!',
      body: '20-min run ready. +100 XP reward',
      id: 1,
      color: '#6366f1',
      vibrate: true,
    })
  }

  const sendInOneHour = async () => {
    const id = await scheduleNotification({
      title: '💪 Reminder',
      body: 'Time for your daily standup!',
      delaySeconds: 3600,
    })
    console.log('Notification scheduled:', id)
  }

  return (
    <div>
      <button onClick={sendQuestAlert}>📬 Send Notification Now</button>
      <button onClick={sendInOneHour}>⏰ Schedule in 1 Hour</button>
      <button onClick={() => cancelNotification(1)}>❌ Cancel Notification</button>
    </div>
  )
}
```

---

## 🎯 Real-World Usage Examples

### Workout Tracking Component

```tsx
'use client'

import { useCapacitorDevice } from '@/lib/hooks/use-capacitor-device'
import { useCapacitorNotifications } from '@/lib/hooks/use-capacitor-notifications'
import { useCapacitorCamera } from '@/lib/hooks/use-capacitor-camera'
import { useState } from 'react'

export function WorkoutTracker() {
  const { location, accelerometer } = useCapacitorDevice()
  const { sendNotification } = useCapacitorNotifications()
  const { takePhoto } = useCapacitorCamera()
  const [isTracking, setIsTracking] = useState(false)
  const [steps, setSteps] = useState(0)

  const startWorkout = async () => {
    setIsTracking(true)
    setSteps(0)

    // Send notification
    await sendNotification({
      title: '🏃 Workout Started!',
      body: 'Track your progress and earn XP!',
    })

    // Start location tracking for outdoor workouts
    // (implement in your component)
  }

  const logForm = async () => {
    // Take form check photo
    const photo = await takePhoto()
    if (photo) {
      // Send photo to backend for form analysis
      console.log('Form photo captured')
    }
  }

  const endWorkout = async () => {
    setIsTracking(false)
    await sendNotification({
      title: '✅ Workout Complete!',
      body: `Great job! You earned 150 XP`,
    })
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>💪 Workout Tracker</h2>

      {location && (
        <p>
          📍 Location: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
        </p>
      )}

      {accelerometer && (
        <p>📊 Movement: {accelerometer.z.toFixed(2)} units</p>
      )}

      <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
        <button onClick={startWorkout} disabled={isTracking}>
          ▶️ Start Workout
        </button>
        <button onClick={logForm}>📸 Check Form</button>
        <button onClick={endWorkout} disabled={!isTracking}>
          ⏹️ End Workout
        </button>
      </div>
    </div>
  )
}
```

---

## ⚙️ Configuration

### Enable/Disable Features

Edit `capacitor.config.ts`:

```ts
plugins: {
  Camera: {}, // Enable camera
  Geolocation: {}, // Enable GPS
  Motion: {}, // Enable accelerometer
  LocalNotifications: {}, // Enable notifications
  // Add/remove as needed
}
```

### Change App Info

Edit `capacitor.config.ts`:

```ts
const config: CapacitorConfig = {
  appId: 'com.fitnessrpg.app', // Change bundle ID
  appName: 'Fitness RPG', // Change app name
  // ...
}
```

---

## 🧪 Testing

### On Device (Real Phone)

```bash
# iOS
npm run capacitor:run:ios

# Android
npm run capacitor:run:android
```

### On Simulator/Emulator

```bash
# Build first
npm run build

# Sync native files
npm run capacitor:update

# Open editor
npm run capacitor:open:ios    # Xcode simulator
npm run capacitor:open:android # Android emulator
```

---

## ✅ Checklist for Your App

- [ ] Install dependencies: `npm install`
- [ ] Build web app: `npm run build`
- [ ] Open iOS: `npm run capacitor:open:ios`
- [ ] Test on iOS simulator
- [ ] Open Android: `npm run capacitor:open:android`
- [ ] Test on Android emulator
- [ ] Test camera functionality
- [ ] Test location tracking
- [ ] Test notifications
- [ ] Add app icon
- [ ] Prepare screenshots for stores
- [ ] Submit to App Store
- [ ] Submit to Google Play

---

**Your app is now ready to use native features!** 🎉

Need more help? Check [CAPACITOR_SETUP.md](./CAPACITOR_SETUP.md) for detailed setup instructions.

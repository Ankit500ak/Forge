# 📱 Capacitor Native App Setup Guide

Your Fitness RPG app is now configured with **Capacitor** - wrapping your Next.js web app as native iOS/Android apps while keeping all your web code intact.

## ✅ What's Configured

1. ✅ Capacitor core integration
2. ✅ Camera access (take photos, gallery)
3. ✅ Geolocation (GPS tracking for outdoor workouts)
4. ✅ Accelerometer (steps, motion detection)
5. ✅ Local notifications (quest reminders, achievements)
6. ✅ Device info detection
7. ✅ Ready for push notifications

## 🚀 Installation Steps

### **Step 1: Install Dependencies**

```bash
cd fitness-app-frontend
npm install
```

This installs:
- `@capacitor/core` - Core Capacitor
- `@capacitor/cli` - Build tools
- `@capacitor/ios` - iOS support
- `@capacitor/android` - Android support
- Camera, Geolocation, Motion, Notifications plugins

### **Step 2: Build the Web App**

```bash
npm run build
```

This creates the production build that will run in your native app.

### **Step 3: Initialize Native Projects**

Capacitor will create `ios/` and `android/` folders automatically.

---

## 🔧 Building for iOS (Mac Required)

### **Prerequisites**
- Mac with Xcode installed
- Xcode Command Line Tools
- CocoaPods

### **Setup iOS**

```bash
# Install if not already
npm run capacitor:build

# Open Xcode
npm run capacitor:open:ios
```

Then in Xcode:
1. Select "Fitness RPG" project in left panel
2. Go to **Signing & Capabilities**
3. Add your Apple Developer account
4. Select a team
5. Change Bundle Identifier if needed (com.fitnessrpg.app)
6. Click **▶️ Play** to build and run on simulator or device

### **Necessary Permissions (iOS)**
Add to `ios/App/App/Info.plist`:

```xml
<key>NSCameraUsageDescription</key>
<string>We need camera access to check your workout form</string>

<key>NSLocationWhenInUseUsageDescription</key>
<string>We need your location to track outdoor workouts</string>

<key>NSMotionUsageDescription</key>
<string>We need motion data to count your steps</string>

<key>NSLocalNetworkUsageDescription</key>
<string>We need local network access for app features</string>
```

---

## 🤖 Building for Android

### **Prerequisites**
- Android Studio installed
- JDK 11 or higher
- Android SDK (API 33+)
- Environment variables set:
  ```bash
  JAVA_HOME=/path/to/jdk
  ANDROID_SDK_ROOT=/path/to/android/sdk
  ```

### **Setup Android**

```bash
# Build and sync
npm run capacitor:build

# Open Android Studio
npm run capacitor:open:android
```

Then in Android Studio:
1. Wait for Gradle sync to complete
2. Select **Pixel 4a** (or any emulator) from the top dropdown
3. Click **▶️ Run 'app'**
4. App will build and run on emulator

### **Necessary Permissions (Android)**
Automatically added to `android/app/src/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

---

## 💻 Development Workflow

### **Live Reload Development**

For hot-reload during development:

```bash
# Terminal 1: Start Next.js dev server
npm run dev

# Terminal 2: Build and run on device (watches for changes)
npm run capacitor:run:ios
# or
npm run capacitor:run:android
```

Your app will reload when you save changes!

---

## 🎯 Using Native Features in Your Code

### **1. Take a Photo (for form checking)**

```tsx
'use client'
import { useCapacitorCamera } from '@/lib/hooks/use-capacitor-camera'

export function PhotoCapture() {
  const { takePhoto, photo } = useCapacitorCamera()

  return (
    <div>
      <button onClick={takePhoto}>Take Photo</button>
      {photo && <img src={photo} alt="captured" />}
    </div>
  )
}
```

### **2. Track Location (for outdoor runs)**

```tsx
'use client'
import { useCapacitorDevice } from '@/lib/hooks/use-capacitor-device'

export function LocationTracking() {
  const { location, getCurrentLocation, watchLocation } = useCapacitorDevice()

  return (
    <div>
      <button onClick={getCurrentLocation}>Get Location</button>
      {location && (
        <p>
          Lat: {location.latitude}, Lng: {location.longitude}
        </p>
      )}
    </div>
  )
}
```

### **3. Send Notifications (for reminders)**

```tsx
'use client'
import { useCapacitorNotifications } from '@/lib/hooks/use-capacitor-notifications'

export function NotificationExample() {
  const { sendNotification, scheduleNotification } = useCapacitorNotifications()

  const sendQuestReminder = async () => {
    await sendNotification({
      title: '⚔️ New Quest Available!',
      body: 'Complete a 20-minute workout to earn 100 XP',
      color: '#6366f1',
    })
  }

  const scheduleDaily = async () => {
    await scheduleNotification({
      title: '💪 Daily Standup',
      body: 'Time for your daily workout!',
      delaySeconds: 3600, // 1 hour from now
    })
  }

  return (
    <div>
      <button onClick={sendQuestReminder}>Send Notification</button>
      <button onClick={scheduleDaily}>Schedule Reminder</button>
    </div>
  )
}
```

### **4. Track Device Motion (for step counter)**

```tsx
'use client'
import { useCapacitorDevice } from '@/lib/hooks/use-capacitor-device'

export function StepCounter() {
  const { accelerometer, isNative } = useCapacitorDevice()

  return (
    <div>
      <p>Native: {isNative ? '✅' : '❌'}</p>
      {accelerometer && (
        <p>
          Movement: X={accelerometer.x} Y={accelerometer.y} Z={accelerometer.z}
        </p>
      )}
    </div>
  )
}
```

---

## 📦 Publishing to App Stores

### **iOS App Store**

1. **Increase version** in Xcode:
   - Select Project → General → Version/Build

2. **Create App Store listing**:
   - Go to App Store Connect
   - Create new app entry
   - Fill in app details, screenshots, description

3. **Archive and upload**:
   ```bash
   # In Xcode
   Product → Archive
   # Then upload to App Store Connect
   ```

### **Google Play Store**

1. **Create release in Android Studio**:
   ```bash
   # In Android Studio Terminal:
   ./gradlew bundleRelease
   ```

2. **Create Play Store listing**:
   - Go to Google Play Console
   - Create new app
   - Fill in app details, screenshots, description

3. **Upload bundle**:
   - Select `android/app/build/outputs/bundle/release/app-release.aab`
   - Upload to Play Console

---

## 🐛 Troubleshooting

### **Can't open Xcode**
```bash
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
```

### **Android build fails**
```bash
cd android
./gradlew clean
cd ..
npm run capacitor:build
```

### **App won't hot reload**

Check that:
1. Device is on same WiFi as computer
2. Uncomment and update `server.url` in `capacitor.config.ts`:
```ts
server: {
  url: 'http://192.168.1.6:3000', // Your machine IP
  cleartext: true,
},
```

### **Permissions not working**
- iOS: Check `Info.plist` has all keys
- Android: Rebuild with `npm run capacitor:build`
- Test permissions prompt on first app launch

### **Camera/Location not working**
- Device: Grant permissions when prompted
- Simulator/Emulator: Manually grant in Settings → Permissions
- iOS: May need to trust certificate (Settings → General → VPN & Device Management)

---

## 📚 Available Scripts

```bash
npm run build                 # Build web app
npm run dev                   # Dev server (http://localhost:3000)
npm run capacitor:build       # Build web + sync native
npm run capacitor:open:ios    # Open Xcode
npm run capacitor:open:android # Open Android Studio
npm run capacitor:run:ios     # Build + run on iOS simulator
npm run capacitor:run:android # Build + run on Android emulator
npm run capacitor:update      # Update Capacitor plugins
```

---

## 🎓 Next Steps

1. **Build locally** and test on simulator/emulator
2. **Test all features**: camera, location, notifications
3. **Add app icon** (generated or designed)
4. **Create screenshots** for app stores
5. **Write app description** and privacy policy
6. **Submit to iOS App Store** and **Google Play Store**

---

## 📖 Resources

- [Capacitor Docs](https://capacitorjs.com/docs)
- [Capacitor Plugins](https://capacitorjs.com/docs/plugins)
- [iOS App Store Connect](https://appstoreconnect.apple.com/)
- [Google Play Console](https://play.google.com/console)
- [Capacitor Camera Plugin](https://capacitorjs.com/docs/apis/camera)
- [Capacitor Geolocation Plugin](https://capacitorjs.com/docs/apis/geolocation)

---

Your app is ready to become a native iOS and Android app! 🚀

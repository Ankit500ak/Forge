# 📱 Build & Install APK on Android Phone

## Step-by-Step Instructions

### **Step 1: Build the Web App** (5 minutes)

```bash
cd fitness-app-frontend
npm install
npm run build
npm run capacitor:build
```

### **Step 2: Build the APK** (10-15 minutes)

```bash
cd android
./gradlew assembleDebug
```

**On Windows, if you get an error, try:**
```bash
gradlew.bat assembleDebug
```

The build will take a few minutes. Wait for it to complete.

### **Step 3: Find the APK File**

Once the build completes, the APK will be at:

```
fitness-app-frontend/android/app/build/outputs/apk/debug/app-debug.apk
```

### **Step 4: Transfer APK to Phone**

**Option A: Using USB Cable (Fastest)**
1. Connect your Android phone to computer with USB cable
2. Enable **USB Debugging** on phone:
   - Settings → About Phone → tap Build Number 7 times
   - Settings → Developer Options → Enable USB Debugging
3. Copy the APK file to phone:
   ```bash
   adb push android/app/build/outputs/apk/debug/app-debug.apk /sdcard/Download/
   ```

**Option B: Email/Cloud (Easier)**
1. Find the APK file in Windows Explorer:
   - `C:\Users\Admin\Desktop\FORGE\fitness-app\fitness-app-frontend\android\app\build\outputs\apk\debug\app-debug.apk`
2. Email it to yourself or upload to Google Drive
3. Download on phone

**Option C: Direct Install (Simplest)**
1. Copy the APK to a folder you can access
2. Open file manager on phone
3. Navigate to the APK
4. Tap to install

### **Step 5: Install & Run**

1. On phone, go to **Settings → Apps → Special App Access → Install Unknown Apps**
2. Enable for your file manager or browser
3. Navigate to the APK file on your phone
4. Tap **Install**
5. Launch the app from home screen!

---

## ⚡ Quick Commands

Copy and paste these commands one by one:

```bash
# These commands are run in PowerShell in the fitness-app-frontend folder

# 1. Install dependencies
npm install

# 2. Build web app
npm run build

# 3. Sync Capacitor
npm run capacitor:build

# 4. Build Android APK
cd android
./gradlew assembleDebug
cd ..

# APK is now ready at:
# android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 📍 Where to Find the APK

After building, open Windows Explorer and navigate to:

```
C:\Users\Admin\Desktop\FORGE\fitness-app\fitness-app-frontend\android\app\build\outputs\apk\debug\app-debug.apk
```

This is the file you'll transfer to your phone.

---

## 🐛 Troubleshooting

### **Error: gradle not found**
Make sure you're in the `android` folder:
```bash
cd fitness-app-frontend/android
./gradlew assembleDebug
```

### **Error: Java not found**
Install Java JDK 11+:
- Download from: [https://www.oracle.com/java/technologies/javase-jdk11-downloads.html](https://www.oracle.com/java/technologies/javase-jdk11-downloads.html)
- Set `JAVA_HOME` environment variable

### **Build hangs or takes too long**
Just wait! First build can take 5-10 minutes. Subsequent builds are faster.

### **APK won't install**
- Enable "Unknown Sources" in Settings
- Try different USB cable or transfer method
- Check phone has 100MB+ free space

### **Phone can't find APK file**
Transfer using Google Drive or email instead of USB.

---

## ✅ Checklist

- [ ] Run `npm install`
- [ ] Run `npm run build`
- [ ] Run `npm run capacitor:build`
- [ ] Run `cd android && ./gradlew assembleDebug`
- [ ] Wait for build to complete
- [ ] Find APK at: `android/app/build/outputs/apk/debug/app-debug.apk`
- [ ] Transfer to phone
- [ ] Install on phone
- [ ] Launch and test!

---

## 🎉 You Did It!

Once installed, your fitness app will work just like a native Android app with:
- ✅ Camera access
- ✅ Location tracking
- ✅ Motion sensors
- ✅ Notifications
- ✅ Full offline support

Enjoy! 🚀

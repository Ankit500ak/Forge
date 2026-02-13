import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fitnessrpg.app',
  appName: 'Fitness RPG',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    // For development on device, uncomment and set to your machine IP:
    // url: 'http://192.168.1.6:3000',
    // cleartext is needed for http on Android
    // cleartext: true,
  },
  ios: {
    path: 'ios'
  },
  android: {
    path: 'android'
  },
  plugins: {
    Camera: {},
    Geolocation: {},
    Motion: {},
    Device: {},
    LocalNotifications: {},
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;

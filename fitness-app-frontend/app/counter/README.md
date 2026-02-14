# Pushup Counter Demo

This page demonstrates the `PushupCounter` component and how to test it in the browser or on-device.

Quick start (from `fitness-app-frontend`):

```powershell
# install and run dev server
npm install
npm run dev

# Open in browser:
# http://localhost:3000/counter
```

Testing tips

- Place your phone flat on your chest while doing pushups and press Start.
- If the device does not support motion events in the browser, use the `+1 (simulate)` button to emulate reps.
- To test native Capacitor motion, build and run the Android app after adding the platform and syncing web assets.

Troubleshooting

- If counts are noisy, increase the sensitivity slider or reposition the phone.
- On desktops without motion sensors, only simulation will work.

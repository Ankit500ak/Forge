# Camera System Debugging Guide

## Overview

This guide provides comprehensive debugging strategies for the camera food detection system. Use the techniques below to diagnose and resolve issues.

---

## Part 1: Quick Diagnostics

### Step 1: Check Browser Console (F12)

Open DevTools and check for error messages:

```javascript
// Press F12 to open DevTools
// Click "Console" tab
// Look for RED error messages
```

**Common Console Errors:**

| Error | Cause | Solution |
|-------|-------|----------|
| `NotAllowedError: Permission denied` | Camera permission not granted | Grant permission in browser settings |
| `NotFoundError: requested device not found` | Device has no camera | Use device with camera or emulator |
| `TypeError: Cannot read property 'srcObject'` | Video ref not properly initialized | Refresh page, check React mounting |
| `SyntaxError: Unexpected token 'S'` | Server returned HTML instead of JSON | Restart backend server |

---

### Step 2: Check Network Tab (F12)

Monitor API requests:

```
1. Open DevTools
2. Click "Network" tab
3. Perform camera capture
4. Look for API requests:
   - POST /api/camera/capture (should be 200)
   - Response should be valid JSON
   - No HTML error pages
```

**Good Response:**
```
Status: 200 OK
Content-Type: application/json
Response: { "status": "success", "detection": { ... } }
```

**Bad Response:**
```
Status: 500 Internal Server Error
Content-Type: text/html
Response: <html>Server Error...</html>  ← This causes "Unexpected token 'S'"
```

---

## Part 2: Common Issues & Solutions

### Issue: "Camera not found"

**Symptoms:**
- Permission dialog never appears
- Error: "NotAvailableError: camera not found"

**Diagnosis:**
```javascript
// In browser console:
navigator.mediaDevices.enumerateDevices()
  .then(devices => {
    const cameras = devices.filter(d => d.kind === 'videoinput');
    console.log('Available cameras:', cameras);
  });
```

**Solutions:**
1. **Ensure device has camera:** Run above code to check
2. **Use different browser:** Try Chrome, Firefox, Safari
3. **Use HTTPS or localhost:** Camera API requires secure context
4. **Check OS permissions:** 
   - macOS: System Preferences > Security & Privacy > Camera
   - Windows: Settings > Privacy & Security > Camera
   - Android: Settings > Apps > Permissions > Camera

---

### Issue: "Unexpected token 'S', Server act... is not valid JSON"

**Root Cause:** Backend is returning HTML error page instead of JSON

**Quick Fix:**
```javascript
// In browser console:
// Check what server is actually returning:
fetch('/api/camera/settings')
  .then(r => r.text())  // Get raw text, not JSON
  .then(text => console.log(text.substring(0, 200)));  // Log first 200 chars
```

**Solutions:**
1. **Restart backend server:**
   ```bash
   cd backend
   npm start
   ```

2. **Check backend logs:**
   ```bash
   # Look for error messages
   # Common issues:
   # - Port 3001 already in use
   # - Database connection failed
   # - Missing dependencies
   ```

3. **Verify backend is accessible:**
   ```bash
   # In terminal:
   curl http://localhost:3001/api/camera/health-check
   
   # Should output JSON, not HTML
   ```

---

### Issue: Blank/Black Video Feed

**Symptoms:**
- Video element exists but shows black screen
- Camera light may or may not be on

**Diagnosis:**
```javascript
// In browser console:
const video = document.querySelector('video');
console.log('Video ref:', video);
console.log('Video readyState:', video.readyState);  // Should be 2-4
console.log('Video dimensions:', video.videoWidth, video.videoHeight);
console.log('Has stream:', video.srcObject ? 'YES' : 'NO');
```

**Solutions:**
1. **Wait for camera focus:** Takes 2-3 seconds sometimes
2. **Refresh page:** `Ctrl+R` or `Cmd+R`
3. **Check permissions:** Did you grant camera access?
4. **Test in device settings:**
   - Android: Settings > Apps > [App] > Permissions > Camera must be ON
   - iOS: Settings > [App] > Camera must be ON
5. **Try different browser:** Safari, Chrome, Firefox

---

### Issue: "Canvas is not available" or Capture Fails

**Symptoms:**
- Clicking capture button shows error
- Console: "Canvas not available"

**Diagnosis:**
```javascript
// In browser console:
const canvas = document.querySelector('canvas');
console.log('Canvas found:', canvas ? 'YES' : 'NO');
console.log('Canvas dimensions:', canvas?.width, canvas?.height);
const video = document.querySelector('video');
console.log('Video ready:', video.readyState === 4 ? 'YES' : 'NO');
```

**Solutions:**
1. **Close modals:** Close any open menus/modals first
2. **Wait for video:** Make sure video has loaded (black screen fades)
3. **Refresh page:** Clear any stuck state
4. **Check for JavaScript errors:** F12 > Console tab

---

### Issue: Settings Modal Won't Open

**Symptoms:**
- ⚙️ icon visible but clicking does nothing
- No modal appears

**Diagnosis:**
```javascript
// In browser console:
// Check React component state
const settingsBtn = document.querySelector('[aria-label*="settings"]');
console.log('Settings button:', settingsBtn);

// Try clicking manually
settingsBtn?.click();
```

**Solutions:**
1. **Check console for errors:** F12 > Console (RED errors?)
2. **Restart frontend:**
   ```bash
   # Stop frontend (Ctrl+C)
   # Run again:
   npm run dev
   ```
3. **Clear browser cache:**
   ```
   Ctrl+Shift+Delete (Windows/Linux)
   Cmd+Shift+Delete (Mac)
   ```
4. **Check for JavaScript errors:** Look for red X icons in console

---

### Issue: Detection Result Won't Display

**Symptoms:**
- Capture completes
- Loading spinner disappears
- No result modal appears

**Diagnosis:**
```javascript
// In browser console, check these conditions:
console.log('Video ready:', document.querySelector('video')?.readyState === 4);
console.log('Canvas exists:', !!document.querySelector('canvas'));

// Test capture manually:
// Click Network tab, then click Capture button
// Look for POST /api/camera/capture request
// Check Response tab - should show detection result
```

**Check Response Format:**
```json
{
  "status": "success",
  "detection": {
    "detected_food": "butter_chicken",
    "confidence": 0.92,
    "nutrition": { ... }
  }
}
```

**Solutions:**
1. **Ensure backend is running:** Check terminal where backend started
2. **Check backend logs for errors:**
   ```
   Look for:
   - "Food detection error"
   - "ML model failed"
   - "Cannot process image"
   ```
3. **Verify image was captured:** Check `/backend/uploads/camera-captures/` directory
4. **Check image size:** Should be < 10MB
5. **Restart backend and frontend:**
   ```bash
   # Backend
   cd backend
   npm start
   
   # Frontend (new terminal)
   cd fitness-app-frontend
   npm run dev
   ```

---

## Part 3: Advanced Debugging

### Enable Verbose Logging

Add `console.log` calls to track execution:

```typescript
// In CameraFoodDetection.tsx handleCapture() function
const handleCapture = async () => {
    console.log('[CAPTURE] Starting capture...');
    
    try {
        setIsLoading(true);
        
        console.log('[CAPTURE] Calling capturePhoto()');
        const result = await camera.capturePhoto(useAutoDetect, confidenceThreshold);
        
        console.log('[CAPTURE] Result:', result);
        
        if (result) {
            console.log('[CAPTURE] Setting detection result');
            setDetectionResult(result.detection);
            setLastCapturedImage(result.capture.id);
        } else {
            console.warn('[CAPTURE] No result returned');
        }
    } catch (error) {
        console.error('[CAPTURE] Error:', error);
    } finally {
        setIsLoading(false);
    }
};
```

### Monitor Network Requests

Use browser DevTools to monitor all requests:

```
1. Open DevTools (F12)
2. Go to Network tab
3. Filter by: XHR (XMLHttpRequest)
4. Perform camera actions
5. Click each request to see:
   - URL
   - Status Code
   - Request Headers
   - Response Body
   - Timing
```

### Check API Response Timing

```javascript
// In browser console:
const start = Date.now();
fetch('/api/camera/capture', {
    method: 'POST',
    body: new FormData()  // Your form data
})
    .then(r => r.json())
    .then(data => {
        console.log('Response time:', Date.now() - start, 'ms');
        console.log('Data:', data);
    });
```

### Simulate Network Error

Test error handling:

```javascript
// In browser console:
// Simulate offline
window.navigator.onLine = false;

// Try to capture - should show error
// Then turn back online:
window.navigator.onLine = true;
```

---

## Part 4: Backend Debugging

### Check Backend Logs

```bash
# When running backend with: npm start
# Look for these log patterns:

# Good:
"✅ Camera API initialized"
"🎯 Detection completed: butter_chicken (92%)"

# Bad:
"❌ Detection failed"
"⚠️  ML model not loaded"
"🚨 Port 3001 already in use"
```

### Test Backend API Directly

```bash
# Test health check
curl -v http://localhost:3001/api/camera/health-check

# Test settings
curl -v http://localhost:3001/api/camera/settings?useCase=food

# Should see:
# HTTP/1.1 200 OK
# Content-Type: application/json
```

### Check File Uploads

```bash
# Captures are saved here:
ls -la backend/uploads/camera-captures/

# Should see .jpg/.png files from captures
# If empty, the upload might be failing
```

### Database Connection

```bash
# If using Supabase/PostgreSQL:
# Check connection status:
node backend/check-user.js

# Should output connection info
```

### Python ML Model

If using Python for ML:

```bash
# Test Python directly:
python3 backend/services/mlTaskGenerator.py

# Or test the TensorFlow model:
cd backend
python3 -c "
import tensorflow as tf
print('TensorFlow version:', tf.__version__)
# Should print version without errors
"
```

---

## Part 5: Performance Diagnostics

### Measure Load Times

```javascript
// In browser console:
performance.mark('camera-init-start');

// ... perform camera action ...

performance.mark('camera-init-end');
performance.measure('camera-init', 'camera-init-start', 'camera-init-end');
performance.getEntriesByName('camera-init').forEach(entry => {
    console.log('Load time:', entry.duration, 'ms');
});
```

### Check Memory Usage

```javascript
// In browser console:
if (performance.memory) {
    console.log('Memory usage:', {
        used: performance.memory.usedJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit,
        percent: (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit * 100).toFixed(2) + '%'
    });
}
```

### Monitor FPS

```javascript
// In browser console:
let frames = 0;
let lastTime = Date.now();

function measureFPS() {
    frames++;
    const now = Date.now();
    if (now - lastTime >= 1000) {
        console.log('FPS:', frames);
        frames = 0;
        lastTime = now;
    }
    requestAnimationFrame(measureFPS);
}

measureFPS();  // Should see 24-30 FPS for smooth video
```

---

## Part 6: System Reports

### Generate Debug Report

```javascript
// Copy this to browser console and run:
console.log('=== CAMERA SYSTEM DEBUG REPORT ===');
console.log('Timestamp:', new Date().toISOString());
console.log('Browser:', navigator.userAgent.substring(0, 100));
console.log('Device:', navigator.deviceMemory, 'GB RAM');
console.log('');
console.log('Camera Status:');
navigator.mediaDevices.enumerateDevices()
    .then(devices => {
        const cameras = devices.filter(d => d.kind === 'videoinput');
        console.log('- Found cameras:', cameras.length);
        cameras.forEach((cam, i) => {
            console.log(`  ${i+1}. ${cam.label || 'Unknown'}`);
        });
    });

console.log('');
console.log('API Endpoints:');
['health-check', 'settings', 'capture'].forEach(endpoint => {
    fetch(`/api/camera/${endpoint}${endpoint === 'capture' ? '' : ''}`)
        .then(r => ({ endpoint, status: r.status, ok: r.ok }))
        .then(info => console.log(`- ${info.endpoint}: ${info.status}`))
        .catch(e => console.log(`- ${endpoint}: ERROR (${e.message})`));
});
```

---

## Part 7: Escalation Path

If issues persist:

1. **Check logs thoroughly:**
   - Browser Console (F12)
   - Backend terminal output
   - Database logs (if applicable)

2. **Restart everything:**
   ```bash
   # Kill backend
   Ctrl+C in backend terminal
   
   # Kill frontend
   Ctrl+C in frontend terminal
   
   # Restart both
   cd backend && npm start
   # New terminal:
   cd fitness-app-frontend && npm run dev
   ```

3. **Clear all caches:**
   ```bash
   # Browser cache
   Ctrl+Shift+Delete
   
   # npm cache (optional)
   npm cache clean --force
   ```

4. **Check system resources:**
   - Is disk full? Check with `df` (macOS/Linux) or `Disk Management` (Windows)
   - Is RAM available? Check with `free -h` or Task Manager
   - Is CPU overloaded? Check with `top` or Task Manager

5. **Test in different browser:**
   - Chrome, Firefox, Safari, Edge
   - Some issues are browser-specific

6. **Test on different device:**
   - Desktop vs mobile
   - Different OS (Windows, macOS, Linux)
   - Different camera hardware

---

## Part 8: Logging Best Practices

### Add Debug Mode

Modify `CameraFoodDetection.tsx`:

```typescript
// Add at top of file:
const DEBUG = true;  // Set to false in production

const log = (msg: string, data?: any) => {
    if (DEBUG) {
        console.log(`[CAMERA] ${msg}`, data || '');
    }
};

// Use throughout:
log('Camera initialized');
log('Capture result:', result);
```

### Log API Responses

```typescript
const response = await fetch('/api/camera/capture', {
    method: 'POST',
    body: formData
});

if (DEBUG) {
    const clone = response.clone();
    console.log('API Response:', {
        status: response.status,
        headers: Object.fromEntries(response.headers),
        body: await clone.json()
    });
}
```

---

## Quick Reference

| Problem | Check | Fix |
|---------|-------|-----|
| No camera access | Browser console for `NotAllowedError` | Grant permission in settings |
| JSON parsing error | Backend returning HTML | Restart backend server |
| Black video feed | Check video.readyState in console | Wait 2-3 seconds, refresh |
| Modal won't open | Console for JavaScript errors | Restart frontend server |
| No detection result | Check Network tab > Response | Verify backend running |
| Performance issue | Check FPS with code above | Reduce resolution or close other apps |

---

**Last Updated:** February 15, 2024
**Status:** Production Ready

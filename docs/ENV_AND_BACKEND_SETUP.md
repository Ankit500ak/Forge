# Environment & Backend Setup Guide

## 📝 Environment Variables

### **Development (.env.local)**

```env
# Local backend
NEXT_PUBLIC_API_URL=http://localhost:5000/api

# Or with ngrok tunnel (for mobile testing)
NEXT_PUBLIC_API_URL=https://your-ngrok-url.ngrok.io/api
```

### **Production (.env.production)**

```env
# Production backend
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
```

---

## 🔗 API Client Setup

### **File: `@/lib/api-client.ts`**

```typescript
import axios, { AxiosError, AxiosInstance } from "axios";

const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ Add request interceptor for debugging
apiClient.interceptors.request.use((config) => {
  console.log("📤 API Request:", config.method?.toUpperCase(), config.url);
  return config;
});

// ✅ Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log("✅ API Response:", response.status, response.data);
    return response;
  },
  (error: AxiosError) => {
    console.error("❌ API Error:", {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });
    return Promise.reject(error);
  },
);

export default apiClient;
```

---

## 🖥️ Backend Setup Examples

### **Python Flask + Flask-CORS**

```python
# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from PIL import Image
import io
import json

app = Flask(__name__)
CORS(app)  # ✅ Enable CORS for camera/upload

# Example food detection model (replace with real model)
from your_model import detect_food

@app.route('/api/food/detect', methods=['POST'])
def detect_food_endpoint():
    """Handle single image detection"""
    try:
        if 'image' not in request.files:
            return jsonify({'status': 'error', 'error': 'No image provided'}), 400

        file = request.files['image']

        # Read image
        img = Image.open(io.BytesIO(file.read()))

        # Run detection
        result = detect_food(img)

        # Format response
        return jsonify({
            'status': 'success',
            'food_name': result.get('food_name'),
            'calories': result.get('calories'),
            'protein': result.get('protein'),
            'carbs': result.get('carbs'),
            'fat': result.get('fat'),
            'confidence': result.get('confidence'),
            'all_predictions': result.get('predictions', []),
        })

    except Exception as e:
        print(f'❌ Error: {e}')
        return jsonify({'status': 'error', 'error': str(e)}), 500

@app.route('/api/food/stream', methods=['GET'])
def websocket_stream():
    """Handle WebSocket connections"""
    from flask_sock import Sock
    return "WebSocket endpoint"

if __name__ == '__main__':
    # ✅ Important: Use SSL in production
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True,
        ssl_context='adhoc'  # For HTTPS
    )
```

---

### **Python FastAPI + WebSocket**

```python
# main.py
from fastapi import FastAPI, File, UploadFile, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import io
import json

app = FastAPI()

# ✅ Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from your_model import detect_food

@app.post("/api/food/detect")
async def detect_food_endpoint(image: UploadFile = File(...)):
    """Handle single image detection"""
    try:
        contents = await image.read()
        img = Image.open(io.BytesIO(contents))

        result = detect_food(img)

        return {
            'status': 'success',
            'food_name': result.get('food_name'),
            'calories': result.get('calories'),
            'protein': result.get('protein'),
            'carbs': result.get('carbs'),
            'fat': result.get('fat'),
            'confidence': result.get('confidence'),
            'all_predictions': result.get('predictions', []),
        }

    except Exception as e:
        print(f'❌ Error: {e}')
        return {
            'status': 'error',
            'error': str(e)
        }

@app.websocket("/api/food/stream")
async def websocket_endpoint(websocket: WebSocket):
    """Handle WebSocket streaming detection"""
    await websocket.accept()

    try:
        while True:
            # Receive image blob
            data = await websocket.receive_bytes()

            # Convert bytes to image
            img = Image.open(io.BytesIO(data))

            # Run detection
            result = detect_food(img)

            # Send response
            await websocket.send_json({
                'type': 'detection',
                'status': 'success',
                'food_name': result.get('food_name'),
                'calories': result.get('calories'),
                'protein': result.get('protein'),
                'carbs': result.get('carbs'),
                'fat': result.get('fat'),
                'confidence': result.get('confidence'),
                'all_predictions': result.get('predictions', []),
            })

    except Exception as e:
        await websocket.send_json({
            'type': 'error',
            'error': str(e)
        })

    finally:
        await websocket.close()

# Run with: uvicorn main:app --reload --ssl-keyfile=key.pem --ssl-certfile=cert.pem
```

---

### **Node.js/Express**

```javascript
// server.js
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const WebSocket = require("ws");
const http = require("http");
const https = require("https");
const fs = require("fs");

const app = express();

// ✅ Enable CORS
app.use(cors());

// File upload middleware
const upload = multer({ storage: multer.memoryStorage() });

const { detectFood } = require("./model");

// REST endpoint
app.post("/api/food/detect", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ status: "error", error: "No image provided" });
    }

    const result = await detectFood(req.file.buffer);

    return res.json({
      status: "success",
      food_name: result.food_name,
      calories: result.calories,
      protein: result.protein,
      carbs: result.carbs,
      fat: result.fat,
      confidence: result.confidence,
      all_predictions: result.predictions,
    });
  } catch (error) {
    console.error("❌ Error:", error);
    return res.status(500).json({ status: "error", error: error.message });
  }
});

// WebSocket server
const server = https.createServer(
  {
    key: fs.readFileSync("key.pem"),
    cert: fs.readFileSync("cert.pem"),
  },
  app,
);

const wss = new WebSocket.Server({ server, path: "/api/food/stream" });

wss.on("connection", (ws) => {
  console.log("✅ WebSocket connected");

  ws.on("message", async (data) => {
    try {
      const result = await detectFood(data);

      ws.send(
        JSON.stringify({
          type: "detection",
          status: "success",
          food_name: result.food_name,
          calories: result.calories,
          protein: result.protein,
          carbs: result.carbs,
          fat: result.fat,
          confidence: result.confidence,
          all_predictions: result.predictions,
        }),
      );
    } catch (error) {
      ws.send(
        JSON.stringify({
          type: "error",
          error: error.message,
        }),
      );
    }
  });

  ws.on("close", () => {
    console.log("🔌 WebSocket disconnected");
  });

  ws.on("error", (error) => {
    console.error("❌ WebSocket error:", error);
  });
});

server.listen(5000, () => {
  console.log("✅ Server running on https://localhost:5000");
});
```

---

## 🔐 HTTPS Setup for Local Development

### **Using mkcert (Recommended)**

```bash
# Install mkcert
# macOS: brew install mkcert
# Linux: sudo apt install mkcert
# Windows: choco install mkcert

# Create certificates
mkcert localhost 127.0.0.1

# Files created: localhost+1-key.pem, localhost+1.pem

# Use in Flask:
app.run(ssl_context=('localhost+1.pem', 'localhost+1-key.pem'))

# Use in Express:
const options = {
  key: fs.readFileSync('localhost+1-key.pem'),
  cert: fs.readFileSync('localhost+1.pem'),
}
https.createServer(options, app).listen(5000)
```

---

### **Using ngrok (For Mobile Testing)**

```bash
# Install ngrok from https://ngrok.com/download

# Start tunnel
ngrok http 5000

# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)

# Set in .env.local
NEXT_PUBLIC_API_URL=https://abc123.ngrok.io/api
```

---

## 🧪 Testing the Setup

### **Test REST Endpoint**

```bash
# Capture an image from camera or file
curl -X POST http://localhost:5000/api/food/detect \
  -F "image=@sample.jpg"

# Expected response:
# {
#   "status": "success",
#   "food_name": "apple",
#   "calories": 95,
#   "protein": 0.5,
#   "carbs": 25,
#   "fat": 0.3,
#   "confidence": 0.92,
#   "all_predictions": [...]
# }
```

### **Test WebSocket Endpoint**

```bash
# Using websocat (install: brew install websocat)
websocat wss://localhost:5000/api/food/stream?threshold=0.3

# Send image as binary, expect JSON response
```

### **Test from Browser Console**

```javascript
// Test REST
const formData = new FormData();
formData.append("image" /* blob from canvas */);

fetch("http://localhost:5000/api/food/detect", {
  method: "POST",
  body: formData,
})
  .then((r) => r.json())
  .then((d) => console.log("✅", d))
  .catch((e) => console.error("❌", e));

// Test WebSocket
const ws = new WebSocket("wss://localhost:5000/api/food/stream?threshold=0.3");
ws.onopen = () => ws.send(/* blob */);
ws.onmessage = (e) => console.log("✅", JSON.parse(e.data));
ws.onerror = (e) => console.error("❌", e);
```

---

## 📦 Docker Setup (Optional)

### **Dockerfile (Flask)**

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

CMD ["python", "app.py"]
```

### **docker-compose.yml**

```yaml
version: "3.8"

services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - FLASK_ENV=production
    volumes:
      - ./backend:/app

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=https://backend:5000/api
    depends_on:
      - backend

volumes:
  backend:
```

---

## 🚀 Production Deployment

### **Environment Variables (.env.production)**

```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
NODE_ENV=production
```

### **SSL Certificate (Let's Encrypt)**

```bash
# Using certbot
sudo certbot certonly --standalone -d api.yourdomain.com

# Certificates in: /etc/letsencrypt/live/api.yourdomain.com/
```

### **Deployment Commands**

```bash
# Build Next.js
npm run build

# Deploy to hosting (Vercel, Netlify, etc.)
vercel deploy --prod

# Or deploy backend
gunicorn app:app --certfile=/etc/letsencrypt/live/.../fullchain.pem \
  --keyfile=/etc/letsencrypt/live/.../privkey.pem
```

---

## ✅ Pre-Launch Checklist

- [ ] API endpoint tested with curl
- [ ] WebSocket endpoint tested with websocat
- [ ] HTTPS/SSL certificates configured
- [ ] CORS enabled on backend
- [ ] `NEXT_PUBLIC_API_URL` set correctly
- [ ] Environment variables secured
- [ ] Tested on real iOS device
- [ ] Tested on real Android device
- [ ] All console errors resolved
- [ ] Performance optimized
- [ ] Error messages user-friendly
- [ ] Logging in place for debugging

You're ready to launch! 🚀

---

> Notes: This document contains example server code (Flask/FastAPI/Express). Replace `detect_food`/`your_model` with your actual ML model integration. Adjust HTTPS/NGROK workflows for your test devices.

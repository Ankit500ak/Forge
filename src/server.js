const express = require('express');
const cors = require('cors');

const app = express();

// CORS configuration for Android
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://0.0.0.0:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ...existing code...
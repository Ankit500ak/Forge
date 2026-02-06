import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const DATABASE_URL = process.env.DATABASE_URL;
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];

app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true
}));

app.get('/', (req, res) => {
  res.send('API server is running');
});

app.listen(PORT, () => {
  console.log(`Server running on ${NODE_ENV} mode, port ${PORT}`);
});
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';

// Parse connection string to avoid system environment variable interference
const parseConnectionString = () => {
  const url = process.env.POSTGRES_URL || 'postgresql://postgres:postgres@localhost:5432/fitnessdb';
  const match = url.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (match) {
    return {
      user: match[1],
      password: match[2],
      host: match[3],
      port: parseInt(match[4]),
      database: match[5],
      connectionTimeoutMillis: 5000
    };
  }
  return { connectionString: url, connectionTimeoutMillis: 5000 };
};

const pool = new Pool(parseConnectionString());

export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (verifyErr) {
      console.error('[Auth] Token verification failed:', verifyErr.message);
      return res.status(401).json({ message: 'Invalid token', error: verifyErr.message });
    }
    
    const userId = decoded.userId;

    // Verify a matching profile exists in the database. If not, force logout.
    try {
      const { rows } = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
      if (!rows[0]) {
        console.error('[Auth] User not found in DB:', userId);
        return res.status(401).json({ message: 'Profile not found' });
      }
    } catch (dbErr) {
      // Don't block on DB errors - if JWT is valid, user is authenticated
      // This prevents logout loops due to connection issues
    }

    req.userId = userId;
    next();
  } catch (error) {
    console.error('[Auth] Unexpected error:', error.message);
    res.status(401).json({ message: 'Invalid token', error: error.message });
  }
};

export const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

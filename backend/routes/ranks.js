import express from 'express'
import { RANK_THRESHOLDS } from '../utils/rank.js'

const router = express.Router()

// Return rank thresholds for frontend to compute progress-to-next-rank
router.get('/', async (req, res) => {
  try {
    res.json({ thresholds: RANK_THRESHOLDS })
  } catch (err) {
    res.status(500).json({ message: 'Failed to return rank thresholds', error: err.message })
  }
})

export default router

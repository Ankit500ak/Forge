/**
 * Food Detection API Routes
 * Endpoints for detecting foods, getting nutrition info, and analyzing meals
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import foodDetectionService from '../services/foodDetectionService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for image uploads
const uploadDir = path.join(path.dirname(__dirname), 'uploads', 'food-images');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'food-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // Accept image files only
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

/**
 * POST /api/food/detect
 * Detect food in uploaded image
 */
router.post('/detect', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                status: 'error',
                error: 'No image file provided'
            });
        }

        const imagePath = req.file.path;
        const confidenceThreshold = parseFloat(req.body.confidenceThreshold) || 0.3;

        // Validate confidence threshold
        if (isNaN(confidenceThreshold) || confidenceThreshold < 0 || confidenceThreshold > 1) {
            return res.status(400).json({
                status: 'error',
                error: 'Invalid confidence threshold. Must be between 0 and 1'
            });
        }

        // Run food detection
        const result = await foodDetectionService.detectFood(imagePath, confidenceThreshold);

        // Clean up uploaded file if detection failed
        if (result.status === 'error') {
            try {
                fs.unlinkSync(imagePath);
            } catch (e) {
                // Ignore cleanup errors
            }
        }

        res.json(result);
    } catch (error) {
        console.error('Error in food detection:', error);
        res.status(500).json({
            status: 'error',
            error: error.message || 'Internal server error'
        });
    }
});

/**
 * GET /api/food/foods
 * Get all supported foods and their nutrition info
 */
router.get('/foods', async (req, res) => {
    try {
        const result = await foodDetectionService.getAllFoods();
        res.json(result);
    } catch (error) {
        console.error('Error fetching foods:', error);
        res.status(500).json({
            status: 'error',
            error: error.message || 'Internal server error'
        });
    }
});

/**
 * GET /api/food/nutrition/:foodName
 * Get nutrition information for a specific food
 */
router.get('/nutrition/:foodName', async (req, res) => {
    try {
        const { foodName } = req.params;

        if (!foodName || foodName.trim().length === 0) {
            return res.status(400).json({
                status: 'error',
                error: 'Food name is required'
            });
        }

        const result = await foodDetectionService.getFoodNutrition(foodName);
        res.json(result);
    } catch (error) {
        console.error('Error fetching nutrition:', error);
        res.status(500).json({
            status: 'error',
            error: error.message || 'Internal server error'
        });
    }
});

/**
 * POST /api/food/analyze-meal
 * Analyze nutrition for multiple foods (meal tracking)
 * 
 * Request body:
 * {
 *   "foods": ["paneer", "roti", "daal"]
 * }
 */
router.post('/analyze-meal', express.json(), async (req, res) => {
    try {
        const { foods } = req.body;

        if (!Array.isArray(foods) || foods.length === 0) {
            return res.status(400).json({
                status: 'error',
                error: 'Foods array is required and must not be empty'
            });
        }

        const result = await foodDetectionService.analyzeMeal(foods);
        res.json(result);
    } catch (error) {
        console.error('Error analyzing meal:', error);
        res.status(500).json({
            status: 'error',
            error: error.message || 'Internal server error'
        });
    }
});

/**
 * GET /api/food/recommendations
 * Get food recommendations based on user stats
 * 
 * Query params:
 * - goal: 'muscle_gain', 'weight_loss', or 'balanced'
 * - activityLevel: 'sedentary', 'light', 'moderate', 'active', 'very_active'
 */
router.get('/recommendations', (req, res) => {
    try {
        const { goal = 'balanced', activityLevel = 'moderate' } = req.query;

        const result = foodDetectionService.getFoodRecommendations({
            goal,
            activityLevel
        });

        res.json(result);
    } catch (error) {
        console.error('Error getting recommendations:', error);
        res.status(500).json({
            status: 'error',
            error: error.message || 'Internal server error'
        });
    }
});

/**
 * POST /api/food/search
 * Search for foods by name or category
 * 
 * Request body:
 * {
 *   "query": "paneer",
 *   "category": "protein" (optional),
 *   "maxResults": 10
 * }
 */
router.post('/search', express.json(), async (req, res) => {
    try {
        const { query = '', category = null, maxResults = 10 } = req.body;

        if (!query || query.trim().length < 2) {
            return res.status(400).json({
                status: 'error',
                error: 'Query must be at least 2 characters long'
            });
        }

        const allFoods = await foodDetectionService.getAllFoods();

        if (allFoods.status !== 'success') {
            return res.json(allFoods);
        }

        const queryLower = query.toLowerCase();
        const results = [];

        for (const [key, food] of Object.entries(allFoods.foods)) {
            // Check if food name or category matches
            const nameMatch = key.includes(queryLower) ||
                food.name.toLowerCase().includes(queryLower);
            const categoryMatch = !category || food.category === category;

            if (nameMatch && categoryMatch) {
                results.push({
                    id: key,
                    ...food
                });
            }

            if (results.length >= maxResults) break;
        }

        res.json({
            status: 'success',
            query: query,
            category: category,
            results: results,
            totalFound: results.length
        });
    } catch (error) {
        console.error('Error searching foods:', error);
        res.status(500).json({
            status: 'error',
            error: error.message || 'Internal server error'
        });
    }
});

/**
 * GET /api/food/categories
 * Get all food categories
 */
router.get('/categories', async (req, res) => {
    try {
        const allFoods = await foodDetectionService.getAllFoods();

        if (allFoods.status !== 'success') {
            return res.json(allFoods);
        }

        const categories = new Set();
        for (const food of Object.values(allFoods.foods)) {
            if (food.category) {
                categories.add(food.category);
            }
        }

        res.json({
            status: 'success',
            categories: Array.from(categories).sort(),
            total: categories.size
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({
            status: 'error',
            error: error.message || 'Internal server error'
        });
    }
});

/**
 * GET /api/food/stats
 * Get food database statistics
 */
router.get('/stats', async (req, res) => {
    try {
        const allFoods = await foodDetectionService.getAllFoods();

        if (allFoods.status !== 'success') {
            return res.json(allFoods);
        }

        let totalCalories = 0;
        let avgProtein = 0;
        let avgCarbs = 0;
        let avgFat = 0;
        const categoryCount = {};

        const foods = Object.values(allFoods.foods);

        for (const food of foods) {
            totalCalories += food.calories;
            avgProtein += food.protein;
            avgCarbs += food.carbs;
            avgFat += food.fat;

            const category = food.category || 'other';
            categoryCount[category] = (categoryCount[category] || 0) + 1;
        }

        const foodCount = foods.length;

        res.json({
            status: 'success',
            totalFoods: foodCount,
            averageNutrition: {
                calories: (totalCalories / foodCount).toFixed(1),
                protein: (avgProtein / foodCount).toFixed(1),
                carbs: (avgCarbs / foodCount).toFixed(1),
                fat: (avgFat / foodCount).toFixed(1)
            },
            categoryBreakdown: categoryCount
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({
            status: 'error',
            error: error.message || 'Internal server error'
        });
    }
});

/**
 * GET /api/food/health-check
 * Check if food detection service is working
 */
router.get('/health-check', async (req, res) => {
    try {
        const result = await foodDetectionService.getAllFoods();

        if (result.status === 'success') {
            res.json({
                status: 'healthy',
                message: 'Food detection service is operational',
                foodDatabase: `${result.total_foods} foods available`
            });
        } else {
            res.json({
                status: 'degraded',
                message: 'Food detection service partially operational',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Health check error:', error);
        res.status(503).json({
            status: 'unhealthy',
            message: 'Food detection service is unavailable',
            error: error.message
        });
    }
});

export default router;

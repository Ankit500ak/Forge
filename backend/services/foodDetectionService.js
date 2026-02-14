/**
 * North Indian Food Detection Service
 * Wrapper service to call the Python ML model from Node.js
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class FoodDetectionService {
    constructor() {
        this.pythonScriptPath = path.join(__dirname, 'northIndianFoodDetector.py');
        this.backendDir = path.dirname(__dirname);
        this.mlModelsDir = path.join(this.backendDir, 'ml_models');
        this.uploadDir = path.join(this.backendDir, 'uploads', 'food-images');

        // Create directories if they don't exist
        this.ensureDirectories();
    }

    ensureDirectories() {
        if (!fs.existsSync(this.mlModelsDir)) {
            fs.mkdirSync(this.mlModelsDir, { recursive: true });
        }
        if (!fs.existsSync(this.uploadDir)) {
            fs.mkdirSync(this.uploadDir, { recursive: true });
        }
    }

    /**
     * Run Python food detection script
     * @param {string} pythonPath - Path to Python executable
         * @param {Array} args - Command line arguments
         * @returns {Promise<Object>} - Detection result or error
         */
    runPythonScript(pythonPath = 'python3', args = []) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                process.kill(pythonProcess.pid);
                reject(new Error('Food detection timeout (>30s)'));
            }, 30000);

            const pythonProcess = spawn(pythonPath, [this.pythonScriptPath, ...args], {
                cwd: this.backendDir,
                env: { ...process.env, PYTHONUNBUFFERED: '1' }
            });

            let output = '';
            let errorOutput = '';

            pythonProcess.stdout.on('data', (data) => {
                output += data.toString();
            });

            pythonProcess.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });

            pythonProcess.on('close', (code) => {
                clearTimeout(timeout);

                try {
                    // Try to parse JSON output
                    const result = JSON.parse(output);
                    if (code === 0) {
                        resolve(result);
                    } else {
                        reject({
                            status: 'error',
                            error: errorOutput || 'Python script failed',
                            code: code
                        });
                    }
                } catch (e) {
                    if (output) {
                        resolve({ status: 'success', raw_output: output });
                    } else {
                        reject({
                            status: 'error',
                            error: errorOutput || 'Invalid response from Python script',
                            details: e.message
                        });
                    }
                }
            });

            pythonProcess.on('error', (err) => {
                clearTimeout(timeout);
                reject({
                    status: 'error',
                    error: `Failed to run Python script: ${err.message}`,
                    hint: 'Make sure Python 3 is installed and TensorFlow is available'
                });
            });
        });
    }

    /**
     * Detect food in an image
     * @param {string} imagePath - Path to the food image
     * @param {number} confidenceThreshold - Minimum confidence (0-1)
     * @returns {Promise<Object>} - Detection result with food details
     */
    async detectFood(imagePath, confidenceThreshold = 0.3) {
        try {
            // Validate image exists
            if (!fs.existsSync(imagePath)) {
                return {
                    status: 'error',
                    error: `Image not found: ${imagePath}`
                };
            }

            // Run detection
            let pythonPath = 'python3';

            // Try to find Python executable
            try {
                await this.runPythonScript('python3', ['--version']);
            } catch (e) {
                // Try python instead of python3
                pythonPath = 'python';
            }

            const result = await this.runPythonScript(pythonPath, [
                imagePath,
                confidenceThreshold.toString()
            ]);

            return {
                ...result,
                imageFile: path.basename(imagePath)
            };
        } catch (error) {
            return {
                status: 'error',
                error: error.error || error.message || String(error),
                details: error.details || error.hint
            };
        }
    }

    /**
     * Get nutrition information for a food
     * @param {string} foodName - Name of the food
     * @returns {Promise<Object>} - Nutrition information
     */
    async getFoodNutrition(foodName) {
        try {
            const result = await this.runPythonScript('python3', [
                '--list-foods'
            ]);

            if (result.status === 'success' && result.foods) {
                const foodKey = foodName.toLowerCase().replace(/\s+/g, '_');

                if (result.foods[foodKey]) {
                    return {
                        status: 'success',
                        food: foodKey,
                        ...result.foods[foodKey]
                    };
                } else {
                    return {
                        status: 'not_found',
                        error: `Food "${foodName}" not found`,
                        suggestions: Object.keys(result.foods).slice(0, 5)
                    };
                }
            }

            return result;
        } catch (error) {
            return {
                status: 'error',
                error: error.error || error.message || String(error)
            };
        }
    }

    /**
     * Get all supported foods
     * @returns {Promise<Object>} - List of all foods and nutrition info
     */
    async getAllFoods() {
        try {
            const result = await this.runPythonScript('python3', ['--list-foods']);
            return result;
        } catch (error) {
            return {
                status: 'error',
                error: error.error || error.message || String(error)
            };
        }
    }

    /**
     * Analyze multiple foods (for meal tracking)
     * @param {Array<string>} foodNames - Array of food names
     * @returns {Promise<Object>} - Combined nutrition information
     */
    async analyzeMeal(foodNames) {
        try {
            const allFoods = await this.getAllFoods();

            if (allFoods.status !== 'success') {
                return allFoods;
            }

            let totalCalories = 0;
            let totalProtein = 0;
            let totalCarbs = 0;
            let totalFat = 0;
            let totalFiber = 0;
            const foods = [];

            for (const foodName of foodNames) {
                const foodKey = foodName.toLowerCase().replace(/\s+/g, '_');

                if (allFoods.foods[foodKey]) {
                    const food = allFoods.foods[foodKey];
                    foods.push({
                        name: food.name,
                        calories: food.calories,
                        protein: food.protein,
                        carbs: food.carbs,
                        fat: food.fat,
                        fiber: food.fiber,
                        category: food.category
                    });

                    totalCalories += food.calories;
                    totalProtein += food.protein;
                    totalCarbs += food.carbs;
                    totalFat += food.fat;
                    totalFiber += food.fiber;
                }
            }

            return {
                status: 'success',
                meal: {
                    foods: foods,
                    totalNutrition: {
                        calories: totalCalories,
                        protein: totalProtein,
                        carbs: totalCarbs,
                        fat: totalFat,
                        fiber: totalFiber
                    },
                    macroBreakdown: {
                        proteinCalories: (totalProtein * 4),
                        carbsCalories: (totalCarbs * 4),
                        fatCalories: (totalFat * 9)
                    }
                }
            };
        } catch (error) {
            return {
                status: 'error',
                error: error.error || error.message || String(error)
            };
        }
    }

    /**
     * Get food recommendations based on user stats
     * @param {Object} userStats - User fitness stats
     * @returns {Object} - Food recommendations
     */
    getFoodRecommendations(userStats = {}) {
        const { goal = 'balanced', activityLevel = 'moderate', preferences = [] } = userStats;

        const recommendations = {
            status: 'success',
            goal: goal,
            activityLevel: activityLevel,
            recommendations: [],
            calorieTarget: this._getCalorieTarget(goal, activityLevel)
        };

        // Get recommendations based on goal
        if (goal === 'muscle_gain') {
            recommendations.recommendations = [
                { food: 'paneer', reason: 'High protein for muscle building', priority: 'high' },
                { food: 'paneer_tikka', reason: 'Lean protein source', priority: 'high' },
                { food: 'tandoori_chicken', reason: 'Excellent protein content', priority: 'high' },
                { food: 'daal', reason: 'Plant-based protein', priority: 'medium' },
                { food: 'rajma', reason: 'Protein and fiber', priority: 'medium' }
            ];
        } else if (goal === 'weight_loss') {
            recommendations.recommendations = [
                { food: 'aloo_gobi', reason: 'Low calorie vegetable dish', priority: 'high' },
                { food: 'tandoori_chicken', reason: 'High protein, low fat', priority: 'high' },
                { food: 'daal', reason: 'Filling, high fiber', priority: 'medium' },
                { food: 'raita', reason: 'Low calorie side', priority: 'medium' },
                { food: 'lassi', reason: 'Light beverage option', priority: 'low' }
            ];
        } else { // balanced
            recommendations.recommendations = [
                { food: 'roti', reason: 'Whole grain staple', priority: 'high' },
                { food: 'daal', reason: 'Balanced nutrition', priority: 'high' },
                { food: 'paneer', reason: 'Good protein source', priority: 'medium' },
                { food: 'biryani', reason: 'Complete meal with vegetables', priority: 'medium' },
                { food: 'raita', reason: 'Probiotic side dish', priority: 'low' }
            ];
        }

        return recommendations;
    }

    /**
     * Calculate daily calorie target
     * @param {string} goal - Fitness goal
     * @param {string} activityLevel - Activity level
     * @returns {number} - Recommended daily calories
     */
    _getCalorieTarget(goal, activityLevel) {
        const baseCalories = 2000;
        const activityMultipliers = {
            'sedentary': 1.0,
            'light': 1.2,
            'moderate': 1.5,
            'active': 1.75,
            'very_active': 2.0
        };

        let multiplier = activityMultipliers[activityLevel] || 1.5;

        if (goal === 'muscle_gain') {
            multiplier *= 1.1; // 10% surplus
        } else if (goal === 'weight_loss') {
            multiplier *= 0.85; // 15% deficit
        }

        return Math.round(baseCalories * multiplier);
    }
}

// Export singleton instance
export default new FoodDetectionService();

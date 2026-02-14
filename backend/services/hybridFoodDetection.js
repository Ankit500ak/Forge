/**
 * Hybrid Food Detection Service
 * Combines CSV lookup with AI detection for best of both worlds
 * 
 * Priority:
 * 1. Exact match in CSV dataset
 * 2. Fuzzy match in CSV dataset
 * 3. AI detection fallback
 */

import csvFoodLookup from './csvFoodLookup.js';
import foodDetectionService from './foodDetectionService.js';

class HybridFoodDetection {
    constructor() {
        this.csvInitialized = false;
    }

    /**
     * Initialize CSV lookup service
     */
    async initialize() {
        if (this.csvInitialized) return;

        try {
            await csvFoodLookup.initialize();
            this.csvInitialized = true;
            console.log('✅ Hybrid Food Detection initialized');
        } catch (error) {
            console.error('❌ Hybrid Food Detection init error:', error);
            this.csvInitialized = false;
        }
    }

    /**
     * Detect food with hybrid approach
     * 
     * Returns:
     * {
     *   detected_food: string,
     *   confidence: number,
     *   nutrition: { calories, protein, carbs, fats, ... },
     *   source: 'csv' | 'ai' | 'csv_fuzzy',
     *   alternativeMatches: [ { name, confidence, ... } ]
     * }
     */
    async detectFood(imagePath, confidenceThreshold = 0.3) {
        const startTime = Date.now();

        try {
            // Ensure CSV is initialized
            if (!this.csvInitialized) {
                await this.initialize();
            }

            // Step 1: Try AI detection to get food name
            console.log('[HYBRID] Attempting AI detection...');
            let aiResult;
            try {
                aiResult = await foodDetectionService.detectFood(imagePath, confidenceThreshold);
            } catch (error) {
                console.warn('[HYBRID] AI detection failed, will use CSV fallback:', error.message);
                aiResult = null;
            }

            if (!aiResult) {
                return {
                    status: 'detection_failed',
                    error: 'Could not detect food using AI. Please try again with better lighting.',
                    source: 'none'
                };
            }

            const detectedFoodName = aiResult.detected_food;
            const initialConfidence = aiResult.confidence;

            // Step 2: Try exact match in CSV
            console.log(`[HYBRID] Searching for exact match: "${detectedFoodName}"`);
            const exactMatch = csvFoodLookup.findExactMatch(detectedFoodName);

            if (exactMatch) {
                console.log(`[HYBRID] ✅ Exact match found in CSV: ${exactMatch.name}`);
                return {
                    detected_food: exactMatch.name,
                    confidence: initialConfidence,
                    nutrition: this.formatNutrition(exactMatch),
                    source: 'csv_exact',
                    nutritionSource: 'CSV Dataset',
                    processingTime: Date.now() - startTime,
                    details: {
                        csvName: exactMatch.name,
                        matchType: 'exact'
                    }
                };
            }

            // Step 3: Try fuzzy match in CSV
            console.log(`[HYBRID] Searching for fuzzy matches...`);
            const fuzzyMatches = csvFoodLookup.findSimilarMatches(detectedFoodName, 5);

            if (fuzzyMatches.length > 0) {
                const bestMatch = fuzzyMatches[0];
                console.log(`[HYBRID] ✅ Fuzzy match found in CSV: ${bestMatch.name}`);

                const alternativeMatches = fuzzyMatches.slice(1).map(food => ({
                    name: food.name,
                    calories: food.calories,
                    protein: food.protein,
                    carbs: food.carbs,
                    fats: food.fats
                }));

                return {
                    detected_food: bestMatch.name,
                    confidence: initialConfidence,
                    nutrition: this.formatNutrition(bestMatch),
                    source: 'csv_fuzzy',
                    nutritionSource: 'CSV Dataset (Fuzzy Match)',
                    processingTime: Date.now() - startTime,
                    alternativeMatches: alternativeMatches,
                    details: {
                        aiDetection: detectedFoodName,
                        csvMatch: bestMatch.name,
                        matchType: 'fuzzy'
                    }
                };
            }

            // Step 4: Fallback to AI detection results
            console.log(`[HYBRID] No CSV match found, using AI detection: ${detectedFoodName}`);
            return {
                detected_food: detectedFoodName,
                confidence: initialConfidence,
                nutrition: aiResult.nutrition,
                source: 'ai_fallback',
                nutritionSource: 'AI Estimation',
                processingTime: Date.now() - startTime,
                details: {
                    fallback: true,
                    csvSearched: true
                }
            };

        } catch (error) {
            console.error('[HYBRID] Hybrid detection error:', error);
            return {
                status: 'error',
                error: error.message,
                source: 'none'
            };
        }
    }

    /**
     * Format nutrition data for response
     */
    formatNutrition(food) {
        return {
            calories: Math.round(food.calories),
            protein: parseFloat(food.protein.toFixed(1)),
            carbs: parseFloat(food.carbs.toFixed(1)),
            fats: parseFloat(food.fats.toFixed(1)),
            fiber: parseFloat(food.fiber?.toFixed(1) || 0),
            sugar: parseFloat(food.sugar?.toFixed(1) || 0),
            sodium: Math.round(food.sodium || 0),
            calcium: Math.round(food.calcium || 0),
            iron: parseFloat(food.iron?.toFixed(2) || 0),
            vitaminC: parseFloat(food.vitaminC?.toFixed(1) || 0),
            folate: Math.round(food.folate || 0)
        };
    }

    /**
     * Search CSV dataset directly
     */
    searchDataset(query, type = 'fuzzy') {
        if (!this.csvInitialized) {
            return {
                status: 'error',
                error: 'CSV dataset not initialized'
            };
        }

        try {
            let results = [];

            if (type === 'exact') {
                const match = csvFoodLookup.findExactMatch(query);
                results = match ? [match] : [];
            } else if (type === 'fuzzy') {
                results = csvFoodLookup.findSimilarMatches(query, 10);
            } else if (type === 'keyword') {
                results = csvFoodLookup.searchByKeyword(query);
            }

            return {
                status: 'success',
                query: query,
                type: type,
                count: results.length,
                results: results.map(r => ({
                    name: r.name,
                    calories: r.calories,
                    protein: r.protein,
                    carbs: r.carbs,
                    fats: r.fats,
                    source: 'csv'
                }))
            };

        } catch (error) {
            return {
                status: 'error',
                error: error.message
            };
        }
    }

    /**
     * Get dataset statistics
     */
    getDatasetStats() {
        if (!this.csvInitialized) {
            return {
                status: 'error',
                error: 'CSV dataset not initialized'
            };
        }

        return {
            status: 'success',
            ...csvFoodLookup.getStats()
        };
    }
}

// Export singleton
const hybridFoodDetection = new HybridFoodDetection();

export default hybridFoodDetection;

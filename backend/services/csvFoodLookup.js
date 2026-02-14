/**
 * CSV Food Lookup Service
 * Loads and searches the Indian Food Nutrition CSV dataset
 * Provides fast lookup before falling back to AI detection
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class CSVFoodLookup {
    constructor() {
        this.foods = [];
        this.searchIndex = new Map(); // Quick lookup by normalized name
        this.initialized = false;
    }

    /**
     * Initialize the lookup service by loading CSV data
     */
    async initialize() {
        try {
            if (this.initialized) return;

            // CSV path - pointing to public folder in frontend
            const csvPath = path.join(
                path.dirname(__dirname),
                'fitness-app-frontend',
                'public',
                'Dataset',
                'Indian_Food_Nutrition_Processed.csv'
            );

            if (!fs.existsSync(csvPath)) {
                throw new Error(`CSV file not found: ${csvPath}`);
            }

            // Read and parse CSV
            const fileContent = fs.readFileSync(csvPath, 'utf-8');
            const records = parse(fileContent, {
                columns: true,
                skip_empty_lines: true,
                trim: true
            });

            // Process records
            this.foods = records.map(record => ({
                name: record['Dish Name'],
                nameNormalized: this.normalizeName(record['Dish Name']),
                calories: parseFloat(record['Calories (kcal)']) || 0,
                carbs: parseFloat(record['Carbohydrates (g)']) || 0,
                protein: parseFloat(record['Protein (g)']) || 0,
                fats: parseFloat(record['Fats (g)']) || 0,
                sugar: parseFloat(record['Free Sugar (g)']) || 0,
                fiber: parseFloat(record['Fibre (g)']) || 0,
                sodium: parseFloat(record['Sodium (mg)']) || 0,
                calcium: parseFloat(record['Calcium (mg)']) || 0,
                iron: parseFloat(record['Iron (mg)']) || 0,
                vitaminC: parseFloat(record['Vitamin C (mg)']) || 0,
                folate: parseFloat(record['Folate (µg)']) || 0,
                source: 'csv'
            }));

            // Build search index
            this.foods.forEach(food => {
                this.searchIndex.set(food.nameNormalized, food);
            });

            this.initialized = true;
            console.log(`✅ CSV Food Lookup initialized: ${this.foods.length} foods loaded`);

        } catch (error) {
            console.error('❌ CSV Food Lookup initialization error:', error.message);
            this.initialized = false;
        }
    }

    /**
     * Normalize food names for comparison
     * Converts to lowercase and removes extra spaces/special chars
     */
    normalizeName(name) {
        return name
            .toLowerCase()
            .trim()
            .replace(/\s+/g, ' ')
            .replace(/[^\w\s]/g, '');
    }

    /**
     * Search for exact match in CSV
     */
    findExactMatch(foodName) {
        if (!this.initialized) return null;

        const normalized = this.normalizeName(foodName);
        return this.searchIndex.get(normalized) || null;
    }

    /**
     * Search for partial/fuzzy match in CSV
     * Returns top 3 matches by similarity
     */
    findSimilarMatches(foodName, limit = 3) {
        if (!this.initialized) return [];

        const normalized = this.normalizeName(foodName);
        const matches = [];

        // Calculate similarity score for each food
        this.foods.forEach(food => {
            const score = this.calculateSimilarity(normalized, food.nameNormalized);
            if (score > 0.6) {  // 60% similarity threshold
                matches.push({ ...food, similarity: score });
            }
        });

        // Sort by similarity and return top matches
        return matches
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, limit)
            .map(({ similarity, ...food }) => food);
    }

    /**
     * Calculate Levenshtein similarity ratio between two strings
     */
    calculateSimilarity(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;

        if (longer.length === 0) return 1.0;

        const distance = this.levenshteinDistance(longer, shorter);
        return (longer.length - distance) / longer.length;
    }

    /**
     * Calculate Levenshtein distance between two strings
     */
    levenshteinDistance(str1, str2) {
        const matrix = [];

        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }

        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }

        return matrix[str2.length][str1.length];
    }

    /**
     * Get all foods that contain keyword
     */
    searchByKeyword(keyword) {
        if (!this.initialized) return [];

        const normalized = this.normalizeName(keyword);
        return this.foods.filter(food =>
            food.nameNormalized.includes(normalized)
        );
    }

    /**
     * Get random food (for demo purposes)
     */
    getRandomFood() {
        if (!this.initialized || this.foods.length === 0) return null;
        return this.foods[Math.floor(Math.random() * this.foods.length)];
    }

    /**
     * Get stats about the dataset
     */
    getStats() {
        return {
            totalFoods: this.foods.length,
            initialized: this.initialized,
            lastUpdated: new Date().toISOString(),
            categories: this.getCategoryStats()
        };
    }

    /**
     * Get category statistics from dish names
     */
    getCategoryStats() {
        const categories = {};

        this.foods.forEach(food => {
            // Extract potential category from name
            // e.g., "Butter Chicken" -> "chicken", "Hot tea" -> "tea"
            const words = food.name.toLowerCase().split(' ');
            const category = words[words.length - 1]; // Last word as category

            if (!categories[category]) {
                categories[category] = 0;
            }
            categories[category]++;
        });

        // Sort by count
        return Object.entries(categories)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20)
            .reduce((obj, [key, value]) => {
                obj[key] = value;
                return obj;
            }, {});
    }
}

// Create singleton instance
const csvFoodLookup = new CSVFoodLookup();

export default csvFoodLookup;

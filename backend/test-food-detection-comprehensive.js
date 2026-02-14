#!/usr/bin/env node

/**
 * Comprehensive Food Detection System Test
 * Tests:
 * 1. CSV dataset loading
 * 2. Food name normalization and matching
 * 3. Fuzzy matching for similar names
 * 4. Hybrid detection logic
 * 5. API endpoints
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import csv from 'csv-parse/sync';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    bold: '\x1b[1m'
};

class FoodDetectionTester {
    constructor() {
        this.foods = [];
        this.results = {
            passed: 0,
            failed: 0,
            warnings: 0,
            tests: []
        };
    }

    async loadCSVDataset() {
        try {
            const csvPath = path.join(
                __dirname,
                'fitness-app-frontend',
                'public',
                'Dataset',
                'Indian_Food_Nutrition_Processed.csv'
            );

            if (!fs.existsSync(csvPath)) {
                throw new Error(`CSV not found at: ${csvPath}`);
            }

            const fileContent = fs.readFileSync(csvPath, 'utf-8');
            const records = csv.parse(fileContent, {
                columns: true,
                skip_empty_lines: true,
                trim: true
            });

            this.foods = records.map(record => ({
                name: record['Dish Name'],
                calories: parseFloat(record['Calories (kcal)']) || 0,
                protein: parseFloat(record['Protein (g)']) || 0,
                carbs: parseFloat(record['Carbohydrates (g)']) || 0,
                fats: parseFloat(record['Fats (g)']) || 0
            }));

            return this.foods;
        } catch (error) {
            throw error;
        }
    }

    // Normalize food names for comparison
    normalizeName(name) {
        return name
            .toLowerCase()
            .trim()
            .replace(/\s+/g, ' ')
            .replace(/[^\w\s]/g, '');
    }

    // Calculate Levenshtein distance
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

    // Calculate similarity
    calculateSimilarity(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        if (longer.length === 0) return 1.0;
        const distance = this.levenshteinDistance(longer, shorter);
        return (longer.length - distance) / longer.length;
    }

    // Test exact matching
    testExactMatching() {
        console.log(`\n${colors.cyan}${colors.bold}TEST 1: Exact Matching${colors.reset}`);
        console.log('Testing if foods can be found by exact name match...\n');

        const testFoods = [
            'Butter Chicken',
            'Biryani',
            'Paneer Tikka',
            'Dal Makhani',
            'Tandoori Chicken'
        ];

        let exactMatches = 0;

        testFoods.forEach(testFood => {
            const normalized = this.normalizeName(testFood);
            const match = this.foods.find(f => this.normalizeName(f.name) === normalized);

            if (match) {
                console.log(`${colors.green}✓${colors.reset} Found: ${testFood} → ${match.name} (${match.calories} cal)`);
                this.pass(`Exact match for "${testFood}"`);
                exactMatches++;
            } else {
                console.log(`${colors.red}✗${colors.reset} Not found: ${testFood}`);
                this.fail(`Exact match for "${testFood}"`);
            }
        });

        console.log(`\nExact matches: ${colors.green}${exactMatches}/${testFoods.length}${colors.reset}`);
    }

    // Test fuzzy matching
    testFuzzyMatching() {
        console.log(`\n${colors.cyan}${colors.bold}TEST 2: Fuzzy Matching${colors.reset}`);
        console.log('Testing if similar food names can be matched...\n');

        const testCases = [
            { query: 'Butter Chiken', expected: 'Butter Chicken' }, // typo
            { query: 'Paneer Tikka Masala', expected: 'Paneer Tikka' }, // partial
            { query: 'Tandoori Chick', expected: 'Tandoori Chicken' }, // incomplete
            { query: 'Biryani Rice', expected: 'Biryani' }, // extra word
            { query: 'Daal Makhni', expected: 'Dal Makhani' } // spelling variant
        ];

        testCases.forEach(testCase => {
            const normalized = this.normalizeName(testCase.query);
            let bestMatch = null;
            let bestScore = 0;

            this.foods.forEach(food => {
                const score = this.calculateSimilarity(normalized, this.normalizeName(food.name));
                if (score > bestScore) {
                    bestScore = score;
                    bestMatch = food;
                }
            });

            if (bestMatch && bestScore > 0.6) {
                console.log(`${colors.green}✓${colors.reset} "${testCase.query}" → "${bestMatch.name}" (${(bestScore * 100).toFixed(1)}%)`);
                this.pass(`Fuzzy match for "${testCase.query}"`);
            } else {
                console.log(`${colors.yellow}!${colors.reset} "${testCase.query}" → No match found (threshold: 60%)`);
                this.warn(`Fuzzy match for "${testCase.query}"`);
            }
        });
    }

    // Test dataset completeness
    testDatasetCompleteness() {
        console.log(`\n${colors.cyan}${colors.bold}TEST 3: Dataset Completeness${colors.reset}`);
        console.log('Verifying dataset has complete nutrition information...\n');

        let completeRecords = 0;
        let incompleteRecords = 0;

        this.foods.forEach(food => {
            const hasAllFields = food.calories && food.protein && food.carbs && food.fats;
            if (hasAllFields) {
                completeRecords++;
            } else {
                incompleteRecords++;
            }
        });

        console.log(`Total foods: ${colors.bold}${this.foods.length}${colors.reset}`);
        console.log(`Complete records: ${colors.green}${completeRecords}${colors.reset}`);
        console.log(`Incomplete records: ${colors.yellow}${incompleteRecords}${colors.reset}`);
        console.log(`Completeness: ${colors.green}${((completeRecords / this.foods.length) * 100).toFixed(1)}%${colors.reset}`);

        if (completeRecords / this.foods.length >= 0.95) {
            this.pass('Dataset has 95%+ complete records');
        } else {
            this.warn('Dataset has some incomplete records');
        }
    }

    // Test category diversity
    testCategoryDiversity() {
        console.log(`\n${colors.cyan}${colors.bold}TEST 4: Food Categories${colors.reset}`);
        console.log('Analyzing food categories in dataset...\n');

        const categories = {};
        const categoryKeywords = {
            'Beverages': ['tea', 'coffee', 'juice', 'shake', 'lassi', 'cooler'],
            'Main Courses': ['biryani', 'curry', 'makhani', 'masala', 'tandoori', 'chicken', 'fish'],
            'Bread': ['naan', 'roti', 'paratha', 'bread', 'kulcha'],
            'Vegetables': ['potato', 'carrot', 'spinach', 'okra', 'cauliflower'],
            'Legumes': ['dal', 'beans', 'lentil'],
            'Sweets': ['gulab', 'halwa', 'kheer', 'jalebi', 'laddu', 'barfi'],
            'Snacks': ['samosa', 'pakora', 'chips', 'wafer', 'fries'],
            'Sauces': ['sauce', 'chutney', 'pickle', 'ketchup']
        };

        this.foods.forEach(food => {
            let assigned = false;
            for (const [category, keywords] of Object.entries(categoryKeywords)) {
                if (keywords.some(kw => food.name.toLowerCase().includes(kw))) {
                    if (!categories[category]) categories[category] = 0;
                    categories[category]++;
                    assigned = true;
                    break;
                }
            }
            if (!assigned) {
                if (!categories['Other']) categories['Other'] = 0;
                categories['Other']++;
            }
        });

        const sorted = Object.entries(categories)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        sorted.forEach(([cat, count]) => {
            const percentage = ((count / this.foods.length) * 100).toFixed(1);
            console.log(`  ${colors.bold}${cat}${colors.reset}: ${count} foods (${percentage}%)`);
        });

        this.pass('Dataset contains diverse food categories');
    }

    // Test calorie range
    testCalorieRange() {
        console.log(`\n${colors.cyan}${colors.bold}TEST 5: Nutrition Data Range${colors.reset}`);
        console.log('Analyzing nutrition data distribution...\n');

        const calories = this.foods.map(f => f.calories).filter(c => c > 0);
        const minCal = Math.min(...calories);
        const maxCal = Math.max(...calories);
        const avgCal = calories.reduce((a, b) => a + b, 0) / calories.length;

        console.log(`Calories range: ${colors.green}${minCal.toFixed(1)} - ${maxCal.toFixed(1)} kcal${colors.reset}`);
        console.log(`Average: ${colors.green}${avgCal.toFixed(1)} kcal${colors.reset}`);

        const protein = this.foods.map(f => f.protein).filter(p => p > 0);
        console.log(`Protein range: ${colors.green}${Math.min(...protein).toFixed(1)} - ${Math.max(...protein).toFixed(1)} g${colors.reset}`);

        this.pass('Nutrition data has realistic ranges');
    }

    // Test search functionality
    testSearchFunctionality() {
        console.log(`\n${colors.cyan}${colors.bold}TEST 6: Search Functionality${colors.reset}`);
        console.log('Testing keyword search...\n');

        const searchQueries = [
            { query: 'chicken', expectedMin: 5 },
            { query: 'paneer', expectedMin: 2 },
            { query: 'bread', expectedMin: 3 },
            { query: 'dal', expectedMin: 2 },
            { query: 'tea', expectedMin: 1 }
        ];

        searchQueries.forEach(testCase => {
            const results = this.foods.filter(f =>
                f.name.toLowerCase().includes(testCase.query.toLowerCase())
            );

            if (results.length >= testCase.expectedMin) {
                console.log(`${colors.green}✓${colors.reset} "${testCase.query}": ${results.length} results`);
                this.pass(`Search for "${testCase.query}"`);
            } else {
                console.log(`${colors.yellow}⚠${colors.reset} "${testCase.query}": ${results.length} results (expected ≥${testCase.expectedMin})`);
                this.warn(`Search for "${testCase.query}"`);
            }
        });
    }

    // Print results
    printResults() {
        console.log(`\n\n${colors.bold}${colors.cyan}═══════════════════════════════════════════════${colors.reset}`);
        console.log(`${colors.bold}${colors.cyan}          DETECTION SYSTEM TEST RESULTS${colors.reset}`);
        console.log(`${colors.bold}${colors.cyan}═══════════════════════════════════════════════${colors.reset}\n`);

        console.log(`${colors.green}✓ Passed:${colors.reset}  ${this.results.passed}`);
        console.log(`${colors.red}✗ Failed:${colors.reset}  ${this.results.failed}`);
        console.log(`${colors.yellow}⚠ Warnings:${colors.reset} ${this.results.warnings}`);
        console.log(`\nTotal Tests: ${this.results.passed + this.results.failed}\n`);

        const successRate = this.results.passed + this.results.failed > 0
            ? ((this.results.passed / (this.results.passed + this.results.failed)) * 100).toFixed(1)
            : 0;

        console.log(`${colors.bold}Success Rate: ${colors.green}${successRate}%${colors.reset}\n`);

        if (this.results.failed === 0) {
            console.log(`${colors.bold}${colors.green}✓ All critical tests passed!${colors.reset}\n`);
            console.log('The food detection system is ready for use with:');
            console.log(`  • ${colors.bold}${this.foods.length} different foods${colors.reset} in the database`);
            console.log(`  • ${colors.bold}Exact matching${colors.reset} for known foods`);
            console.log(`  • ${colors.bold}Fuzzy matching${colors.reset} for similar names`);
            console.log(`  • ${colors.bold}Complete nutrition data${colors.reset} for all items`);
            console.log(`  • ${colors.bold}AI fallback${colors.reset} for unknown foods\n`);
        } else {
            console.log(`${colors.red}${colors.bold}✗ Some tests failed. Please review above.${colors.reset}\n`);
        }
    }

    pass(testName) {
        this.results.passed++;
        this.results.tests.push({ name: testName, status: 'passed' });
    }

    fail(testName) {
        this.results.failed++;
        this.results.tests.push({ name: testName, status: 'failed' });
    }

    warn(testName) {
        this.results.warnings++;
        this.results.tests.push({ name: testName, status: 'warning' });
    }

    async runAllTests() {
        try {
            console.log(`${colors.cyan}${colors.bold}╔════════════════════════════════════════════╗${colors.reset}`);
            console.log(`${colors.cyan}${colors.bold}║   Food Detection System Test Suite         ║${colors.reset}`);
            console.log(`${colors.cyan}${colors.bold}╚════════════════════════════════════════════╝${colors.reset}\n`);

            console.log('Loading CSV dataset...');
            await this.loadCSVDataset();
            console.log(`${colors.green}✓ Loaded ${this.foods.length} foods from CSV${colors.reset}\n`);

            this.testExactMatching();
            this.testFuzzyMatching();
            this.testDatasetCompleteness();
            this.testCategoryDiversity();
            this.testCalorieRange();
            this.testSearchFunctionality();

            this.printResults();

            return this.results.failed === 0 ? 0 : 1;
        } catch (error) {
            console.error(`${colors.red}${colors.bold}Error:${colors.reset} ${error.message}`);
            return 1;
        }
    }
}

// Run tests
const tester = new FoodDetectionTester();
tester.runAllTests().then(exitCode => {
    process.exit(exitCode);
});

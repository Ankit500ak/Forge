/**
 * Nutrition Database
 * Maps food items to their nutritional values
 * Values per 100g serving
 */

export const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number; unit: string }> = {
    // Common Indian Dishes
    'butter chicken': { calories: 150, protein: 18, carbs: 2, fat: 8, unit: '100g' },
    'chicken tikka': { calories: 165, protein: 28, carbs: 2, fat: 5, unit: '100g' },
    'dal makhani': { calories: 180, protein: 12, carbs: 15, fat: 9, unit: '100g' },
    'paneer tikka': { calories: 160, protein: 18, carbs: 3, fat: 8, unit: '100g' },
    'biryani': { calories: 250, protein: 15, carbs: 35, fat: 8, unit: '100g' },
    'rajma': { calories: 130, protein: 8, carbs: 20, fat: 0.5, unit: '100g' },
    'chole bhature': { calories: 320, protein: 12, carbs: 45, fat: 12, unit: '100g' },
    'samosa': { calories: 262, protein: 5, carbs: 32, fat: 12, unit: '1 piece' },
    'dosa': { calories: 133, protein: 3.5, carbs: 28, fat: 0.5, unit: '100g' },
    'idli': { calories: 50, protein: 2, carbs: 10, fat: 0.3, unit: '1 piece' },
    'roti': { calories: 120, protein: 4, carbs: 24, fat: 0.8, unit: '100g' },
    'naan': { calories: 262, protein: 7, carbs: 46, fat: 5, unit: '100g' },
    'aloo gobi': { calories: 80, protein: 2.5, carbs: 12, fat: 3, unit: '100g' },
    'chole salad': { calories: 164, protein: 9, carbs: 27, fat: 2, unit: '100g' },

    // Fruits
    'apple': { calories: 52, protein: 0.3, carbs: 14, fat: 0.2, unit: '100g' },
    'banana': { calories: 89, protein: 1.1, carbs: 23, fat: 0.3, unit: '100g' },
    'orange': { calories: 47, protein: 0.9, carbs: 12, fat: 0.1, unit: '100g' },
    'mango': { calories: 60, protein: 0.8, carbs: 15, fat: 0.4, unit: '100g' },
    'papaya': { calories: 43, protein: 0.6, carbs: 11, fat: 0.3, unit: '100g' },
    'watermelon': { calories: 30, protein: 0.6, carbs: 8, fat: 0.2, unit: '100g' },
    'strawberry': { calories: 32, protein: 0.8, carbs: 8, fat: 0.3, unit: '100g' },

    // Vegetables
    'carrot': { calories: 41, protein: 0.9, carbs: 10, fat: 0.2, unit: '100g' },
    'broccoli': { calories: 34, protein: 2.8, carbs: 7, fat: 0.4, unit: '100g' },
    'spinach': { calories: 23, protein: 2.7, carbs: 3.6, fat: 0.4, unit: '100g' },
    'tomato': { calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, unit: '100g' },
    'cucumber': { calories: 16, protein: 0.7, carbs: 3.6, fat: 0.1, unit: '100g' },
    'onion': { calories: 40, protein: 1.1, carbs: 9, fat: 0.1, unit: '100g' },

    // Proteins
    'chicken breast': { calories: 165, protein: 31, carbs: 0, fat: 3.6, unit: '100g' },
    'fish': { calories: 82, protein: 18, carbs: 0, fat: 0.8, unit: '100g' },
    'egg': { calories: 155, protein: 13, carbs: 1.1, fat: 11, unit: '1 large' },
    'paneer': { calories: 208, protein: 25, carbs: 4, fat: 11, unit: '100g' },
    'yogurt': { calories: 59, protein: 10, carbs: 3.3, fat: 0.4, unit: '100g' },

    // Grains
    'rice': { calories: 130, protein: 2.7, carbs: 28, fat: 0.3, unit: '100g' },
    'bread': { calories: 265, protein: 9, carbs: 49, fat: 3.3, unit: '100g' },
    'pasta': { calories: 131, protein: 5, carbs: 25, fat: 1.1, unit: '100g' },
    'oats': { calories: 389, protein: 17, carbs: 66, fat: 7, unit: '100g' },

    // Nuts & Seeds
    'almonds': { calories: 579, protein: 21, carbs: 22, fat: 50, unit: '100g' },
    'peanuts': { calories: 567, protein: 26, carbs: 16, fat: 49, unit: '100g' },
    'seeds': { calories: 500, protein: 20, carbs: 30, fat: 40, unit: '100g' },
}

/**
 * Enhanced food detection with fuzzy matching
 */
export function findNutritionData(
    detectedLabel: string
): { label: string; calories: number; protein: number; carbs: number; fat: number; unit: string } | null {
    const lower = detectedLabel.toLowerCase().trim()

    // Exact match
    if (nutritionDatabase[lower]) {
        return { label: detectedLabel, ...nutritionDatabase[lower] }
    }

    // Fuzzy match - check if detected label contains database keys
    for (const [key, values] of Object.entries(nutritionDatabase)) {
        if (lower.includes(key) || key.includes(lower)) {
            return { label: key, ...values }
        }
    }

    // Last resort - find closest match by similarity
    let bestMatch = null
    let bestScore = 0

    for (const [key] of Object.entries(nutritionDatabase)) {
        const score = calculateSimilarity(lower, key)
        if (score > bestScore && score > 0.6) {
            bestScore = score
            bestMatch = key
        }
    }

    if (bestMatch) {
        return { label: bestMatch, ...nutritionDatabase[bestMatch] }
    }

    return null
}

/**
 * Calculate string similarity (Levenshtein-like)
 */
function calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1

    if (longer.length === 0) return 1.0

    const editDistance = levenshteinDistance(longer, shorter)
    return (longer.length - editDistance) / longer.length
}

/**
 * Levenshtein distance algorithm
 */
function levenshteinDistance(s1: string, s2: string): number {
    const costs: number[] = []

    for (let i = 0; i <= s1.length; i++) {
        let lastValue = i
        for (let j = 0; j <= s2.length; j++) {
            if (i === 0) {
                costs[j] = j
            } else if (j > 0) {
                let newValue = costs[j - 1]
                if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
                    newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1
                }
                costs[j - 1] = lastValue
                lastValue = newValue
            }
        }
        if (i > 0) costs[s2.length] = lastValue
    }

    return costs[s2.length]
}

export default nutritionDatabase

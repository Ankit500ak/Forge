/**
 * Food Logging Service (Mock/In-Memory)
 * Manages daily food intake logs and calorie tracking
 * Currently uses in-memory storage for rapid testing
 * Can be extended to use PostgreSQL when database is ready
 */

// In-memory storage for food logs (user_id -> array of logs)
const foodLogs = new Map();
const dailySummaries = new Map();

class FoodLoggingService {
    /**
     * Initialize database tables (if they don't exist)
     * Currently does nothing - using in-memory storage
     */
    static async initializeTables() {
        console.log('✅ Food logging service initialized (in-memory mode)');
        return { status: 'success', message: 'Initialized' };
    }

    /**
     * Log a food intake entry
     */
    static async logFood(userId, foodData) {
        try {
            if (!userId) throw new Error('User ID is required');
            if (!foodData.food_name) throw new Error('Food name is required');
            if (!foodData.calories && foodData.calories !== 0) throw new Error('Calories is required');

            // Create log entry
            const logEntry = {
                id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                user_id: userId,
                food_name: foodData.food_name,
                calories: Math.round(foodData.calories),
                protein: foodData.protein || 0,
                carbs: foodData.carbs || 0,
                fats: foodData.fats || 0,
                fiber: foodData.fiber || 0,
                sodium: foodData.sodium || 0,
                calcium: foodData.calcium || 0,
                iron: foodData.iron || 0,
                vitamin_c: foodData.vitaminC || 0,
                folate: foodData.folate || 0,
                serving_size: foodData.servingSize || '1 serving',
                food_source: foodData.source || 'csv',
                image_url: foodData.imageUrl || null,
                confidence: foodData.confidence || null,
                logged_at: new Date().toISOString(),
                created_at: new Date().toISOString()
            };

            // Store in memory
            if (!foodLogs.has(userId)) {
                foodLogs.set(userId, []);
            }
            foodLogs.get(userId).push(logEntry);

            // Update daily summary
            const today = new Date().toISOString().split('T')[0];
            await this.updateDailySummary(userId, today);

            console.log(`✅ Food logged: ${foodData.food_name} (${foodData.calories} cal) for user ${userId}`);

            return {
                status: 'success',
                message: 'Food logged successfully',
                data: logEntry
            };

        } catch (error) {
            console.error('❌ Error logging food:', error);
            return {
                status: 'error',
                message: error.message
            };
        }
    }

    /**
     * Update daily summary (called after logging food)
     */
    static async updateDailySummary(userId, date) {
        try {
            // Get all food logs for the user on this date
            const userLogs = foodLogs.get(userId) || [];
            const dateLogs = userLogs.filter(log => {
                const logDate = log.logged_at.split('T')[0];
                return logDate === date;
            });

            // Calculate totals
            const totals = {
                user_id: userId,
                date: date,
                total_calories: dateLogs.reduce((sum, log) => sum + (log.calories || 0), 0),
                total_protein: dateLogs.reduce((sum, log) => sum + (log.protein || 0), 0),
                total_carbs: dateLogs.reduce((sum, log) => sum + (log.carbs || 0), 0),
                total_fats: dateLogs.reduce((sum, log) => sum + (log.fats || 0), 0),
                total_fiber: dateLogs.reduce((sum, log) => sum + (log.fiber || 0), 0),
                meal_count: dateLogs.length,
                updated_at: new Date().toISOString()
            };

            // Store daily summary
            const summaryKey = `${userId}-${date}`;
            dailySummaries.set(summaryKey, totals);

            return {
                status: 'success',
                totals: totals
            };

        } catch (error) {
            console.error('❌ Error updating daily summary:', error);
            return {
                status: 'error',
                message: error.message
            };
        }
    }

    /**
     * Get today's food logs and summary
     */
    static async getTodayLogs(userId) {
        try {
            const today = new Date().toISOString().split('T')[0];

            // Get logs for today
            const userLogs = foodLogs.get(userId) || [];
            const todayLogs = userLogs.filter(log => {
                const logDate = log.logged_at.split('T')[0];
                return logDate === today;
            }).sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime());

            // Get summary
            const summaryKey = `${userId}-${today}`;
            const summary = dailySummaries.get(summaryKey) || {
                total_calories: 0,
                total_protein: 0,
                total_carbs: 0,
                total_fats: 0,
                total_fiber: 0,
                meal_count: 0
            };

            return {
                status: 'success',
                date: today,
                logs: todayLogs,
                summary: summary
            };

        } catch (error) {
            console.error('❌ Error getting today logs:', error);
            return {
                status: 'error',
                message: error.message
            };
        }
    }

    /**
     * Get weekly summary
     */
    static async getWeeklySummary(userId) {
        try {
            const today = new Date();
            const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

            // Get all summaries for user in the last 7 days
            const userLogs = foodLogs.get(userId) || [];
            const weekLogs = userLogs.filter(log => {
                const logDate = new Date(log.logged_at);
                return logDate >= sevenDaysAgo && logDate <= today;
            });

            // Group by date
            const dateGroups = {};
            weekLogs.forEach(log => {
                const date = log.logged_at.split('T')[0];
                if (!dateGroups[date]) {
                    dateGroups[date] = [];
                }
                dateGroups[date].push(log);
            });

            // Calculate totals per day
            const summaries = Object.entries(dateGroups).map(([date, logs]) => ({
                date: date,
                total_calories: logs.reduce((sum, log) => sum + (log.calories || 0), 0),
                total_protein: logs.reduce((sum, log) => sum + (log.protein || 0), 0),
                total_carbs: logs.reduce((sum, log) => sum + (log.carbs || 0), 0),
                total_fats: logs.reduce((sum, log) => sum + (log.fats || 0), 0),
                meal_count: logs.length
            })).sort((a, b) => new Date(b.date) - new Date(a.date));

            // Calculate weekly totals
            const weeklyTotals = {
                total_calories: summaries.reduce((sum, day) => sum + (day.total_calories || 0), 0),
                total_protein: summaries.reduce((sum, day) => sum + (day.total_protein || 0), 0),
                total_carbs: summaries.reduce((sum, day) => sum + (day.total_carbs || 0), 0),
                total_fats: summaries.reduce((sum, day) => sum + (day.total_fats || 0), 0),
                average_calories: summaries.length > 0
                    ? Math.round(summaries.reduce((sum, day) => sum + (day.total_calories || 0), 0) / summaries.length)
                    : 0,
                days_logged: summaries.length
            };

            return {
                status: 'success',
                summaries: summaries,
                weeklyTotals: weeklyTotals
            };

        } catch (error) {
            console.error('❌ Error getting weekly summary:', error);
            return {
                status: 'error',
                message: error.message
            };
        }
    }

    /**
     * Delete a food log entry
     */
    static async deleteLog(userId, logId) {
        try {
            // Get all logs for user
            const userLogs = foodLogs.get(userId) || [];
            const logIndex = userLogs.findIndex(log => log.id === logId);

            if (logIndex === -1) {
                throw new Error('Log entry not found');
            }

            // Get the date for recalculation
            const log = userLogs[logIndex];
            const logDate = log.logged_at.split('T')[0];

            // Remove the log
            userLogs.splice(logIndex, 1);

            // Recalculate daily summary
            await this.updateDailySummary(userId, logDate);

            console.log(`✅ Food log deleted: ${logId}`);
            return {
                status: 'success',
                message: 'Food log deleted'
            };

        } catch (error) {
            console.error('❌ Error deleting log:', error);
            return {
                status: 'error',
                message: error.message
            };
        }
    }
}

export default FoodLoggingService;

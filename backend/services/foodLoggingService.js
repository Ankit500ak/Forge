/**
 * Food Logging Service
 * Manages daily food intake logs and calorie tracking
 * 
 * Database schema:
 * - food_logs: Track each food item logged with nutritional info
 * - daily_summary: Aggregated daily calorie and nutrient totals
 */

import supabase from '../config/supabaseClient.js';

class FoodLoggingService {
    /**
     * Initialize database tables (if they don't exist)
     */
    static async initializeTables() {
        try {
            // Create food_logs table
            const { error: createLogsTableError } = await supabase.rpc('exec', {
                sql: `
                    CREATE TABLE IF NOT EXISTS food_logs (
                        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
                        food_name VARCHAR(255) NOT NULL,
                        calories INTEGER NOT NULL,
                        protein DECIMAL(10, 2),
                        carbs DECIMAL(10, 2),
                        fats DECIMAL(10, 2),
                        fiber DECIMAL(10, 2),
                        sodium INTEGER,
                        calcium INTEGER,
                        iron DECIMAL(10, 2),
                        vitamin_c DECIMAL(10, 2),
                        folate INTEGER,
                        serving_size VARCHAR(100),
                        food_source VARCHAR(50) DEFAULT 'csv',
                        image_url VARCHAR(500),
                        confidence DECIMAL(4, 2),
                        logged_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                    );

                    CREATE INDEX IF NOT EXISTS idx_food_logs_user_id ON food_logs(user_id);
                    CREATE INDEX IF NOT EXISTS idx_food_logs_logged_at ON food_logs(logged_at);
                    CREATE INDEX IF NOT EXISTS idx_food_logs_user_logged_at ON food_logs(user_id, logged_at);
                `
            });

            if (createLogsTableError && !createLogsTableError.message.includes('already exists')) {
                console.error('Create logs table error:', createLogsTableError);
            }

            // Create daily_summary table
            const { error: createSummaryTableError } = await supabase.rpc('exec', {
                sql: `
                    CREATE TABLE IF NOT EXISTS daily_summaries (
                        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
                        date DATE NOT NULL,
                        total_calories INTEGER DEFAULT 0,
                        total_protein DECIMAL(10, 2) DEFAULT 0,
                        total_carbs DECIMAL(10, 2) DEFAULT 0,
                        total_fats DECIMAL(10, 2) DEFAULT 0,
                        total_fiber DECIMAL(10, 2) DEFAULT 0,
                        meal_count INTEGER DEFAULT 0,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                        UNIQUE(user_id, date)
                    );

                    CREATE INDEX IF NOT EXISTS idx_daily_summaries_user_id ON daily_summaries(user_id);
                    CREATE INDEX IF NOT EXISTS idx_daily_summaries_date ON daily_summaries(date);
                    CREATE INDEX IF NOT EXISTS idx_daily_summaries_user_date ON daily_summaries(user_id, date);
                `
            });

            if (createSummaryTableError && !createSummaryTableError.message.includes('already exists')) {
                console.error('Create summary table error:', createSummaryTableError);
            }

            console.log('✅ Food logging tables initialized');

        } catch (error) {
            console.error('❌ Error initializing tables:', error);
        }
    }

    /**
     * Log a food intake entry
     */
    static async logFood(userId, foodData) {
        try {
            if (!userId) throw new Error('User ID is required');
            if (!foodData.food_name) throw new Error('Food name is required');
            if (!foodData.calories && foodData.calories !== 0) throw new Error('Calories is required');

            // Insert into food_logs
            const { data: logData, error: logError } = await supabase
                .from('food_logs')
                .insert({
                    user_id: userId,
                    food_name: foodData.food_name,
                    calories: Math.round(foodData.calories),
                    protein: foodData.protein || null,
                    carbs: foodData.carbs || null,
                    fats: foodData.fats || null,
                    fiber: foodData.fiber || null,
                    sodium: foodData.sodium || null,
                    calcium: foodData.calcium || null,
                    iron: foodData.iron || null,
                    vitamin_c: foodData.vitaminC || null,
                    folate: foodData.folate || null,
                    serving_size: foodData.servingSize || '1 serving',
                    food_source: foodData.source || 'csv',
                    image_url: foodData.imageUrl || null,
                    confidence: foodData.confidence || null,
                    logged_at: new Date().toISOString()
                })
                .select();

            if (logError) throw logError;

            // Update daily summary
            const today = new Date().toISOString().split('T')[0];
            await this.updateDailySummary(userId, today);

            return {
                status: 'success',
                message: 'Food logged successfully',
                data: logData[0]
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
            // Get all food logs for the date
            const { data: dailyLogs, error: fetchError } = await supabase
                .from('food_logs')
                .select('*')
                .eq('user_id', userId)
                .gte('logged_at', `${date}T00:00:00`)
                .lte('logged_at', `${date}T23:59:59`);

            if (fetchError) throw fetchError;

            // Calculate totals
            const totals = {
                total_calories: dailyLogs.reduce((sum, log) => sum + (log.calories || 0), 0),
                total_protein: dailyLogs.reduce((sum, log) => sum + (log.protein || 0), 0),
                total_carbs: dailyLogs.reduce((sum, log) => sum + (log.carbs || 0), 0),
                total_fats: dailyLogs.reduce((sum, log) => sum + (log.fats || 0), 0),
                total_fiber: dailyLogs.reduce((sum, log) => sum + (log.fiber || 0), 0),
                meal_count: dailyLogs.length
            };

            // Upsert daily summary
            const { error: upsertError } = await supabase
                .from('daily_summaries')
                .upsert({
                    user_id: userId,
                    date: date,
                    ...totals,
                    updated_at: new Date().toISOString()
                });

            if (upsertError && !upsertError.message.includes('duplicate')) {
                throw upsertError;
            }

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

            // Get logs
            const { data: logs, error: logsError } = await supabase
                .from('food_logs')
                .select('*')
                .eq('user_id', userId)
                .gte('logged_at', `${today}T00:00:00`)
                .lte('logged_at', `${today}T23:59:59`)
                .order('logged_at', { ascending: false });

            if (logsError) throw logsError;

            // Get summary
            const { data: summary, error: summaryError } = await supabase
                .from('daily_summaries')
                .select('*')
                .eq('user_id', userId)
                .eq('date', today)
                .single();

            if (summaryError && summaryError.code !== 'PGRST116') { // PGRST116 = no rows
                throw summaryError;
            }

            return {
                status: 'success',
                date: today,
                logs: logs || [],
                summary: summary || {
                    total_calories: 0,
                    total_protein: 0,
                    total_carbs: 0,
                    total_fats: 0,
                    total_fiber: 0,
                    meal_count: 0
                }
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
            const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
                .toISOString()
                .split('T')[0];

            const { data: summaries, error } = await supabase
                .from('daily_summaries')
                .select('*')
                .eq('user_id', userId)
                .gte('date', sevenDaysAgo)
                .order('date', { ascending: false });

            if (error) throw error;

            // Calculate weekly totals
            const weeklyTotals = {
                total_calories: summaries.reduce((sum, day) => sum + (day.total_calories || 0), 0),
                total_protein: summaries.reduce((sum, day) => sum + (day.total_protein || 0), 0),
                total_carbs: summaries.reduce((sum, day) => sum + (day.total_carbs || 0), 0),
                total_fats: summaries.reduce((sum, day) => sum + (day.total_fats || 0), 0),
                average_calories: Math.round(
                    summaries.reduce((sum, day) => sum + (day.total_calories || 0), 0) / summaries.length
                ),
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
            // Get the log to find the date
            const { data: log, error: fetchError } = await supabase
                .from('food_logs')
                .select('logged_at')
                .eq('id', logId)
                .eq('user_id', userId)
                .single();

            if (fetchError) throw fetchError;

            // Delete the log
            const { error: deleteError } = await supabase
                .from('food_logs')
                .delete()
                .eq('id', logId)
                .eq('user_id', userId);

            if (deleteError) throw deleteError;

            // Recalculate daily summary
            const logDate = log.logged_at.split('T')[0];
            await this.updateDailySummary(userId, logDate);

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

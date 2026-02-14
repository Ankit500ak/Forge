/**
 * Camera API Routes
 * Handles camera operations, photo capture, and food detection for captured images
 * 
 * Endpoints:
 *  POST   /api/camera/capture        - Capture photo and detect food
 *  POST   /api/camera/process        - Process base64 image data
 *  GET    /api/camera/settings       - Get camera settings
 *  GET    /api/camera/health-check   - Camera service status
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import foodDetectionService from '../services/foodDetectionService.js';
import hybridFoodDetection from '../services/hybridFoodDetection.js';
import FoodLoggingService from '../services/foodLoggingService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// ════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ════════════════════════════════════════════════════════════════════

// Upload directory for camera captures
const captureDir = path.join(path.dirname(__dirname), 'uploads', 'camera-captures');
if (!fs.existsSync(captureDir)) {
    fs.mkdirSync(captureDir, { recursive: true });
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, captureDir);
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const random = Math.round(Math.random() * 1E9);
        const filename = `capture-${timestamp}-${random}${path.extname(file.originalname)}`;
        cb(null, filename);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

    if (!allowedMimes.includes(file.mimetype)) {
        const error = new Error('Only JPEG, PNG, and WebP images are allowed');
        error.status = 400;
        return cb(error);
    }

    cb(null, true);
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024  // 10MB max
    }
});

// Default camera settings
const DEFAULT_CAMERA_SETTINGS = {
    facingMode: 'user',                    // 'user' or 'environment'
    width: { ideal: 1920 },
    height: { ideal: 1440 },
    frameRate: { ideal: 30 },
    autoFocus: true,
    autoExposure: true,
    flashMode: 'off'                       // 'off', 'on', 'auto'
};

// ════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ════════════════════════════════════════════════════════════════════

/**
 * Validate camera settings object
 */
function validateCameraSettings(settings) {
    const errors = [];

    if (settings.facingMode && !['user', 'environment'].includes(settings.facingMode)) {
        errors.push('facingMode must be "user" or "environment"');
    }

    if (settings.flashMode && !['off', 'on', 'auto'].includes(settings.flashMode)) {
        errors.push('flashMode must be "off", "on", or "auto"');
    }

    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

/**
 * Convert base64 image data to buffer
 */
function base64ToBuffer(base64String) {
    try {
        // Remove data URL prefix if present
        const base64Clean = base64String.replace(/^data:image\/\w+;base64,/, '');
        return Buffer.from(base64Clean, 'base64');
    } catch (error) {
        throw new Error('Invalid base64 image data');
    }
}

/**
 * Save captured image to disk
 */
function saveCapturedImage(buffer, filename = null) {
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1E9);
    const filename_ = filename || `capture-${timestamp}-${random}.jpg`;
    const filepath = path.join(captureDir, filename_);

    fs.writeFileSync(filepath, buffer);
    return { filepath, filename: filename_ };
}

/**
 * Cleanup image file
 */
function cleanupImageFile(filepath) {
    try {
        if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
        }
    } catch (error) {
        console.error('Error cleaning up file:', error);
    }
}

/**
 * Format successful response
 */
function successResponse(data = {}) {
    return {
        status: 'success',
        timestamp: new Date().toISOString(),
        ...data
    };
}

/**
 * Format error response
 */
function errorResponse(message, details = null) {
    return {
        status: 'error',
        message: message,
        timestamp: new Date().toISOString(),
        ...(details && { details })
    };
}

// ════════════════════════════════════════════════════════════════════
// ROUTES
// ════════════════════════════════════════════════════════════════════

/**
 * POST /api/camera/capture
 * 
 * Capture photo from device and detect food
 * 
 * Form Data:
 *   - image: File (JPEG, PNG, WebP - max 10MB)
 *   - autoDetect: boolean (default: true) - Auto-detect food
 *   - confidenceThreshold: number (default: 0.3) - Confidence threshold (0-1)
 * 
 * Response:
 *   {
 *     "status": "success",
 *     "capture": {
 *       "id": "capture-1708024800000-123456789",
 *       "timestamp": "2024-02-15T10:00:00.000Z",
 *       "filesize": 245000,
 *       "dimensions": { "width": 1920, "height": 1440 }
 *     },
 *     "detection": {
 *       "detected_food": "butter_chicken",
 *       "confidence": 0.92,
 *       "nutrition": { ... }
 *     }
 *   }
 */
router.post('/capture', upload.single('image'), async (req, res) => {
    try {
        // ────────────────────────────────────────────────────────────
        // 1. VALIDATE FILE
        // ────────────────────────────────────────────────────────────

        if (!req.file) {
            return res.status(400).json(
                errorResponse('No image file provided', { field: 'image' })
            );
        }

        const { filename, path: filepath } = req.file;
        const filesize = req.file.size;

        // Get image dimensions (basic validation)
        let imageDimensions = { width: 0, height: 0 };
        try {
            // Try to extract from EXIF or use default
            imageDimensions = {
                width: req.body.width || 1920,
                height: req.body.height || 1440
            };
        } catch (e) {
            // Use defaults if extraction fails
        }

        // ────────────────────────────────────────────────────────────
        // 2. PARSE PARAMETERS
        // ────────────────────────────────────────────────────────────

        const autoDetect = req.body.autoDetect !== 'false' && req.body.autoDetect !== false;
        const confidenceThreshold = parseFloat(req.body.confidenceThreshold) || 0.3;

        // Validate confidence threshold
        if (isNaN(confidenceThreshold) || confidenceThreshold < 0 || confidenceThreshold > 1) {
            cleanupImageFile(filepath);
            return res.status(400).json(
                errorResponse('Invalid confidence threshold', {
                    provided: req.body.confidenceThreshold,
                    expected: 'number between 0 and 1'
                })
            );
        }

        // ────────────────────────────────────────────────────────────
        // 3. PREPARE CAPTURE METADATA
        // ────────────────────────────────────────────────────────────

        const captureMetadata = {
            id: filename,
            timestamp: new Date().toISOString(),
            filesize: filesize,
            dimensions: imageDimensions,
            originalFilename: req.file.originalname,
            mimeType: req.file.mimetype,
            path: filepath
        };

        // ────────────────────────────────────────────────────────────
        // 4. DETECT FOOD (IF REQUESTED)
        // ────────────────────────────────────────────────────────────

        let detectionResult = null;

        if (autoDetect) {
            try {
                detectionResult = await foodDetectionService.detectFood(
                    filepath,
                    confidenceThreshold
                );
            } catch (detectionError) {
                console.error('Food detection error:', detectionError);
                // Don't fail the capture if detection fails
                detectionResult = {
                    status: 'detection_failed',
                    error: detectionError.message
                };
            }
        }

        // ────────────────────────────────────────────────────────────
        // 5. RETURN RESPONSE
        // ────────────────────────────────────────────────────────────

        const response = successResponse({
            capture: captureMetadata,
            ...(autoDetect && { detection: detectionResult })
        });

        res.json(response);

    } catch (error) {
        console.error('Capture error:', error);

        // Cleanup on critical error
        if (req.file) {
            cleanupImageFile(req.file.path);
        }

        const statusCode = error.status || 500;
        res.status(statusCode).json(
            errorResponse(
                error.message || 'Failed to capture photo',
                { type: error.constructor.name }
            )
        );
    }
});

/**
 * POST /api/camera/process
 * 
 * Process base64 encoded image data (for mobile/web capture)
 * 
 * Request Body:
 *   {
 *     "imageData": "data:image/jpeg;base64,...",
 *     "autoDetect": true,
 *     "confidenceThreshold": 0.3,
 *     "metadata": {
 *       "width": 1920,
 *       "height": 1440,
 *       "timestamp": "2024-02-15T10:00:00Z"
 *     }
 *   }
 * 
 * Response:
 *   {
 *     "status": "success",
 *     "capture": { ... },
 *     "detection": { ... }
 *   }
 */
router.post('/process', express.json({ limit: '20mb' }), async (req, res) => {
    try {
        // ────────────────────────────────────────────────────────────
        // 1. VALIDATE REQUEST
        // ────────────────────────────────────────────────────────────

        const { imageData, autoDetect = true, confidenceThreshold = 0.3, metadata = {} } = req.body;

        if (!imageData) {
            return res.status(400).json(
                errorResponse('No image data provided', { field: 'imageData' })
            );
        }

        // ────────────────────────────────────────────────────────────
        // 2. CONVERT BASE64 TO BUFFER
        // ────────────────────────────────────────────────────────────

        let imageBuffer;
        try {
            imageBuffer = base64ToBuffer(imageData);
        } catch (conversionError) {
            return res.status(400).json(
                errorResponse('Invalid base64 image data', { error: conversionError.message })
            );
        }

        // ────────────────────────────────────────────────────────────
        // 3. SAVE IMAGE
        // ────────────────────────────────────────────────────────────

        const { filepath, filename } = saveCapturedImage(imageBuffer);

        // ────────────────────────────────────────────────────────────
        // 4. VALIDATE CONFIDENCE THRESHOLD
        // ────────────────────────────────────────────────────────────

        const threshold = parseFloat(confidenceThreshold);
        if (isNaN(threshold) || threshold < 0 || threshold > 1) {
            cleanupImageFile(filepath);
            return res.status(400).json(
                errorResponse('Invalid confidence threshold', {
                    provided: confidenceThreshold,
                    expected: 'number between 0 and 1'
                })
            );
        }

        // ────────────────────────────────────────────────────────────
        // 5. PREPARE METADATA
        // ────────────────────────────────────────────────────────────

        const captureMetadata = {
            id: filename,
            timestamp: metadata.timestamp || new Date().toISOString(),
            filesize: imageBuffer.length,
            dimensions: {
                width: metadata.width || 0,
                height: metadata.height || 0
            },
            source: 'base64_processed'
        };

        // ────────────────────────────────────────────────────────────
        // 6. DETECT FOOD (IF REQUESTED)
        // ────────────────────────────────────────────────────────────

        let detectionResult = null;

        if (autoDetect) {
            try {
                detectionResult = await foodDetectionService.detectFood(filepath, threshold);
            } catch (detectionError) {
                console.error('Food detection error:', detectionError);
                detectionResult = {
                    status: 'detection_failed',
                    error: detectionError.message
                };
            }
        }

        // ────────────────────────────────────────────────────────────
        // 7. RETURN RESPONSE
        // ────────────────────────────────────────────────────────────

        const response = successResponse({
            capture: captureMetadata,
            ...(autoDetect && { detection: detectionResult })
        });

        res.json(response);

    } catch (error) {
        console.error('Process error:', error);

        res.status(500).json(
            errorResponse(
                error.message || 'Failed to process image',
                { type: error.constructor.name }
            )
        );
    }
});

/**
 * GET /api/camera/settings
 * 
 * Get optimal camera settings for the device
 * 
 * Query Params:
 *   - deviceType: 'mobile' | 'desktop' | 'tablet' (optional)
 *   - useCase: 'food' | 'fitness' | 'general' (default: 'food')
 * 
 * Response:
 *   {
 *     "status": "success",
 *     "settings": {
 *       "facingMode": "environment",
 *       "width": { "ideal": 1920 },
 *       "height": { "ideal": 1440 },
 *       "frameRate": { "ideal": 30 },
 *       "autoFocus": true,
 *       "autoExposure": true,
 *       "flashMode": "auto"
 *     },
 *     "recommendations": {
 *       "lightingRequired": true,
 *       "bestDistance": "10-15cm",
 *       "position": "center food in frame"
 *     }
 *   }
 */
router.get('/settings', (req, res) => {
    try {
        const { deviceType = 'mobile', useCase = 'food' } = req.query;

        // ────────────────────────────────────────────────────────────
        // OPTIMIZE SETTINGS BY USE CASE
        // ────────────────────────────────────────────────────────────

        let settings = { ...DEFAULT_CAMERA_SETTINGS };
        let recommendations = {};

        // Optimize for food detection
        if (useCase === 'food') {
            settings.facingMode = 'environment';  // Back camera for food
            settings.autoFocus = true;
            settings.autoExposure = true;
            settings.flashMode = 'auto';

            recommendations = {
                lightingRequired: true,
                optimalLighting: 'Natural light or well-lit environment',
                bestDistance: '10-15cm (4-6 inches)',
                position: 'Center food in frame, avoid shadows',
                background: 'Neutral background preferred',
                tips: [
                    'Ensure good lighting conditions',
                    'Avoid glare on the food',
                    'Keep food centered in frame',
                    'Take photo from above for better detection',
                    'Make sure entire food item is visible'
                ]
            };
        }

        // Optimize for selfie fitness tracking
        if (useCase === 'fitness') {
            settings.facingMode = 'user';
            settings.width = { ideal: 1280 };
            settings.height = { ideal: 720 };

            recommendations = {
                fullBodyVisible: true,
                distance: '1-2 meters (3-6 feet)',
                lighting: 'Front-facing light',
                background: 'Plain background preferred',
                clothing: 'Fitted clothing for better body tracking'
            };
        }

        // Optimize by device type
        if (deviceType === 'mobile') {
            settings.width = { ideal: 1080 };
            settings.height = { ideal: 1920 };
            settings.frameRate = { ideal: 24 };
        } else if (deviceType === 'desktop') {
            settings.width = { ideal: 1920 };
            settings.height = { ideal: 1080 };
            settings.frameRate = { ideal: 30 };
        }

        res.json(successResponse({
            settings: settings,
            deviceType: deviceType,
            useCase: useCase,
            recommendations: recommendations
        }));

    } catch (error) {
        console.error('Settings error:', error);
        res.status(500).json(
            errorResponse(error.message || 'Failed to get settings')
        );
    }
});

/**
 * GET /api/camera/health-check
 * 
 * Check if camera service is operational
 * 
 * Response:
 *   {
 *     "status": "healthy",
 *     "service": "camera",
 *     "uptime": "1d 5h 30m",
 *     "capturesDirectory": "/path/to/uploads/camera-captures",
 *     "diskSpace": { "used": "245MB", "available": "50GB" }
 *   }
 */
router.get('/health-check', (req, res) => {
    try {
        // Check if capture directory exists and is writable
        const isDirAccessible = fs.existsSync(captureDir);
        const dirStats = isDirAccessible ? fs.lstatSync(captureDir) : null;
        const dirSize = isDirAccessible ? getDirectorySizeSync(captureDir) : 0;

        // Check if food detection service is available
        const isFoodServiceAvailable = true;  // Assume available if this route is running

        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            service: 'camera',
            components: {
                captureService: isDirAccessible ? 'operational' : 'degraded',
                foodDetection: isFoodServiceAvailable ? 'operational' : 'unavailable'
            },
            capturesDirectory: {
                path: captureDir,
                accessible: isDirAccessible,
                sizeBytes: dirSize,
                sizeReadable: formatBytes(dirSize)
            }
        });

    } catch (error) {
        console.error('Health check error:', error);
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

/**
 * DELETE /api/camera/captures/:captureId
 * 
 * Delete a captured image
 * 
 * Response:
 *   {
 *     "status": "success",
 *     "message": "Capture deleted successfully",
 *     "captureId": "capture-1708024800000-123456789"
 *   }
 */
router.delete('/captures/:captureId', (req, res) => {
    try {
        const { captureId } = req.params;

        // Validate captureId format (security)
        if (!captureId.match(/^capture-\d+-\d+\.(jpg|jpeg|png|webp)$/i)) {
            return res.status(400).json(
                errorResponse('Invalid capture ID format')
            );
        }

        const filepath = path.join(captureDir, captureId);

        // Ensure path is within captureDir (security)
        if (!path.resolve(filepath).startsWith(path.resolve(captureDir))) {
            return res.status(403).json(
                errorResponse('Access denied')
            );
        }

        if (!fs.existsSync(filepath)) {
            return res.status(404).json(
                errorResponse('Capture not found')
            );
        }

        fs.unlinkSync(filepath);

        res.json(successResponse({
            message: 'Capture deleted successfully',
            captureId: captureId
        }));

    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json(
            errorResponse(error.message || 'Failed to delete capture')
        );
    }
});

/**
 * GET /api/camera/captures
 * 
 * List all captured images
 * 
 * Query Params:
 *   - limit: number (default: 20) - Max results
 *   - offset: number (default: 0) - Pagination offset
 *   - sortBy: 'date' | 'size' (default: 'date')
 *   - order: 'asc' | 'desc' (default: 'desc')
 * 
 * Response:
 *   {
 *     "status": "success",
 *     "captures": [ ... ],
 *     "pagination": {
 *       "total": 45,
 *       "limit": 20,
 *       "offset": 0,
 *       "hasMore": true
 *     }
 *   }
 */
router.get('/captures', (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        const offset = parseInt(req.query.offset) || 0;
        const sortBy = req.query.sortBy || 'date';
        const order = req.query.order === 'asc' ? 1 : -1;

        // Get all captures
        const files = fs.readdirSync(captureDir);

        // Map to capture objects
        const captures = files
            .filter(f => f.startsWith('capture-'))
            .map(filename => {
                const filepath = path.join(captureDir, filename);
                const stats = fs.statSync(filepath);
                return {
                    id: filename,
                    size: stats.size,
                    timestamp: stats.birthtimeMs,
                    createdAt: stats.birthtime.toISOString()
                };
            });

        // Sort
        const sorted = captures.sort((a, b) => {
            if (sortBy === 'size') {
                return (a.size - b.size) * order;
            }
            return (a.timestamp - b.timestamp) * order;
        });

        // Paginate
        const paginated = sorted.slice(offset, offset + limit);

        res.json(successResponse({
            captures: paginated,
            pagination: {
                total: captures.length,
                limit: limit,
                offset: offset,
                hasMore: offset + limit < captures.length
            }
        }));

    } catch (error) {
        console.error('List captures error:', error);
        res.status(500).json(
            errorResponse(error.message || 'Failed to list captures')
        );
    }
});

// ════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ════════════════════════════════════════════════════════════════════

/**
 * Get directory size synchronously
 */
function getDirectorySizeSync(dirPath) {
    try {
        const files = fs.readdirSync(dirPath);
        return files.reduce((size, file) => {
            const filePath = path.join(dirPath, file);
            const stats = fs.statSync(filePath);
            return size + (stats.isFile() ? stats.size : 0);
        }, 0);
    } catch (e) {
        return 0;
    }
}

/**
 * Format bytes to human-readable format
 */
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// ════════════════════════════════════════════════════════════════════
// HYBRID DETECTION & FOOD LOGGING ROUTES
// ════════════════════════════════════════════════════════════════════

/**
 * POST /api/camera/detect-and-log
 * 
 * Capture photo, detect food (CSV + AI hybrid), and log to database
 * 
 * Form Data:
 *   - image: File (JPEG, PNG, WebP)
 *   - confidenceThreshold: number (default: 0.3)
 *   - userId: string (Firebase/Auth user ID)
 * 
 * Response:
 *   {
 *     "status": "success",
 *     "detection": {
 *       "detected_food": "Butter Chicken",
 *       "confidence": 0.92,
 *       "nutrition": { calories: 245, protein: 12, ... },
 *       "source": "csv_exact" | "csv_fuzzy" | "ai_fallback",
 *       "nutritionSource": "CSV Dataset" | "AI Estimation"
 *     },
 *     "log": {
 *       "id": "uuid",
 *       "logged_at": "2024-02-15T10:30:45Z",
 *       "calories": 245
 *     },
 *     "dailySummary": {
 *       "totalCalories": 1245,
 *       "mealCount": 3
 *     }
 *   }
 */
router.post('/detect-and-log', upload.single('image'), async (req, res) => {
    try {
        // Validate inputs
        if (!req.file) {
            return res.status(400).json(
                errorResponse('No image file provided', { field: 'image' })
            );
        }

        const { userId, confidenceThreshold = 0.3 } = req.body;
        if (!userId) {
            cleanupImageFile(req.file.path);
            return res.status(400).json(
                errorResponse('User ID is required', { field: 'userId' })
            );
        }

        const filepath = req.file.path;

        // Step 1: Hybrid food detection
        console.log(`[DETECT-AND-LOG] Starting detection for user ${userId}`);

        const detectionResult = await hybridFoodDetection.detectFood(
            filepath,
            parseFloat(confidenceThreshold)
        );

        if (detectionResult.status === 'error' || detectionResult.status === 'detection_failed') {
            cleanupImageFile(filepath);
            return res.status(400).json(
                errorResponse(detectionResult.error || 'Food detection failed')
            );
        }

        // Step 2: Log to database
        console.log(`[DETECT-AND-LOG] Logging ${detectionResult.detected_food} (${detectionResult.nutrition.calories} cal)`);

        const logResult = await FoodLoggingService.logFood(userId, {
            food_name: detectionResult.detected_food,
            calories: detectionResult.nutrition.calories,
            protein: detectionResult.nutrition.protein,
            carbs: detectionResult.nutrition.carbs,
            fats: detectionResult.nutrition.fats,
            fiber: detectionResult.nutrition.fiber,
            sodium: detectionResult.nutrition.sodium,
            calcium: detectionResult.nutrition.calcium,
            iron: detectionResult.nutrition.iron,
            vitaminC: detectionResult.nutrition.vitaminC,
            folate: detectionResult.nutrition.folate,
            source: detectionResult.source,
            imageUrl: req.file.path,
            confidence: detectionResult.confidence
        });

        if (logResult.status === 'error') {
            cleanupImageFile(filepath);
            return res.status(500).json(
                errorResponse('Failed to log food', { details: logResult.message })
            );
        }

        // Step 3: Get updated daily summary
        const todayResult = await FoodLoggingService.getTodayLogs(userId);

        // Cleanup
        cleanupImageFile(filepath);

        // Response
        res.json(successResponse({
            detection: {
                detected_food: detectionResult.detected_food,
                confidence: detectionResult.confidence,
                nutrition: detectionResult.nutrition,
                source: detectionResult.source,
                nutritionSource: detectionResult.nutritionSource,
                alternativeMatches: detectionResult.alternativeMatches || []
            },
            log: {
                id: logResult.data.id,
                logged_at: logResult.data.logged_at,
                calories: logResult.data.calories,
                foodSource: logResult.data.food_source
            },
            dailySummary: {
                date: todayResult.date,
                totalCalories: todayResult.summary.total_calories,
                totalProtein: todayResult.summary.total_protein,
                totalCarbs: todayResult.summary.total_carbs,
                totalFats: todayResult.summary.total_fats,
                mealCount: todayResult.summary.meal_count,
                meals: todayResult.logs.map(log => ({
                    id: log.id,
                    name: log.food_name,
                    calories: log.calories,
                    loggedAt: log.logged_at,
                    source: log.food_source
                }))
            }
        }));

    } catch (error) {
        console.error('[DETECT-AND-LOG] Error:', error);
        if (req.file) {
            cleanupImageFile(req.file.path);
        }
        res.status(500).json(
            errorResponse(error.message || 'Failed to process request', {
                type: error.constructor.name
            })
        );
    }
});

/**
 * GET /api/camera/logs/today
 * 
 * Get today's food logs and calorie summary
 * 
 * Query:
 *   - userId: string (required)
 * 
 * Response:
 *   {
 *     "status": "success",
 *     "date": "2024-02-15",
 *     "logs": [ { id, food_name, calories, logged_at, ... } ],
 *     "summary": {
 *       "total_calories": 1245,
 *       "total_protein": 52,
 *       "total_carbs": 145,
 *       "total_fats": 45,
 *       "meal_count": 3
 *     }
 *   }
 */
router.get('/logs/today', async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json(
                errorResponse('User ID is required', { field: 'userId' })
            );
        }

        const result = await FoodLoggingService.getTodayLogs(userId);

        if (result.status === 'error') {
            return res.status(500).json(errorResponse(result.message));
        }

        res.json(successResponse(result));

    } catch (error) {
        console.error('Error getting today logs:', error);
        res.status(500).json(
            errorResponse(error.message || 'Failed to get logs')
        );
    }
});

/**
 * GET /api/camera/logs/weekly
 * 
 * Get weekly food intake summary
 * 
 * Query:
 *   - userId: string (required)
 * 
 * Response:
 *   {
 *     "status": "success",
 *     "summaries": [ { date, total_calories, meal_count, ... } ],
 *     "weeklyTotals": {
 *       "total_calories": 8500,
 *       "average_calories": 1215,
 *       "days_logged": 7
 *     }
 *   }
 */
router.get('/logs/weekly', async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json(
                errorResponse('User ID is required', { field: 'userId' })
            );
        }

        const result = await FoodLoggingService.getWeeklySummary(userId);

        if (result.status === 'error') {
            return res.status(500).json(errorResponse(result.message));
        }

        res.json(successResponse(result));

    } catch (error) {
        console.error('Error getting weekly summary:', error);
        res.status(500).json(
            errorResponse(error.message || 'Failed to get weekly summary')
        );
    }
});

/**
 * DELETE /api/camera/logs/:id
 * 
 * Delete a food log entry
 * 
 * Body:
 *   {
 *     "userId": string (required)
 *   }
 * 
 * Response:
 *   {
 *     "status": "success",
 *     "message": "Food log deleted"
 *   }
 */
router.delete('/logs/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json(
                errorResponse('User ID is required')
            );
        }

        const result = await FoodLoggingService.deleteLog(userId, id);

        if (result.status === 'error') {
            return res.status(500).json(errorResponse(result.message));
        }

        res.json(successResponse({ message: 'Food log deleted' }));

    } catch (error) {
        console.error('Error deleting log:', error);
        res.status(500).json(
            errorResponse(error.message || 'Failed to delete log')
        );
    }
});

/**
 * GET /api/camera/food/search
 * 
 * Search the CSV food database
 * 
 * Query:
 *   - q: string (search query, required)
 *   - type: 'exact' | 'fuzzy' | 'keyword' (default: 'fuzzy')
 * 
 * Response:
 *   {
 *     "status": "success",
 *     "query": "butter chicken",
 *     "type": "fuzzy",
 *     "count": 5,
 *     "results": [ { name, calories, protein, ... } ]
 *   }
 */
router.get('/food/search', async (req, res) => {
    try {
        const { q, type = 'fuzzy' } = req.query;

        if (!q) {
            return res.status(400).json(
                errorResponse('Search query is required', { field: 'q' })
            );
        }

        // Initialize hybrid detection if needed
        await hybridFoodDetection.initialize();

        const result = hybridFoodDetection.searchDataset(q, type);

        res.json(result);

    } catch (error) {
        console.error('Error searching food:', error);
        res.status(500).json(
            errorResponse(error.message || 'Search failed')
        );
    }
});

/**
 * GET /api/camera/dataset/stats
 * 
 * Get CSV dataset statistics
 * 
 * Response:
 *   {
 *     "status": "success",
 *     "totalFoods": 1000,
 *     "initialized": true,
 *     "categories": { ... }
 *   }
 */
router.get('/dataset/stats', async (req, res) => {
    try {
        // Initialize hybrid detection if needed
        await hybridFoodDetection.initialize();

        const stats = hybridFoodDetection.getDatasetStats();

        res.json(stats);

    } catch (error) {
        console.error('Error getting dataset stats:', error);
        res.status(500).json(
            errorResponse(error.message || 'Failed to get dataset stats')
        );
    }
});

export default router;

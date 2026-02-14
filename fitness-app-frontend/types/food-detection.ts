/**
 * Type Definitions for Food Detection System
 * 
 * Comprehensive TypeScript interfaces and types for:
 * - Camera operations
 * - Food detection results
 * - API responses
 * - Nutrition data
 * - Settings and configurations
 */

// ════════════════════════════════════════════════════════════════════
// CAMERA TYPES
// ════════════════════════════════════════════════════════════════════

export interface CameraConstraints extends MediaStreamConstraints {
    video?: VideoConstraints | boolean;
    audio?: boolean;
}

export interface VideoConstraints extends MediaTrackConstraints {
    facingMode?: ConstrainDOMString;
    width?: ConstrainULong;
    height?: ConstrainULong;
    frameRate?: ConstrainDoubleRange;
    aspectRatio?: ConstrainDoubleRange;
}

export interface CameraSettings {
    facingMode: 'user' | 'environment' | 'left' | 'right';
    width: { ideal: number };
    height: { ideal: number };
    frameRate: { ideal: number };
    aspectRatio?: { ideal: number };
    autoFocus?: boolean;
    autoExposure?: boolean;
    flashMode?: 'off' | 'on' | 'auto' | 'torch';
    zoom?: { ideal: number };
}

export interface CameraRecommendations {
    lightingRequired?: boolean;
    optimalLighting?: string;
    bestDistance?: string;
    position?: string;
    background?: string;
    tips?: string[];
    resolution?: string;
    fps?: string;
}

export interface CameraSettingsResponse {
    settings: CameraSettings & {
        autoFocus: boolean;
        autoExposure: boolean;
        flashMode: string;
    };
    recommendations: CameraRecommendations;
    deviceOptimizations?: Record<string, unknown>;
}

// ════════════════════════════════════════════════════════════════════
// CAPTURE & DETECTION TYPES
// ════════════════════════════════════════════════════════════════════

export interface CaptureFile {
    id: string;
    timestamp: string;
    filesize: number;
    dimensions: {
        width: number;
        height: number;
    };
    path?: string;
}

export interface DetectionConfidence {
    score: number;
    percentage: number;
    level: 'low' | 'medium' | 'high' | 'very-high';
}

export interface FoodDetectionResult {
    status: 'success' | 'partial' | 'failed';
    detected_food: string;
    confidence: number;
    alternative_foods?: Array<{
        name: string;
        confidence: number;
    }>;
    nutrition?: NutritionData;
    servingSize?: string;
    recommendedServings?: string;
    healthScore?: number;
    allergies?: string[];
    error?: string;
}

export interface CaptureResponse {
    status: 'success' | 'error';
    capture?: CaptureFile;
    detection?: FoodDetectionResult;
    message?: string;
    error?: string;
    timestamp?: string;
}

// ════════════════════════════════════════════════════════════════════
// NUTRITION TYPES
// ════════════════════════════════════════════════════════════════════

export interface Macros {
    protein: number; // grams
    carbs: number; // grams
    fat: number; // grams
    fiber?: number; // grams
    sugar?: number; // grams
}

export interface MicroNutrients {
    vitamins?: Record<string, number>;
    minerals?: Record<string, number>;
    calcium?: number;
    iron?: number;
    potassium?: number;
    sodium?: number;
}

export interface NutritionData {
    calories: number; // kcal
    protein: number; // grams
    carbs: number; // grams
    fat: number; // grams
    fiber?: number;
    sugar?: number;
    salt?: number;
    // Micronutrients
    vitamins?: MicroNutrients['vitamins'];
    minerals?: MicroNutrients['minerals'];
    calcium?: number;
    iron?: number;
    potassium?: number;
    sodium?: number;
    // Indices
    glycemicIndex?: number;
    glycemicLoad?: number;
    water?: number; // percentage
}

export interface FoodNutrition {
    name: string;
    category: FoodCategory;
    servingSize: string;
    nutrition: NutritionData;
    aliases?: string[];
    cuisine?: string;
    preparationMethods?: string[];
}

export interface MealAnalysis {
    foods: FoodNutrition[];
    totals: NutritionData;
    averages: NutritionData;
    healthScore?: {
        score: number;
        level: 'low' | 'medium' | 'high';
        recommendations?: string[];
    };
    macroBreakdown?: {
        protein: number; // percentage
        carbs: number;
        fat: number;
    };
}

// ════════════════════════════════════════════════════════════════════
// FOOD DATABASE TYPES
// ════════════════════════════════════════════════════════════════════

export type FoodCategory =
    | 'Bread'
    | 'Curry'
    | 'Rice'
    | 'Meat'
    | 'Vegetarian'
    | 'Lentils'
    | 'Beverage'
    | 'Dessert'
    | 'Condiment';

export interface FoodItem {
    id: string;
    name: string;
    category: FoodCategory;
    cuisine: 'North Indian' | 'South Indian' | 'Mixed';
    description?: string;
    nutrition: NutritionData;
    defaultServingSize: string;
    servingSizeOptions?: string[];
    preparationMethods?: string[];
    aliases?: string[];
    allergens?: string[];
    vegetarian: boolean;
    vegan?: boolean;
    glutenFree?: boolean;
    spiceLevel?: 'mild' | 'medium' | 'hot' | 'very-hot';
    ingredient?: string[];
    region?: string;
    seasonalAvailability?: string[];
}

// ════════════════════════════════════════════════════════════════════
// API REQUEST/RESPONSE TYPES
// ════════════════════════════════════════════════════════════════════

export interface CaptureRequest {
    image: File | Blob;
    autoDetect?: boolean;
    confidenceThreshold?: number;
    width?: number;
    height?: number;
}

export interface ProcessBase64Request {
    image_base64: string; // data:image/jpeg;base64,...
    autoDetect?: boolean;
    confidenceThreshold?: number;
    format?: 'jpeg' | 'png';
}

export interface DetectFoodRequest {
    image: File | Blob;
    confidenceThreshold?: number;
}

export interface AnalyzeMealRequest {
    foods: Array<{
        name: string;
        amount?: string;
        quantity?: number;
        unit?: string;
    }>;
}

export interface PaginationQuery {
    page?: number;
    limit?: number;
    sortBy?: string;
    order?: 'asc' | 'desc';
}

export interface SearchQuery {
    query: string;
    limit?: number;
    category?: FoodCategory;
    vegetarian?: boolean;
}

// ════════════════════════════════════════════════════════════════════
// API RESPONSE TYPES
// ════════════════════════════════════════════════════════════════════

export interface ApiResponse<T = unknown> {
    status: 'success' | 'error' | 'partial';
    data?: T;
    message?: string;
    error?: string;
    timestamp?: string;
    requestId?: string;
}

export interface PaginatedResponse<T = unknown> {
    items: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
        hasMore: boolean;
    };
}

export interface HealthCheckResponse {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    uptime: number;
    modelLoaded: boolean;
    modelInitializing?: boolean;
    version: string;
    dependencies?: Record<string, string>;
}

export interface CapturesListResponse extends PaginatedResponse<CaptureFile> {
    captures: CaptureFile[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
        hasMore: boolean;
    };
}

export interface FoodsListResponse {
    foods: FoodItem[];
    totalCount: number;
    categories: string[];
}

export interface SearchResponse {
    results: Array<{
        name: string;
        category: FoodCategory;
        match: number; // 0-1 confidence
    }>;
    query: string;
    totalResults: number;
}

// ════════════════════════════════════════════════════════════════════
// HOOK & COMPONENT TYPES
// ════════════════════════════════════════════════════════════════════

export interface UseCameraOptions {
    defaultFacingMode?: 'user' | 'environment';
    autoStart?: boolean;
    quality?: 'low' | 'medium' | 'high';
}

export interface UseCameraReturn {
    // Methods
    startCamera: (settings?: Partial<CameraSettings>) => Promise<void>;
    stopCamera: () => void;
    switchCamera: () => Promise<void>;
    capturePhoto: (autoDetect?: boolean, confidenceThreshold?: number) => Promise<CaptureResponse | null>;
    getOptimalSettings: (useCase?: string, deviceType?: string) => Promise<CameraSettingsResponse>;

    // State
    videoRef: React.RefObject<HTMLVideoElement>;
    canvasRef: React.RefObject<HTMLCanvasElement>;
    isLoading: boolean;
    isFacingUser: boolean;
    error: string | null;
    lastCapture: CaptureResponse | null;
    cameraPermissionGranted: boolean;

    // Device info
    hasDeviceCamera: boolean;
}

export interface CameraComponentProps {
    onDetectionChange?: (result: FoodDetectionResult) => void;
    onCaptureChange?: (capture: CaptureFile) => void;
    onError?: (error: Error) => void;
    defaultConfidence?: number;
    autoDetect?: boolean;
    showHistory?: boolean;
    maxHistoryItems?: number;
}

// ════════════════════════════════════════════════════════════════════
// ERROR & STATUS TYPES
// ════════════════════════════════════════════════════════════════════

export enum ErrorCode {
    CameraNotAvailable = 'CAMERA_NOT_AVAILABLE',
    PermissionDenied = 'PERMISSION_DENIED',
    ImageCaptureFailed = 'IMAGE_CAPTURE_FAILED',
    InvalidImage = 'INVALID_IMAGE',
    ModelNotLoaded = 'MODEL_NOT_LOADED',
    DetectionFailed = 'DETECTION_FAILED',
    InvalidRequest = 'INVALID_REQUEST',
    ServerError = 'SERVER_ERROR',
    NetworkError = 'NETWORK_ERROR',
    ProcessingTimeout = 'PROCESSING_TIMEOUT',
    FileTooLarge = 'FILE_TOO_LARGE',
    InvalidMimeType = 'INVALID_MIME_TYPE',
}

export interface ErrorDetails {
    code: ErrorCode;
    message: string;
    details?: Record<string, unknown>;
    statusCode?: number;
    timestamp?: string;
}

export interface LoadingState {
    isInitializing: boolean;
    isProcessing: boolean;
    isCapturing: boolean;
    currentOperation?: string;
}

// ════════════════════════════════════════════════════════════════════
// DATABASE TYPES
// ════════════════════════════════════════════════════════════════════

export interface CaptureRecord {
    id: string;
    userId?: string;
    imageUrl: string;
    imagePath: string;
    detectFood?: string;
    confidence?: number;
    nutrition?: NutritionData;
    filesize: number;
    dimensions: { width: number; height: number };
    createdAt: Date;
    expiresAt: Date;
    metadata?: Record<string, unknown>;
}

export interface DetectionLog {
    id: string;
    captureId: string;
    detectedFood: string;
    confidence: number;
    processingTime: number;
    modelVersion: string;
    createdAt: Date;
}

// ════════════════════════════════════════════════════════════════════
// UTILITY TYPES
// ════════════════════════════════════════════════════════════════════

export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type AsyncFunction<T = unknown> = () => Promise<T>;

export interface Cache<T> {
    data: T;
    timestamp: number;
    ttl?: number;
    isExpired: () => boolean;
}

// ════════════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════════════

export const CAMERA_DEFAULTS = {
    FACING_MODE: 'environment' as const,
    WIDTH: 1920,
    HEIGHT: 1440,
    FRAME_RATE: 30,
    QUALITY: 0.95,
    AUTO_FOCUS: true,
    AUTO_EXPOSURE: true,
} as const;

export const DETECTION_DEFAULTS = {
    CONFIDENCE_THRESHOLD: 0.3,
    AUTO_DETECT: true,
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    MAX_BASE64_SIZE: 20 * 1024 * 1024, // 20MB
} as const;

export const FOOD_CATEGORIES: FoodCategory[] = [
    'Bread',
    'Curry',
    'Rice',
    'Meat',
    'Vegetarian',
    'Lentils',
    'Beverage',
    'Dessert',
    'Condiment',
];

export const SUPPORTED_FORMATS = ['image/jpeg', 'image/jpg'] as const;

// ════════════════════════════════════════════════════════════════════
// PERFORMANCE TYPES
// ════════════════════════════════════════════════════════════════════

export interface PerformanceMetrics {
    modelLoadTime: number;
    detectionTime: number;
    uploadTime: number;
    totalTime: number;
    memoryUsage?: number;
    fps?: number;
}

export interface BenchmarkResult {
    operation: string;
    iterations: number;
    averageTime: number;
    minTime: number;
    maxTime: number;
    stdDeviation: number;
}

// ════════════════════════════════════════════════════════════════════
// BATCH OPERATIONS
// ════════════════════════════════════════════════════════════════════

export interface BatchDetectionRequest {
    images: Array<{
        id: string;
        data: File | Blob | string; // file, blob, or base64
    }>;
    confidenceThreshold?: number;
    returnNutrition?: boolean;
}

export interface BatchDetectionResponse {
    results: Array<{
        id: string;
        detection: FoodDetectionResult | null;
        error?: string;
    }>;
    totalProcessed: number;
    totalSuccessful: number;
    totalFailed: number;
    processingTime: number;
}

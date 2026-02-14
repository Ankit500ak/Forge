'use client'

import { useEffect, useRef, useState } from 'react'
import * as tf from '@tensorflow/tfjs'
import * as cocoSsd from '@tensorflow-models/coco-ssd'
import { findNutritionData } from '@/lib/nutritionDatabase'
import axios from 'axios'

interface DetectedFood {
    id: string
    label: string
    confidence: number
    calories: number
    protein: number
    carbs: number
    fat: number
    unit: string
    detectedAt: number
}

interface SaveStatus {
    saving: boolean
    saved: boolean
    error: string | null
}

interface NutritionTotals {
    calories: number
    protein: number
    carbs: number
    fat: number
}

export function FoodDetectionCamera({
    onDetected,
    onClose,
    cameraIconElement,
}: {
    onDetected?: (foods: DetectedFood[]) => void
    onClose: () => void
    cameraIconElement?: HTMLElement
}) {
    // Refs
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null)
    const streamRef = useRef<MediaStream | null>(null)

    // State
    const [loading, setLoading] = useState(true)
    const [detectedFoods, setDetectedFoods] = useState<DetectedFood[]>([])
    const [modelLoaded, setModelLoaded] = useState(false)
    const [saveStatus, setSaveStatus] = useState<SaveStatus>({ saving: false, saved: false, error: null })
    const [cameraError, setCameraError] = useState<string | null>(null)
    const [totals, setTotals] = useState<NutritionTotals>({ calories: 0, protein: 0, carbs: 0, fat: 0 })
    const [detectionQuality, setDetectionQuality] = useState<'low' | 'medium' | 'high'>('medium')

    const modelRef = useRef<cocoSsd.ObjectDetection | null>(null)

    // Enhanced food taxonomy (COCO + Indian dishes)
    const FOOD_CLASS_MAP: { [key: string]: string } = {
        // Fruits
        'apple': 'apple',
        'banana': 'banana',
        'orange': 'orange',
        'donut': 'donut',

        // Vegetables
        'broccoli': 'broccoli',
        'carrot': 'carrot',

        // Proteins
        'hot dog': 'hot dog',
        'chicken': 'chicken',
        'pizza': 'pizza',
        'sandwich': 'sandwich',
        'cake': 'cake',

        // Containers (for context)
        'cup': 'cup',
        'bowl': 'bowl',
        'wine glass': 'glass',
        'fork': 'fork',
        'knife': 'knife',
        'spoon': 'spoon',
        'bottle': 'bottle',

        // Indian dishes (custom mapping)
        'rice': 'rice',
        'bread': 'bread',
        'noodle': 'noodles',
    }

    // COCO-SSD doesn't detect Indian dishes directly, so we map common items
    const INDIAN_DISH_KEYWORDS: { [key: string]: string } = {
        'rice': 'white rice',
        'bread': 'roti/naan',
        'bowl': 'curry/dal',
        'plate': 'mixed meal',
        'chicken': 'tandoori chicken',
    }

    /**
     * Initialize camera and TensorFlow model
     */
    useEffect(() => {
        const initializeCamera = async () => {
            try {
                setLoading(true)
                setCameraError(null)

                // Load COCO-SSD model
                console.log('🤖 Loading COCO-SSD model...')
                const model = await cocoSsd.load()
                modelRef.current = model
                setModelLoaded(true)
                console.log('✅ COCO-SSD model loaded successfully')

                // Request camera access
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: 'environment',
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                    },
                    audio: false,
                })

                streamRef.current = stream

                if (videoRef.current) {
                    videoRef.current.srcObject = stream
                    videoRef.current.onloadedmetadata = () => {
                        videoRef.current?.play()
                        setLoading(false)
                        startDetection()
                    }
                }
            } catch (err: any) {
                const errorMsg = err?.message || 'Failed to initialize camera'
                console.error('❌ Initialization error:', errorMsg)
                setCameraError(errorMsg)
                setLoading(false)
            }
        }

        initializeCamera()

        return () => {
            stopDetection()
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop())
            }
        }
    }, [])

    /**
     * Start real-time detection loop
     */
    const startDetection = () => {
        if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current)

        // Run detection 2x per second for smooth real-time updates
        detectionIntervalRef.current = setInterval(detectFood, 500)
    }

    /**
     * Stop detection loop
     */
    const stopDetection = () => {
        if (detectionIntervalRef.current) {
            clearInterval(detectionIntervalRef.current)
            detectionIntervalRef.current = null
        }
    }

    /**
     * Core food detection logic
     */
    const detectFood = async () => {
        if (!modelRef.current || !videoRef.current || !canvasRef.current) {
            return
        }

        try {
            const predictions = await modelRef.current.detect(videoRef.current)

            // Filter and enrich predictions with nutrition data
            const foodItems: DetectedFood[] = []
            const seenLabels = new Set<string>()

            for (const prediction of predictions) {
                const label = prediction.class.toLowerCase().trim()
                const confidence = prediction.score

                // Only process high-confidence detections
                if (confidence < 0.35) continue

                // Map to food class
                const mappedLabel = FOOD_CLASS_MAP[label] || label
                const labelKey = mappedLabel.toLowerCase()

                // Skip duplicates in this frame
                if (seenLabels.has(labelKey)) continue

                // Check if it's a food-related item
                if (!isFoodItem(label)) continue

                // Get nutrition data
                const nutritionData = findNutritionData(mappedLabel)
                if (!nutritionData) continue

                seenLabels.add(labelKey)

                foodItems.push({
                    id: `${labelKey}-${Date.now()}-${Math.random()}`,
                    label: nutritionData.label.charAt(0).toUpperCase() + nutritionData.label.slice(1),
                    confidence: Math.round(confidence * 100),
                    calories: nutritionData.calories,
                    protein: nutritionData.protein,
                    carbs: nutritionData.carbs,
                    fat: nutritionData.fat,
                    unit: nutritionData.unit,
                    detectedAt: Date.now(),
                })
            }

            // Update detected foods (keep latest 10)
            setDetectedFoods(prev => {
                const updated = [...prev]

                for (const newFood of foodItems) {
                    const existingIndex = updated.findIndex(
                        f => f.label.toLowerCase() === newFood.label.toLowerCase()
                    )

                    if (existingIndex !== -1) {
                        // Update existing item (refresh detection)
                        updated[existingIndex] = newFood
                    } else {
                        // Add new item
                        updated.push(newFood)
                    }
                }

                // Keep only recent detections
                return updated.slice(-10)
            })

            // Draw detection boxes
            drawDetections(predictions)

            // Call callback
            if (onDetected) {
                onDetected(foodItems)
            }
        } catch (err: any) {
            console.error('❌ Detection error:', err?.message)
        }
    }

    /**
     * Check if detected label is food-related
     */
    const isFoodItem = (label: string): boolean => {
        const foodKeywords = [
            'apple', 'banana', 'orange', 'broccoli', 'carrot', 'hot dog', 'pizza',
            'donut', 'cake', 'sandwich', 'cup', 'bowl', 'bottle', 'bread', 'chicken',
            'wine glass', 'fork', 'knife', 'spoon', 'food', 'fruit', 'vegetable',
            'drink', 'rice', 'noodle', 'pasta', 'plate', 'glass', 'salad', 'soup',
        ]
        return foodKeywords.some(keyword => label.includes(keyword))
    }

    /**
     * Draw bounding boxes on canvas
     */
    const drawDetections = (predictions: any[]) => {
        const canvas = canvasRef.current
        const video = videoRef.current

        if (!canvas || !video) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        for (const prediction of predictions) {
            const label = prediction.class.toLowerCase()

            if (!isFoodItem(label) || prediction.score < 0.35) continue

            const [x, y, width, height] = prediction.bbox
            const confidence = Math.round(prediction.score * 100)

            // Draw bounding box with gradient
            const gradient = ctx.createLinearGradient(x, y, x + width, y)
            gradient.addColorStop(0, '#00ff00')
            gradient.addColorStop(1, '#00aa00')

            ctx.strokeStyle = gradient
            ctx.lineWidth = 3
            ctx.shadowColor = 'rgba(0, 255, 0, 0.5)'
            ctx.shadowBlur = 8
            ctx.strokeRect(x, y, width, height)

            // Draw label background
            ctx.fillStyle = 'rgba(0, 255, 0, 0.9)'
            const textHeight = 28
            ctx.fillRect(x, y - textHeight, Math.max(width, 180), textHeight)

            // Draw label text
            ctx.fillStyle = '#000'
            ctx.font = 'bold 14px "Segoe UI", sans-serif'
            ctx.fillText(`${label} (${confidence}%)`, x + 8, y - 8)
        }
    }

    /**
     * Calculate total nutrition from detected foods
     */
    useEffect(() => {
        if (detectedFoods.length === 0) {
            setTotals({ calories: 0, protein: 0, carbs: 0, fat: 0 })
            return
        }

        const newTotals = detectedFoods.reduce(
            (acc, food) => ({
                calories: acc.calories + food.calories,
                protein: acc.protein + food.protein,
                carbs: acc.carbs + food.carbs,
                fat: acc.fat + food.fat,
            }),
            { calories: 0, protein: 0, carbs: 0, fat: 0 }
        )

        setTotals(newTotals)
    }, [detectedFoods])

    /**
     * Save detected foods to backend
     */
    const saveFoodsToBackend = async () => {
        if (detectedFoods.length === 0) {
            setSaveStatus({ saving: false, saved: false, error: 'No foods detected to save' })
            return
        }

        setSaveStatus({ saving: true, saved: false, error: null })
        console.log('💾 Saving detected foods to backend...')

        try {
            const responses = await Promise.all(
                detectedFoods.map(food =>
                    axios.post('/api/camera/save-food', {
                        food_name: food.label,
                        confidence_score: food.confidence,
                        calories: food.calories,
                        protein_g: food.protein,
                        carbs_g: food.carbs,
                        fat_g: food.fat,
                        serving_size: food.unit,
                        meal_type: 'detected',
                        source: 'coco-ssd',
                        detected_at: new Date(food.detectedAt).toISOString(),
                    })
                )
            )

            console.log(`✅ Successfully saved ${detectedFoods.length} food items (${totals.calories} kcal total)`)
            setSaveStatus({ saving: false, saved: true, error: null })

            // Close after 2 seconds
            setTimeout(() => {
                onClose()
            }, 2000)
        } catch (error: any) {
            const errorMsg = error.response?.data?.error || error.message || 'Failed to save foods'
            console.error('❌ Save error:', errorMsg)
            setSaveStatus({ saving: false, saved: false, error: errorMsg })
        }
    }

    /**
     * Remove a food from detection list
     */
    const removeFood = (id: string) => {
        setDetectedFoods(prev => prev.filter(f => f.id !== id))
    }

    /**
     * Clear all detections
     */
    const clearAllDetections = () => {
        setDetectedFoods([])
    }

    return (
        <div className="fixed inset-0 bg-black/95 backdrop-blur z-50 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50 bg-slate-900/50">
                <div className="flex items-center gap-3">
                    <div className="text-3xl">🎥</div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Food Detection</h2>
                        <p className="text-xs text-slate-400">
                            {modelLoaded ? '✅ Ready' : '⏳ Loading model...'} •
                            {detectedFoods.length > 0 && ` ${detectedFoods.length} item${detectedFoods.length !== 1 ? 's' : ''}`}
                        </p>
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="p-2 hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-white"
                    title="Close camera"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex gap-4 p-4 overflow-hidden">
                {/* Camera Feed */}
                <div className="flex-1 relative rounded-2xl overflow-hidden bg-black border border-slate-700/50 shadow-2xl">
                    {loading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-black z-10">
                            <div className="text-center space-y-4">
                                <div className="animate-spin text-5xl">⚙️</div>
                                <div>
                                    <p className="text-white font-semibold text-lg">
                                        {modelLoaded ? 'Initializing camera...' : 'Loading AI model...'}
                                    </p>
                                    <p className="text-slate-400 text-sm mt-1">Please wait</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {cameraError && (
                        <div className="absolute inset-0 flex items-center justify-center bg-red-900/30 z-10">
                            <div className="text-center text-white">
                                <p className="text-2xl mb-2">❌</p>
                                <p className="font-semibold">{cameraError}</p>
                                <p className="text-sm text-slate-300 mt-2">Check camera permissions</p>
                            </div>
                        </div>
                    )}

                    <video
                        ref={videoRef}
                        className="w-full h-full object-cover"
                        style={{ transform: 'scaleX(-1)' }}
                        autoPlay
                        playsInline
                    />

                    <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

                    {modelLoaded && !loading && (
                        <div className="absolute top-4 left-4 flex items-center gap-2 bg-emerald-500/90 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg">
                            <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                            Live Detection
                        </div>
                    )}
                </div>

                {/* Detection Results Panel */}
                <div className="w-96 bg-slate-900/70 backdrop-blur-sm rounded-2xl p-4 overflow-hidden flex flex-col border border-slate-700/50 shadow-2xl">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-lg text-white flex items-center gap-2">
                            <span>📊</span>
                            Detected Foods
                        </h3>
                        {detectedFoods.length > 0 && (
                            <button
                                onClick={clearAllDetections}
                                className="text-xs text-slate-400 hover:text-red-400 transition"
                            >
                                Clear
                            </button>
                        )}
                    </div>

                    {/* Foods List */}
                    <div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-2">
                        {detectedFoods.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 py-12">
                                <p className="text-3xl mb-2">🍽️</p>
                                <p className="font-medium">No foods detected</p>
                                <p className="text-xs mt-2">Point camera at food items</p>
                            </div>
                        ) : (
                            detectedFoods.map((food) => (
                                <div
                                    key={food.id}
                                    className="group bg-gradient-to-r from-slate-800/50 to-slate-700/30 border border-slate-600/50 rounded-xl p-3 hover:border-slate-500/80 transition"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex-1">
                                            <p className="font-bold text-white text-sm">{food.label}</p>
                                            <p className="text-xs text-slate-400">{food.unit}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="bg-green-500/80 text-white text-xs font-bold px-2 py-1 rounded-lg">
                                                {food.confidence}%
                                            </span>
                                            <button
                                                onClick={() => removeFood(food.id)}
                                                className="opacity-0 group-hover:opacity-100 transition text-slate-400 hover:text-red-400 text-sm"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div className="bg-black/40 rounded-lg p-2">
                                            <p className="text-slate-400">Calories</p>
                                            <p className="font-bold text-orange-400">{food.calories}</p>
                                        </div>
                                        <div className="bg-black/40 rounded-lg p-2">
                                            <p className="text-slate-400">Protein</p>
                                            <p className="font-bold text-green-400">{food.protein}g</p>
                                        </div>
                                        <div className="bg-black/40 rounded-lg p-2">
                                            <p className="text-slate-400">Carbs</p>
                                            <p className="font-bold text-blue-400">{food.carbs}g</p>
                                        </div>
                                        <div className="bg-black/40 rounded-lg p-2">
                                            <p className="text-slate-400">Fat</p>
                                            <p className="font-bold text-red-400">{food.fat}g</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Totals & Action */}
                    {detectedFoods.length > 0 && (
                        <div className="space-y-3 border-t border-slate-600/30 pt-4">
                            <div className="grid grid-cols-4 gap-2">
                                <div className="text-center bg-black/40 rounded-lg p-2">
                                    <p className="text-slate-400 text-xs">Kcal</p>
                                    <p className="font-bold text-orange-400 text-sm">{totals.calories}</p>
                                </div>
                                <div className="text-center bg-black/40 rounded-lg p-2">
                                    <p className="text-slate-400 text-xs">Protein</p>
                                    <p className="font-bold text-green-400 text-sm">{totals.protein.toFixed(1)}g</p>
                                </div>
                                <div className="text-center bg-black/40 rounded-lg p-2">
                                    <p className="text-slate-400 text-xs">Carbs</p>
                                    <p className="font-bold text-blue-400 text-sm">{totals.carbs.toFixed(1)}g</p>
                                </div>
                                <div className="text-center bg-black/40 rounded-lg p-2">
                                    <p className="text-slate-400 text-xs">Fat</p>
                                    <p className="font-bold text-red-400 text-sm">{totals.fat.toFixed(1)}g</p>
                                </div>
                            </div>

                            <button
                                onClick={saveFoodsToBackend}
                                disabled={saveStatus.saving || saveStatus.saved}
                                className={`w-full py-3 rounded-xl font-semibold text-white transition-all ${saveStatus.saved
                                    ? 'bg-emerald-600 text-emerald-100'
                                    : saveStatus.saving
                                        ? 'bg-slate-700 opacity-75 cursor-wait'
                                        : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 active:scale-95 shadow-lg'
                                    }`}
                            >
                                {saveStatus.saved ? (
                                    <>✅ Saved - Closing...</>
                                ) : saveStatus.saving ? (
                                    <>💾 Saving {detectedFoods.length} item{detectedFoods.length !== 1 ? 's' : ''}...</>
                                ) : (
                                    <>💾 Save {detectedFoods.length} item{detectedFoods.length !== 1 ? 's' : ''}</>
                                )}
                            </button>

                            {saveStatus.error && (
                                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-200 text-xs">
                                    ❌ {saveStatus.error}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-900/50 border-t border-slate-700/50 px-6 py-3 text-xs text-slate-400">
                <p>💡 <strong>Tips:</strong> Ensure good lighting • Keep items 30cm-1m from camera • Works best with single items initially • Detects fruits, vegetables, dishes, and more</p>
            </div>
        </div>
    )
}
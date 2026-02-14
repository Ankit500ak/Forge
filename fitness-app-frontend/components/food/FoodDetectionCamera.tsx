'use client'

import { useEffect, useRef, useState } from 'react'
import * as tf from '@tensorflow/tfjs'
import * as cocoSsd from '@tensorflow-models/coco-ssd'
import { findNutritionData } from '@/lib/nutritionDatabase'

interface DetectedFood {
    label: string
    confidence: number
    calories: number
    protein: number
    carbs: number
    fat: number
    unit: string
}

export function FoodDetectionCamera({ onDetected, onClose }: { onDetected?: (foods: DetectedFood[]) => void; onClose: () => void }) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [loading, setLoading] = useState(true)
    const [detectedFoods, setDetectedFoods] = useState<DetectedFood[]>([])
    const [modelLoaded, setModelLoaded] = useState(false)
    const modelRef = useRef<cocoSsd.ObjectDetection | null>(null)
    const animationIdRef = useRef<number>(0)

    // Food-related COCO classes
    const FOOD_CLASSES = new Set([
        'apple', 'banana', 'orange', 'broccoli', 'carrot', 'hot dog', 'pizza', 'donut',
        'cake', 'sandwich', 'cup', 'bowl', 'wine glass', 'fork', 'knife', 'spoon',
        'bottle', 'bread', 'potted plant', 'teddy bear', // Plant for produce detection
    ])

    // Initialize camera and model
    useEffect(() => {
        const initializeCamera = async () => {
            try {
                setLoading(true)

                // Load TensorFlow.js and COCO-SSD model
                console.log('🤖 Loading COCO-SSD model...')
                const model = await cocoSsd.load()
                modelRef.current = model
                setModelLoaded(true)
                console.log('✅ COCO-SSD model loaded')

                // Access camera
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
                    audio: false,
                })

                if (videoRef.current) {
                    videoRef.current.srcObject = stream
                    videoRef.current.onloadedmetadata = () => {
                        videoRef.current?.play()
                        setLoading(false)
                        detectFood()
                    }
                }
            } catch (err) {
                console.error('❌ Camera initialization failed:', err)
                setLoading(false)
            }
        }

        initializeCamera()

        return () => {
            if (animationIdRef.current) {
                cancelAnimationFrame(animationIdRef.current)
            }
            if (videoRef.current?.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream
                stream.getTracks().forEach(track => track.stop())
            }
        }
    }, [])

    // Real-time food detection
    const detectFood = async () => {
        if (!modelRef.current || !videoRef.current || !canvasRef.current) {
            animationIdRef.current = requestAnimationFrame(detectFood)
            return
        }

        try {
            // Run detection
            const predictions = await modelRef.current.estimateObjects(videoRef.current)

            // Filter for food items and enrich with nutrition data
            const foodItems: DetectedFood[] = []

            for (const prediction of predictions) {
                const label = prediction.class.toLowerCase()

                // Check if detected item is food-related
                if (isFoodItem(label)) {
                    const nutritionData = findNutritionData(label)

                    if (nutritionData && prediction.score > 0.3) {
                        foodItems.push({
                            label: nutritionData.label.toUpperCase(),
                            confidence: Math.round(prediction.score * 100),
                            calories: nutritionData.calories,
                            protein: nutritionData.protein,
                            carbs: nutritionData.carbs,
                            fat: nutritionData.fat,
                            unit: nutritionData.unit,
                        })
                    }
                }
            }

            // Remove duplicates (same food detected multiple times)
            const uniqueFoods = Array.from(
                new Map(
                    foodItems.map(item => [
                        item.label.toLowerCase(),
                        item,
                    ])
                ).values()
            )

            setDetectedFoods(uniqueFoods)
            if (onDetected) {
                onDetected(uniqueFoods)
            }

            // Draw detection boxes
            drawDetections(predictions)
        } catch (err) {
            console.error('❌ Detection error:', err)
        }

        animationIdRef.current = requestAnimationFrame(detectFood)
    }

    const isFoodItem = (label: string): boolean => {
        const foodKeywords = [
            'food', 'fruit', 'vegetable', 'drink', 'bread', 'banana', 'apple', 'orange', 'carrot',
            'broccoli', 'chicken', 'meat', 'fish', 'egg', 'pizza', 'sandwich', 'cake', 'donut',
            'rice', 'noodle', 'pasta', 'bowl', 'plate', 'cup', 'bottle', 'glass', 'spoon',
            'fork', 'knife', 'hot dog', 'salad', 'soup', 'cheese', 'milk', 'butter',
        ]
        return foodKeywords.some(keyword => label.includes(keyword))
    }

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

            if (isFoodItem(label)) {
                const [x, y, width, height] = prediction.bbox
                const confidence = Math.round(prediction.score * 100)

                // Draw bounding box
                ctx.strokeStyle = '#00ff00'
                ctx.lineWidth = 3
                ctx.strokeRect(x, y, width, height)

                // Draw label background
                ctx.fillStyle = 'rgba(0, 255, 0, 0.8)'
                const textHeight = 25
                ctx.fillRect(x, y - textHeight, width, textHeight)

                // Draw label text
                ctx.fillStyle = '#000'
                ctx.font = 'bold 16px Arial'
                ctx.fillText(`${label} (${confidence}%)`, x + 5, y - 5)
            }
        }
    }

    const calculateTotalNutrition = () => {
        if (detectedFoods.length === 0) return { calories: 0, protein: 0, carbs: 0, fat: 0 }

        return {
            calories: detectedFoods.reduce((sum, food) => sum + food.calories, 0),
            protein: detectedFoods.reduce((sum, food) => sum + food.protein, 0),
            carbs: detectedFoods.reduce((sum, food) => sum + food.carbs, 0),
            fat: detectedFoods.reduce((sum, food) => sum + food.fat, 0),
        }
    }

    const totals = calculateTotalNutrition()

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur z-50 flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-white">🍔 Food Detection Camera</h2>
                    <p className="text-xs text-purple-100">Real-time calorie & nutrition analyzer</p>
                </div>
                <button
                    onClick={onClose}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition"
                >
                    ✕ Close
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex gap-4 p-4 overflow-hidden">
                {/* Camera Feed */}
                <div className="flex-1 relative rounded-xl overflow-hidden bg-black">
                    {loading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
                            <div className="text-center">
                                <div className="animate-spin text-4xl mb-3">🔄</div>
                                <p className="text-white font-semibold">{modelLoaded ? 'Initializing camera...' : 'Loading AI model...'}</p>
                            </div>
                        </div>
                    )}

                    <video
                        ref={videoRef}
                        className="w-full h-full object-cover"
                        style={{ transform: 'scaleX(-1)' }} // Mirror for selfie-like view
                    />

                    <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

                    {/* Model Status */}
                    {modelLoaded && (
                        <div className="absolute top-4 left-4 bg-green-500/80 text-white px-3 py-1 rounded-full text-xs font-semibold">
                            ✅ Model Ready
                        </div>
                    )}
                </div>

                {/* Detection Results */}
                <div className="w-96 bg-slate-900/80 backdrop-blur rounded-xl p-4 overflow-y-auto border border-purple-500/30">
                    <h3 className="font-bold text-lg text-white mb-4">📊 Detected Foods</h3>

                    {detectedFoods.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                            <p className="text-xl mb-2">🍽️</p>
                            <p>Show food to the camera...</p>
                            <p className="text-xs mt-2">Detecting fruits, vegetables, dishes, and more</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {/* Detected Items */}
                            {detectedFoods.map((food, i) => (
                                <div key={i} className="bg-gradient-to-r from-purple-600/30 to-blue-600/30 border border-purple-500/50 rounded-lg p-3">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className="font-bold text-white text-lg">{food.label}</p>
                                            <p className="text-xs text-purple-200">{food.unit}</p>
                                        </div>
                                        <span className="bg-green-500/80 text-white text-xs font-bold px-2 py-1 rounded">
                                            {food.confidence}%
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div className="bg-black/40 rounded p-2">
                                            <p className="text-slate-400">Calories</p>
                                            <p className="font-bold text-orange-400 text-lg">{food.calories}</p>
                                        </div>
                                        <div className="bg-black/40 rounded p-2">
                                            <p className="text-slate-400">Protein</p>
                                            <p className="font-bold text-green-400 text-lg">{food.protein}g</p>
                                        </div>
                                        <div className="bg-black/40 rounded p-2">
                                            <p className="text-slate-400">Carbs</p>
                                            <p className="font-bold text-blue-400 text-lg">{food.carbs}g</p>
                                        </div>
                                        <div className="bg-black/40 rounded p-2">
                                            <p className="text-slate-400">Fat</p>
                                            <p className="font-bold text-red-400 text-lg">{food.fat}g</p>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Totals */}
                            {detectedFoods.length > 0 && (
                                <div className="sticky bottom-0 bg-gradient-to-t from-slate-900 to-slate-900/80 mt-4 pt-4 border-t border-purple-500/30">
                                    <p className="font-bold text-white mb-3 text-sm">📈 Total Nutrition</p>
                                    <div className="grid grid-cols-4 gap-2">
                                        <div className="text-center">
                                            <p className="text-slate-400 text-xs">Kcal</p>
                                            <p className="font-bold text-orange-400">{totals.calories}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-slate-400 text-xs">Protein</p>
                                            <p className="font-bold text-green-400">{totals.protein.toFixed(1)}g</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-slate-400 text-xs">Carbs</p>
                                            <p className="font-bold text-blue-400">{totals.carbs.toFixed(1)}g</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-slate-400 text-xs">Fat</p>
                                            <p className="font-bold text-red-400">{totals.fat.toFixed(1)}g</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Info */}
            <div className="bg-slate-800/50 p-3 text-xs text-slate-400 border-t border-slate-700">
                <p>💡 <strong>Tip:</strong> Point camera at food items. AI detects and shows calories, protein, carbs, and fat. Works best with clear, well-lit items.</p>
            </div>
        </div>
    )
}

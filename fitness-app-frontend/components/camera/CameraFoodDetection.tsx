/**
 * CameraFoodDetection Component
 * Complete full-screen food detection interface with camera controls
 * 
 * Features:
 *  - Full-screen camera feed
 *  - Photo capture with overlay buttons
 *  - Automatic food detection
 *  - Detection results modal
 *  - Camera settings optimization
 *  - Error handling UI
 *  - Loading states
 */

'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useCamera } from '@/hooks/useCamera';

interface DetectionResult {
    detected_food: string;
    confidence: number;
    nutrition: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
        fiber?: number;
        vitamins?: Record<string, number>;
    };
    servingSize?: string;
}

export function CameraFoodDetection() {
    // ────────────────────────────────────────────────────────────────────
    // CAMERA HOOK
    // ────────────────────────────────────────────────────────────────────

    const {
        startCamera,
        stopCamera,
        switchCamera,
        capturePhoto,
        getOptimalSettings,
        videoRef,
        canvasRef,
        isLoading,
        isFacingUser,
        error,
        lastCapture,
        hasDeviceCamera,
        cameraPermissionGranted
    } = useCamera();

    // ────────────────────────────────────────────────────────────────────
    // LOCAL STATE
    // ────────────────────────────────────────────────────────────────────

    const [isInitializing, setIsInitializing] = useState(true);
    const [showPreview, setShowPreview] = useState(false);
    const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null);
    const [confidenceThreshold, setConfidenceThreshold] = useState(0.3);
    const [useAutoDetect, setUseAutoDetect] = useState(true);
    const [capturedImageUrl, setCapturedImageUrl] = useState<string | null>(null);
    const [history, setHistory] = useState<DetectionResult[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [dailySummary, setDailySummary] = useState({
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFats: 0,
        mealCount: 0,
        meals: []
    });
    const [userId, setUserId] = useState<string | null>(null);
    const [isLogging, setIsLogging] = useState(false);

    // ────────────────────────────────────────────────────────────────────
    // INITIALIZATION
    // ────────────────────────────────────────────────────────────────────

    useEffect(() => {
        const initializeCamera = async () => {
            try {
                if (!hasDeviceCamera) {
                    // Camera not available
                    setIsInitializing(false);
                    return;
                }

                // Get user ID from localStorage or auth
                const storedUserId = localStorage.getItem('userId') || 'demo-user';
                setUserId(storedUserId);

                // Load today's summary
                if (storedUserId) {
                    await loadTodaySummary(storedUserId);
                }

                // Get optimal settings - with fallback
                let settings;
                try {
                    settings = await getOptimalSettings('food', 'mobile');
                } catch (err) {
                    console.warn('Could not get optimal settings, using defaults:', err);
                    settings = {
                        facingMode: 'environment' as const,
                        width: { ideal: 1920 },
                        height: { ideal: 1440 },
                        frameRate: { ideal: 30 },
                        autoFocus: true,
                        autoExposure: true,
                        flashMode: 'auto' as const
                    };
                }

                // Start camera with optimal settings
                await startCamera(settings);

                setIsInitializing(false);
            } catch (err) {
                console.error('Initialization error:', err instanceof Error ? err.message : err);
                setIsInitializing(false);
            }
        };

        initializeCamera();

        // Cleanup
        return () => {
            stopCamera();
        };
    }, [hasDeviceCamera, startCamera, stopCamera, getOptimalSettings]);

    // ────────────────────────────────────────────────────────────────────
    // CAPTURE & DETECT
    // ────────────────────────────────────────────────────────────────────

    // Load today's food summary
    const loadTodaySummary = async (id: string) => {
        try {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
            const response = await fetch(`${backendUrl}/api/camera/logs/today?userId=${id}`);
            if (!response.ok) return;

            const data = await response.json();
            if (data.status === 'success') {
                setDailySummary({
                    totalCalories: data.summary.total_calories,
                    totalProtein: data.summary.total_protein,
                    totalCarbs: data.summary.total_carbs,
                    totalFats: data.summary.total_fats,
                    mealCount: data.summary.meal_count,
                    meals: data.logs || []
                });
            }
        } catch (error) {
            console.error('Error loading summary:', error);
        }
    };

    const handleCapture = async () => {
        try {
            const result = await capturePhoto(useAutoDetect, confidenceThreshold);

            if (!result) {
                console.warn('No result from capture');
                return;
            }

            // Create image URL from capture
            if (canvasRef.current) {
                try {
                    const imageUrl = canvasRef.current.toDataURL('image/jpeg');
                    setCapturedImageUrl(imageUrl);
                } catch (err) {
                    console.warn('Could not convert canvas to data URL:', err);
                }
            }

            // Extract detection result
            if (result.detection && result.detection.detected_food) {
                const detectionData: DetectionResult = {
                    detected_food: result.detection.detected_food,
                    confidence: result.detection.confidence || 0,
                    nutrition: result.detection.nutrition || {},
                };

                setDetectionResult(detectionData);
                setHistory([detectionData, ...history.slice(0, 9)]); // Keep last 10
            } else {
                console.warn('No detection data in response:', result);
            }

        } catch (err) {
            console.error('Capture error:', err instanceof Error ? err.message : err);
        }
    };

    // Log detected food to database
    const handleLogFood = async () => {
        if (!detectionResult || !userId) {
            alert('Please capture food first');
            return;
        }

        setIsLogging(true);

        try {
            // Get the captured image blob
            if (!canvasRef.current) {
                throw new Error('No captured image available');
            }

            // Convert canvas to blob
            const blob = await new Promise<Blob | null>(resolve => {
                canvasRef.current?.toBlob(resolve, 'image/jpeg', 0.95);
            });

            if (!blob) throw new Error('Failed to create image blob');

            // Create FormData
            const formData = new FormData();
            formData.append('image', blob, 'capture.jpg');
            formData.append('userId', userId);
            formData.append('confidenceThreshold', confidenceThreshold.toString());

            // Send to backend
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
            const response = await fetch(`${backendUrl}/api/camera/detect-and-log`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();
            if (result.status === 'success' && result.dailySummary) {
                // Update daily summary
                setDailySummary({
                    totalCalories: result.dailySummary.totalCalories,
                    totalProtein: result.dailySummary.totalProtein,
                    totalCarbs: result.dailySummary.totalCarbs,
                    totalFats: result.dailySummary.totalFats,
                    mealCount: result.dailySummary.mealCount,
                    meals: result.dailySummary.meals || []
                });

                // Show success message
                alert(`✅ Logged: ${result.detection.detected_food}\n+${result.detection.nutrition.calories} calories`);

                // Reset detection
                setDetectionResult(null);
                setCapturedImageUrl(null);
            }
        } catch (error) {
            console.error('Logging error:', error);
            alert(`Error logging food: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsLogging(false);
        }
    };

    // ────────────────────────────────────────────────────────────────────
    // RENDER ERROR STATE
    // ────────────────────────────────────────────────────────────────────

    if (!hasDeviceCamera) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
                    <h1 className="text-2xl font-bold text-gray-800 mb-4">
                        Camera Not Available
                    </h1>
                    <p className="text-gray-600 mb-4">
                        Your device doesn't have a camera, or camera access was denied.
                    </p>
                    <p className="text-sm text-gray-500">
                        To use food detection, please:
                    </p>
                    <ul className="list-disc list-inside text-sm text-gray-600 mt-2 mb-6">
                        <li>Use a device with a camera</li>
                        <li>Grant camera permissions</li>
                        <li>Ensure you're using HTTPS or localhost</li>
                    </ul>
                </div>
            </div>
        );
    }

    // ────────────────────────────────────────────────────────────────────
    // RENDER LOADING STATE
    // ────────────────────────────────────────────────────────────────────

    if (isInitializing) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="bg-white rounded-lg shadow-lg p-8">
                    <div className="flex items-center justify-center mb-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>
                    <p className="text-gray-600 text-center">
                        Initializing camera...
                    </p>
                </div>
            </div>
        );
    }

    // ────────────────────────────────────────────────────────────────────
    // RENDER MAIN UI - FULL SCREEN
    // ────────────────────────────────────────────────────────────────────

    return (
        <div className="fixed inset-0 w-screen h-screen bg-black">

            {/* FULL SCREEN CAMERA */}
            <div className="relative w-full h-full overflow-hidden">

                {/* VIDEO STREAM */}
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`absolute inset-0 w-full h-full object-cover ${isFacingUser ? 'scale-x-[-1]' : ''
                        }`}
                />

                {/* HIDDEN CANVAS */}
                <canvas ref={canvasRef} className="hidden" />

                {/* LOADING OVERLAY */}
                {isLoading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-full p-6">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
                        </div>
                    </div>
                )}

                {/* ERROR OVERLAY */}
                {error && !cameraPermissionGranted && (
                    <div className="absolute inset-0 bg-red-500/80 flex items-center justify-center z-50 p-4">
                        <div className="text-center">
                            <div className="text-white text-5xl mb-4">⚠️</div>
                            <p className="text-white font-bold text-xl mb-2">Camera Access Required</p>
                            <p className="text-white/90 text-base">{error}</p>
                        </div>
                    </div>
                )}

                {/* FOCUS GUIDE - Crosshair in center */}
                {!isLoading && !error && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        {/* Corner brackets */}
                        <div className="absolute top-1/4 left-1/4 w-10 h-10 border-t-4 border-l-4 border-green-400 opacity-70"></div>
                        <div className="absolute top-1/4 right-1/4 w-10 h-10 border-t-4 border-r-4 border-green-400 opacity-70"></div>
                        <div className="absolute bottom-1/4 left-1/4 w-10 h-10 border-b-4 border-l-4 border-green-400 opacity-70"></div>
                        <div className="absolute bottom-1/4 right-1/4 w-10 h-10 border-b-4 border-r-4 border-green-400 opacity-70"></div>

                        {/* Center circle */}
                        <div className="w-24 h-24 rounded-full border-2 border-green-400 opacity-50"></div>
                        <div className="absolute w-1 h-8 bg-green-400 opacity-50"></div>
                        <div className="absolute w-8 h-1 bg-green-400 opacity-50"></div>
                    </div>
                )}

                {/* TOP BUTTONS */}
                <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-40 bg-gradient-to-b from-black/60 to-transparent">
                    <div className="text-white font-bold text-lg">Food Detection</div>

                    {/* SETTINGS ICON BUTTON */}
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className="text-white text-3xl hover:bg-white/20 p-2 rounded-full transition transform hover:scale-110 active:scale-95"
                        title="Settings"
                    >
                        ⚙️
                    </button>
                </div>

                {/* BOTTOM BUTTON BAR - CENTERED */}
                <div className="absolute bottom-0 left-0 right-0 p-6 z-40 bg-gradient-to-t from-black/80 to-transparent">
                    {/* DAILY SUMMARY - TOP OF BUTTON AREA */}
                    {dailySummary.mealCount > 0 && (
                        <div className="mb-4 flex justify-center gap-4 text-xs">
                            <div className="bg-black/60 px-3 py-2 rounded-lg text-white/80">
                                <div className="font-bold text-green-400">{dailySummary.totalCalories}</div>
                                <div>Cal Today</div>
                            </div>
                            <div className="bg-black/60 px-3 py-2 rounded-lg text-white/80">
                                <div className="font-bold text-blue-400">{dailySummary.mealCount}</div>
                                <div>Meals</div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-center gap-4 flex-wrap">
                        {/* CAPTURE BUTTON - ALWAYS VISIBLE */}
                        <button
                            onClick={handleCapture}
                            disabled={isLoading || !cameraPermissionGranted}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold px-8 py-4 rounded-full transition transform hover:scale-105 active:scale-95 flex items-center gap-2 shadow-xl text-lg"
                        >
                            <span className="text-2xl">📸</span>
                            {isLoading ? 'Detecting...' : 'Capture'}
                        </button>

                        {/* LOG BUTTON - VISIBLE WHEN FOOD DETECTED */}
                        {detectionResult && (
                            <button
                                onClick={handleLogFood}
                                disabled={isLogging || !userId}
                                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold px-8 py-4 rounded-full transition transform hover:scale-105 active:scale-95 flex items-center gap-2 shadow-xl text-lg"
                            >
                                <span className="text-2xl">💾</span>
                                {isLogging ? 'Logging...' : 'Log Food'}
                            </button>
                        )}

                        {/* SWITCH CAMERA BUTTON */}
                        <button
                            onClick={switchCamera}
                            disabled={isLoading}
                            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 text-white font-bold px-6 py-4 rounded-full transition transform hover:scale-105 active:scale-95 flex items-center gap-2 shadow-xl text-lg"
                        >
                            <span className="text-2xl">{isFacingUser ? '📷' : '🤳'}</span>
                            {isFacingUser ? 'Rear' : 'Front'}
                        </button>

                        {/* HISTORY BUTTON */}
                        {history.length > 0 && (
                            <button
                                onClick={() => setShowHistory(!showHistory)}
                                className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-4 rounded-full transition transform hover:scale-105 active:scale-95 flex items-center gap-2 shadow-xl text-lg"
                            >
                                <span className="text-2xl">📋</span>
                                {history.length}
                            </button>
                        )}
                    </div>
                </div>

                {/* SETTINGS MODAL - COMPACT */}
                {showSettings && (
                    <div className="absolute top-16 right-4 w-80 bg-black/90 backdrop-blur-md p-5 rounded-xl z-40 border border-white/20 shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-white font-bold text-base">⚙️ Settings</h3>
                            <button
                                onClick={() => setShowSettings(false)}
                                className="text-white/60 hover:text-white text-xl transition"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* CONFIDENCE THRESHOLD */}
                            <div>
                                <label className="flex items-center justify-between mb-2">
                                    <span className="text-white/80 font-medium text-xs">Confidence</span>
                                    <span className="text-blue-400 font-bold text-sm">{(confidenceThreshold * 100).toFixed(0)}%</span>
                                </label>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.05"
                                    value={confidenceThreshold}
                                    onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                />
                                <p className="text-xs text-gray-400 mt-1">Low = more | High = accurate</p>
                            </div>

                            {/* AUTO DETECT TOGGLE */}
                            <div className="flex items-center justify-between pt-2 border-t border-white/10">
                                <label className="text-white/80 font-medium text-xs">Auto Detect</label>
                                <button
                                    onClick={() => setUseAutoDetect(!useAutoDetect)}
                                    className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${useAutoDetect ? 'bg-blue-500' : 'bg-gray-600'
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-3 w-3 transform bg-white rounded-full transition-transform ${useAutoDetect ? 'translate-x-5' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* DETECTION RESULT MODAL */}
            {detectionResult && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">

                        {/* CLOSE BUTTON */}
                        <div className="sticky top-0 flex justify-between items-center p-6 border-b bg-white rounded-t-2xl">
                            <h2 className="text-2xl font-bold text-gray-800">Detection Result</h2>
                            <button
                                onClick={() => setDetectionResult(null)}
                                className="text-gray-500 hover:text-gray-800 text-2xl"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-6 space-y-6">

                            {/* DETECTED FOOD */}
                            <div className="text-center">
                                <h3 className="text-4xl font-bold text-green-600 mb-2">
                                    {detectionResult.detected_food}
                                </h3>
                                <div className="inline-block bg-green-100 px-4 py-2 rounded-full">
                                    <span className="text-green-700 font-semibold">
                                        {(detectionResult.confidence * 100).toFixed(1)}% Confident
                                    </span>
                                </div>
                            </div>

                            {/* CONFIDENCE PROGRESS */}
                            <div>
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                    <div
                                        className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-300"
                                        style={{ width: `${detectionResult.confidence * 100}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* NUTRITION GRID */}
                            {detectionResult.nutrition && (
                                <div className="grid grid-cols-2 gap-4">
                                    {detectionResult.nutrition.calories && (
                                        <div className="bg-blue-50 rounded-lg p-4 text-center">
                                            <p className="text-gray-600 text-sm font-medium">Calories</p>
                                            <p className="text-3xl font-bold text-blue-600">
                                                {detectionResult.nutrition.calories}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">kcal</p>
                                        </div>
                                    )}

                                    {detectionResult.nutrition.protein && (
                                        <div className="bg-red-50 rounded-lg p-4 text-center">
                                            <p className="text-gray-600 text-sm font-medium">Protein</p>
                                            <p className="text-3xl font-bold text-red-600">
                                                {detectionResult.nutrition.protein}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">g</p>
                                        </div>
                                    )}

                                    {detectionResult.nutrition.carbs && (
                                        <div className="bg-yellow-50 rounded-lg p-4 text-center">
                                            <p className="text-gray-600 text-sm font-medium">Carbs</p>
                                            <p className="text-3xl font-bold text-yellow-600">
                                                {detectionResult.nutrition.carbs}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">g</p>
                                        </div>
                                    )}

                                    {detectionResult.nutrition.fat && (
                                        <div className="bg-orange-50 rounded-lg p-4 text-center">
                                            <p className="text-gray-600 text-sm font-medium">Fat</p>
                                            <p className="text-3xl font-bold text-orange-600">
                                                {detectionResult.nutrition.fat}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">g</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* CAPTURED IMAGE */}
                            {capturedImageUrl && (
                                <div className="rounded-lg overflow-hidden border-2 border-gray-200">
                                    <div className="relative w-full h-48 bg-gray-100">
                                        <Image
                                            src={capturedImageUrl}
                                            alt="Captured food"
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* ACTION BUTTONS */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setDetectionResult(null)}
                                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 rounded-lg transition"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={handleCapture}
                                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition"
                                >
                                    Capture Again
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* HISTORY MODAL */}
            {showHistory && history.length > 0 && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-40 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col">

                        <div className="flex justify-between items-center p-6 border-b">
                            <h3 className="text-xl font-bold text-gray-800">📋 History</h3>
                            <button
                                onClick={() => setShowHistory(false)}
                                className="text-gray-500 hover:text-gray-800 text-2xl"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="overflow-y-auto flex-1 p-4 space-y-2">
                            {history.map((item, idx) => (
                                <div
                                    key={idx}
                                    className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-gray-200 cursor-pointer hover:shadow-md transition"
                                    onClick={() => {
                                        setDetectionResult(item);
                                        setShowHistory(false);
                                    }}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold text-gray-800">{item.detected_food}</p>
                                            <p className="text-sm text-gray-500">
                                                {item.nutrition?.calories || 0} cal
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-green-600">
                                                {(item.confidence * 100).toFixed(0)}%
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="border-t p-4">
                            <button
                                onClick={() => setShowHistory(false)}
                                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 rounded-lg transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CameraFoodDetection;

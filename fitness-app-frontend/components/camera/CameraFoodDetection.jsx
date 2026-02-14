'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useCamera } from '@/hooks/useCamera';

export function CameraFoodDetection() {
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

    const [isInitializing, setIsInitializing] = useState(true);
    const [showPreview, setShowPreview] = useState(false);
    const [detectionResult, setDetectionResult] = useState(null);
    const [confidenceThreshold, setConfidenceThreshold] = useState(0.3);
    const [useAutoDetect, setUseAutoDetect] = useState(true);
    const [capturedImageUrl, setCapturedImageUrl] = useState(null);
    const [history, setHistory] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showQuickStats, setShowQuickStats] = useState(true);
    const [dailySummary, setDailySummary] = useState({
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFats: 0,
        mealCount: 0,
        meals: []
    });
    const [userId, setUserId] = useState(null);
    const [isLogging, setIsLogging] = useState(false);

    useEffect(() => {
        const initializeCamera = async () => {
            try {
                if (!hasDeviceCamera) {
                    setIsInitializing(false);
                    return;
                }

                const storedUserId = localStorage.getItem('userId') || 'demo-user';
                setUserId(storedUserId);

                if (storedUserId) {
                    await loadTodaySummary(storedUserId);
                }

                let settings;
                try {
                    settings = await getOptimalSettings('food', 'mobile');
                } catch (err) {
                    console.warn('Could not get optimal settings:', err);
                    settings = {
                        facingMode: 'environment',
                        width: { ideal: 1920 },
                        height: { ideal: 1440 },
                        frameRate: { ideal: 30 },
                        autoFocus: true,
                        autoExposure: true,
                        flashMode: 'auto'
                    };
                }

                await startCamera(settings);
                setIsInitializing(false);
            } catch (err) {
                console.error('Initialization error:', err instanceof Error ? err.message : err);
                setIsInitializing(false);
            }
        };

        initializeCamera();
        return () => stopCamera();
    }, [hasDeviceCamera, startCamera, stopCamera, getOptimalSettings]);

    const loadTodaySummary = async (id) => {
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
            if (!result) return;

            if (canvasRef.current) {
                try {
                    const imageUrl = canvasRef.current.toDataURL('image/jpeg');
                    setCapturedImageUrl(imageUrl);
                } catch (err) {
                    console.warn('Could not convert canvas:', err);
                }
            }

            if (result.detection && result.detection.detected_food) {
                const detectionData = {
                    detected_food: result.detection.detected_food,
                    confidence: result.detection.confidence || 0,
                    nutrition: result.detection.nutrition || {},
                };

                setDetectionResult(detectionData);
                setHistory([detectionData, ...history.slice(0, 9)]);
            }
        } catch (err) {
            console.error('Capture error:', err instanceof Error ? err.message : err);
        }
    };

    const handleLogFood = async () => {
        if (!detectionResult || !userId) {
            alert('Please capture food first');
            return;
        }

        setIsLogging(true);
        try {
            if (!canvasRef.current) throw new Error('No captured image available');

            const blob = await new Promise((resolve) => {
                canvasRef.current?.toBlob(resolve, 'image/jpeg', 0.95);
            });

            if (!blob) throw new Error('Failed to create image blob');

            const formData = new FormData();
            formData.append('image', blob, 'capture.jpg');
            formData.append('userId', userId);
            formData.append('confidenceThreshold', confidenceThreshold.toString());

            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
            const response = await fetch(`${backendUrl}/api/camera/detect-and-log`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const result = await response.json();
            if (result.status === 'success' && result.dailySummary) {
                setDailySummary({
                    totalCalories: result.dailySummary.totalCalories,
                    totalProtein: result.dailySummary.totalProtein,
                    totalCarbs: result.dailySummary.totalCarbs,
                    totalFats: result.dailySummary.totalFats,
                    mealCount: result.dailySummary.mealCount,
                    meals: result.dailySummary.meals || []
                });

                alert(`✅ Logged: ${result.detection.detected_food}\n+${result.detection.nutrition.calories} calories`);
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

    if (!hasDeviceCamera) {
        return (
            <div className="fixed inset-0 overflow-hidden">
                <style>{`
                    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap');
                    
                    * { font-family: 'Space Grotesk', 'Instrument Serif', sans-serif; }
                    
                    body { background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%); }
                `}</style>

                <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950" />

                <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
                    <div className="max-w-md w-full">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-3xl rounded-3xl" />

                            <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-12 space-y-6">
                                <div className="text-center space-y-4">
                                    <div className="text-7xl animate-bounce" style={{ animationDuration: '2s' }}>📷</div>
                                    <h1 className="text-4xl font-bold text-white tracking-tight">No Camera</h1>
                                    <p className="text-lg text-slate-300">Enable your camera to get started</p>
                                </div>

                                <div className="space-y-3 pt-6">
                                    <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                                        <span className="text-2xl">✓</span>
                                        <span className="text-slate-200">Device with camera</span>
                                    </div>
                                    <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                                        <span className="text-2xl">✓</span>
                                        <span className="text-slate-200">Camera permissions</span>
                                    </div>
                                    <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                                        <span className="text-2xl">✓</span>
                                        <span className="text-slate-200">HTTPS or localhost</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (isInitializing) {
        return (
            <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center overflow-hidden">
                <style>{`
                    @keyframes orbital {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                    
                    @keyframes pulse-ring {
                        0% { 
                            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
                        }
                        70% {
                            box-shadow: 0 0 0 30px rgba(59, 130, 246, 0);
                        }
                        100% {
                            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
                        }
                    }
                    
                    .orbital { animation: orbital 4s linear infinite; }
                    .pulse-ring { animation: pulse-ring 2s infinite; }
                `}</style>

                <div className="relative w-32 h-32">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-2xl opacity-30 animate-pulse" />

                    <div className="relative w-32 h-32 flex items-center justify-center">
                        <div className="absolute inset-0 border-2 border-transparent border-t-blue-400 border-r-blue-400 rounded-full orbital" />
                        <div className="absolute inset-2 border-2 border-transparent border-b-purple-400 border-l-purple-400 rounded-full orbital" style={{ animationDuration: '3s', animationDirection: 'reverse' }} />

                        <div className="relative w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center pulse-ring">
                            <div className="text-3xl">🍽️</div>
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-1/4 text-center">
                    <p className="text-white text-lg font-semibold tracking-wide">Initializing Camera</p>
                    <p className="text-slate-400 text-sm mt-2">Preparing your food scanner...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black overflow-hidden">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap');
                
                * { 
                    font-family: 'Space Grotesk', 'Instrument Serif', sans-serif;
                }
                
                @keyframes scan-horizontal {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                
                @keyframes glow-pulse {
                    0%, 100% { 
                        box-shadow: 0 0 20px rgba(59, 130, 246, 0.3),
                                    0 0 40px rgba(59, 130, 246, 0.1);
                    }
                    50% { 
                        box-shadow: 0 0 30px rgba(59, 130, 246, 0.6),
                                    0 0 60px rgba(59, 130, 246, 0.2);
                    }
                }
                
                @keyframes float-up {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-12px); }
                }
                
                @keyframes slide-up {
                    from { 
                        opacity: 0; 
                        transform: translateY(40px);
                    }
                    to { 
                        opacity: 1; 
                        transform: translateY(0);
                    }
                }
                
                @keyframes shimmer {
                    0% { background-position: -1000px 0; }
                    100% { background-position: 1000px 0; }
                }
                
                @keyframes ripple {
                    0% { 
                        transform: scale(0.8);
                        opacity: 1;
                    }
                    100% { 
                        transform: scale(2);
                        opacity: 0;
                    }
                }
                
                @keyframes stagger-in {
                    from { 
                        opacity: 0; 
                        transform: scale(0.9) translateY(20px);
                    }
                    to { 
                        opacity: 1; 
                        transform: scale(1) translateY(0);
                    }
                }
                
                .scan-line { animation: scan-horizontal 3s ease-in-out infinite; }
                .glow-pulse { animation: glow-pulse 3s ease-in-out infinite; }
                .float-up { animation: float-up 3s ease-in-out infinite; }
                .slide-up { animation: slide-up 0.6s cubic-bezier(0.34, 1.56, 0.64, 1); }
                .shimmer { 
                    animation: shimmer 2s infinite;
                    background-size: 1000px 100%;
                    background-image: linear-gradient(
                        90deg,
                        transparent 0%,
                        rgba(255, 255, 255, 0.1) 50%,
                        transparent 100%
                    );
                }
                .ripple { animation: ripple 0.6s ease-out; }
                .stagger-in { animation: stagger-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); }
                
                .glass {
                    background: rgba(255, 255, 255, 0.06);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }
                
                .glass-dark {
                    background: rgba(0, 0, 0, 0.4);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }
                
                .gradient-text {
                    background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                
                .btn-primary {
                    background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
                    position: relative;
                    overflow: hidden;
                    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                
                .btn-primary::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
                    animation: shimmer 2s infinite;
                }
                
                .btn-primary:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 20px 40px rgba(59, 130, 246, 0.4);
                }
                
                .btn-primary:active {
                    transform: translateY(-2px);
                }
            `}</style>

            {/* CAMERA STREAM */}
            <div className="relative w-full h-full">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`absolute inset-0 w-full h-full object-cover ${isFacingUser ? 'scale-x-[-1]' : ''}`}
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* ADVANCED VIGNETTE & OVERLAY */}
                <div className="absolute inset-0 pointer-events-none" style={{
                    background: 'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 0%, rgba(0,0,0,0.3) 100%)'
                }} />

                {/* CINEMATIC SCAN EFFECT */}
                {!isLoading && !error && (
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="scan-line absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-blue-400/20 to-transparent opacity-50" style={{ top: '25%' }} />
                    </div>
                )}

                {/* PREMIUM FOCUS FRAME */}
                {!isLoading && !error && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        {/* Outer glow */}
                        <div className="absolute inset-1/3 rounded-3xl border-2 border-blue-500/20 glow-pulse" />

                        {/* Main frame */}
                        <div className="absolute inset-1/3 rounded-3xl border-2 border-blue-400/60" />

                        {/* Corner accents - premium style */}
                        <div className="absolute w-20 h-20" style={{ top: '25%', left: '25%' }}>
                            <div className="absolute top-0 left-0 w-8 h-8 border-t-3 border-l-3 border-blue-400" />
                        </div>
                        <div className="absolute w-20 h-20" style={{ top: '25%', right: '25%' }}>
                            <div className="absolute top-0 right-0 w-8 h-8 border-t-3 border-r-3 border-blue-400" />
                        </div>
                        <div className="absolute w-20 h-20" style={{ bottom: '25%', left: '25%' }}>
                            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-3 border-l-3 border-blue-400" />
                        </div>
                        <div className="absolute w-20 h-20" style={{ bottom: '25%', right: '25%' }}>
                            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-3 border-r-3 border-blue-400" />
                        </div>

                        {/* Center targeting reticle */}
                        <div className="relative">
                            <div className="w-20 h-20 rounded-full border-2 border-blue-400/50 glow-pulse" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-1 h-12 bg-blue-400/40" />
                                <div className="absolute w-12 h-1 bg-blue-400/40" />
                            </div>
                            {/* Center dot */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-3 h-3 bg-blue-400 rounded-full glow-pulse" />
                            </div>
                        </div>

                        {/* Info text */}
                        <div className="absolute bottom-1/3 text-center">
                            <p className="text-blue-300 text-sm font-semibold tracking-widest uppercase">Position food in frame</p>
                        </div>
                    </div>
                )}

                {/* ADVANCED LOADING STATE */}
                {isLoading && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center z-50">
                        <div className="slide-up space-y-6">
                            <div className="relative w-32 h-32 mx-auto">
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full blur-3xl opacity-40 animate-pulse" />

                                <div className="relative w-32 h-32 flex items-center justify-center">
                                    <div className="absolute inset-0 border-3 border-transparent border-t-blue-400 border-r-purple-400 rounded-full animate-spin" style={{ animationDuration: '2s' }} />
                                    <div className="absolute inset-4 border-3 border-transparent border-b-pink-400 border-l-blue-400 rounded-full animate-spin" style={{ animationDuration: '3s', animationDirection: 'reverse' }} />

                                    <div className="relative text-5xl float-up">🔍</div>
                                </div>
                            </div>

                            <div className="text-center space-y-2">
                                <p className="text-white font-bold text-lg tracking-wide">Analyzing Nutrition</p>
                                <div className="flex justify-center gap-1">
                                    <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0s' }} />
                                    <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                                    <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ERROR STATE */}
                {error && !cameraPermissionGranted && (
                    <div className="absolute inset-0 bg-red-950/60 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="slide-up text-center space-y-6 p-6">
                            <div className="text-7xl animate-bounce">⚠️</div>
                            <div className="space-y-2">
                                <p className="text-2xl font-bold text-red-100">Camera Access Denied</p>
                                <p className="text-red-200/80 text-base">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* HEADER - Floating */}
                <div className="absolute top-0 left-0 right-0 z-30 p-6">
                    <div className="flex justify-between items-start">
                        {/* Logo Section */}
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <div className="text-3xl">🍽️</div>
                                <div>
                                    <p className="text-xs font-bold text-blue-400 tracking-widest uppercase">NutriScan</p>
                                    <p className="text-white font-semibold text-sm">AI Nutrition Detector</p>
                                </div>
                            </div>
                        </div>

                        {/* Top Right Actions */}
                        <div className="flex gap-2">
                            {/* History Quick Access */}
                            {history.length > 0 && (
                                <button
                                    onClick={() => setShowHistory(!showHistory)}
                                    className="glass px-4 py-3 rounded-xl text-white hover:bg-white/10 transition-all duration-300 font-semibold text-sm flex items-center gap-2 stagger-in"
                                    style={{ animationDelay: '0.1s' }}
                                >
                                    <span>📋</span>
                                    <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">{history.length}</span>
                                </button>
                            )}

                            {/* Settings */}
                            <button
                                onClick={() => setShowSettings(!showSettings)}
                                className="glass px-4 py-3 rounded-xl text-white hover:bg-white/10 transition-all duration-300 font-semibold text-sm stagger-in"
                                style={{ animationDelay: '0.2s' }}
                            >
                                ⚙️
                            </button>
                        </div>
                    </div>
                </div>

                {/* FLOATING STATS BAR */}
                {showQuickStats && dailySummary.mealCount > 0 && (
                    <div className="absolute top-24 left-1/2 -translate-x-1/2 z-20 stagger-in">
                        <div className="glass rounded-2xl px-6 py-4 backdrop-blur-xl">
                            <div className="flex gap-8 items-center">
                                <div className="text-center">
                                    <p className="text-blue-300 text-xs font-bold tracking-widest uppercase">Today</p>
                                    <p className="text-2xl font-bold text-white mt-1">{dailySummary.totalCalories}</p>
                                    <p className="text-xs text-slate-400">kcal</p>
                                </div>
                                <div className="w-px h-12 bg-white/10" />
                                <div className="text-center">
                                    <p className="text-blue-300 text-xs font-bold tracking-widest uppercase">Meals</p>
                                    <p className="text-2xl font-bold text-white mt-1">{dailySummary.mealCount}</p>
                                    <p className="text-xs text-slate-400">logged</p>
                                </div>
                                <div className="w-px h-12 bg-white/10" />
                                <div className="text-center">
                                    <p className="text-blue-300 text-xs font-bold tracking-widest uppercase">Protein</p>
                                    <p className="text-2xl font-bold text-white mt-1">{dailySummary.totalProtein}g</p>
                                    <p className="text-xs text-slate-400">protein</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* BOTTOM ACTION BAR - Premium */}
                <div className="absolute bottom-0 left-0 right-0 z-30 p-6">
                    <div className="flex flex-col gap-4">
                        {/* Log Food Button - Conditional */}
                        {detectionResult && (
                            <button
                                onClick={handleLogFood}
                                disabled={isLogging || !userId}
                                className="btn-primary w-full py-4 px-8 rounded-2xl text-white font-bold text-lg flex items-center justify-center gap-3 shadow-2xl stagger-in disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className="text-2xl">💾</span>
                                {isLogging ? 'Saving to Journal...' : 'Save to Journal'}
                            </button>
                        )}

                        {/* Main Action Buttons */}
                        <div className="flex gap-3 justify-center flex-wrap">
                            {/* PRIMARY CAPTURE */}
                            <button
                                onClick={handleCapture}
                                disabled={isLoading || !cameraPermissionGranted}
                                className="btn-primary px-12 py-5 rounded-2xl text-white font-bold text-xl flex items-center justify-center gap-3 shadow-2xl stagger-in disabled:opacity-50 disabled:cursor-not-allowed group"
                            >
                                <span className="text-3xl group-hover:scale-110 transition-transform">📸</span>
                                <span>{isLoading ? 'Analyzing...' : 'Scan Food'}</span>
                            </button>

                            {/* SWITCH CAMERA */}
                            <button
                                onClick={switchCamera}
                                disabled={isLoading}
                                className="glass px-6 py-5 rounded-2xl text-white font-semibold hover:bg-white/10 transition-all duration-300 text-lg stagger-in disabled:opacity-50"
                                style={{ animationDelay: '0.1s' }}
                            >
                                {isFacingUser ? '📷' : '🤳'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* PREMIUM SETTINGS PANEL */}
                {showSettings && (
                    <div className="absolute top-20 right-6 w-96 glass rounded-3xl p-8 z-50 space-y-8 slide-up max-h-96 overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-white">⚙️ Settings</h3>
                            <button
                                onClick={() => setShowSettings(false)}
                                className="text-slate-400 hover:text-white text-3xl transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Confidence Threshold */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <label className="text-white font-semibold">Detection Confidence</label>
                                <div className="px-4 py-2 glass rounded-lg">
                                    <span className="text-blue-300 font-bold text-lg">{(confidenceThreshold * 100).toFixed(0)}%</span>
                                </div>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={confidenceThreshold}
                                onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                                className="w-full h-3 bg-white/10 rounded-full appearance-none cursor-pointer accent-blue-500"
                            />
                            <p className="text-xs text-slate-400">Lower = more | Higher = accurate</p>
                        </div>

                        {/* Auto Detect Toggle */}
                        <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                            <label className="text-white font-semibold">Auto Detection</label>
                            <button
                                onClick={() => setUseAutoDetect(!useAutoDetect)}
                                className={`relative inline-flex h-7 w-14 items-center rounded-full transition-all duration-300 ${useAutoDetect ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-slate-600'}`}
                            >
                                <span
                                    className={`inline-block h-6 w-6 transform bg-white rounded-full transition-all duration-300 ${useAutoDetect ? 'translate-x-7' : 'translate-x-0.5'}`}
                                />
                            </button>
                        </div>

                        {/* Toggle Stats */}
                        <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                            <label className="text-white font-semibold">Quick Stats</label>
                            <button
                                onClick={() => setShowQuickStats(!showQuickStats)}
                                className={`relative inline-flex h-7 w-14 items-center rounded-full transition-all duration-300 ${showQuickStats ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-slate-600'}`}
                            >
                                <span
                                    className={`inline-block h-6 w-6 transform bg-white rounded-full transition-all duration-300 ${showQuickStats ? 'translate-x-7' : 'translate-x-0.5'}`}
                                />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* DETECTION RESULT MODAL - Full Premium */}
            {detectionResult && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-xl flex items-center justify-center z-50 p-4 animate-in fade-in">
                    <div className="slide-up glass-dark rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border-2 border-white/20">

                        {/* Header */}
                        <div className="sticky top-0 glass px-8 py-6 border-b border-white/10 flex justify-between items-center">
                            <h2 className="text-3xl font-bold text-white">Nutrition Breakdown</h2>
                            <button
                                onClick={() => setDetectionResult(null)}
                                className="text-slate-400 hover:text-white text-4xl transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="overflow-y-auto flex-1 p-8 space-y-8">
                            {/* Food Name - Premium Display */}
                            <div className="space-y-4">
                                <p className="text-sm font-bold text-blue-300 tracking-widest uppercase">Detected Food</p>
                                <h3 className="text-6xl font-bold gradient-text tracking-tight">
                                    {detectionResult.detected_food}
                                </h3>
                                <div className="flex items-center gap-3">
                                    <div className="px-4 py-2 glass rounded-lg">
                                        <span className="text-blue-200 font-semibold">{(detectionResult.confidence * 100).toFixed(1)}% Confidence</span>
                                    </div>
                                </div>
                            </div>

                            {/* Confidence Visualization */}
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-300">Detection Accuracy</span>
                                    <span className="text-blue-300 font-bold">{(detectionResult.confidence * 100).toFixed(0)}%</span>
                                </div>
                                <div className="h-4 glass rounded-full overflow-hidden border border-white/20">
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-1000"
                                        style={{ width: `${detectionResult.confidence * 100}%` }}
                                    />
                                </div>
                            </div>

                            {/* NUTRITION GRID - Premium Layout */}
                            {detectionResult.nutrition && (
                                <div className="grid grid-cols-2 gap-4 pt-4">
                                    {detectionResult.nutrition.calories && (
                                        <div className="glass-dark rounded-2xl p-6 text-center space-y-3 border border-white/10 hover:border-blue-500/30 transition-all duration-300 hover:bg-white/10">
                                            <div className="text-5xl">🔥</div>
                                            <p className="text-slate-300 text-xs font-bold tracking-widest uppercase">Calories</p>
                                            <p className="text-4xl font-bold text-blue-300">
                                                {detectionResult.nutrition.calories}
                                            </p>
                                            <p className="text-xs text-slate-400">kcal</p>
                                        </div>
                                    )}

                                    {detectionResult.nutrition.protein && (
                                        <div className="glass-dark rounded-2xl p-6 text-center space-y-3 border border-white/10 hover:border-pink-500/30 transition-all duration-300 hover:bg-white/10">
                                            <div className="text-5xl">💪</div>
                                            <p className="text-slate-300 text-xs font-bold tracking-widest uppercase">Protein</p>
                                            <p className="text-4xl font-bold text-pink-300">
                                                {detectionResult.nutrition.protein}g
                                            </p>
                                        </div>
                                    )}

                                    {detectionResult.nutrition.carbs && (
                                        <div className="glass-dark rounded-2xl p-6 text-center space-y-3 border border-white/10 hover:border-purple-500/30 transition-all duration-300 hover:bg-white/10">
                                            <div className="text-5xl">🌾</div>
                                            <p className="text-slate-300 text-xs font-bold tracking-widest uppercase">Carbs</p>
                                            <p className="text-4xl font-bold text-purple-300">
                                                {detectionResult.nutrition.carbs}g
                                            </p>
                                        </div>
                                    )}

                                    {detectionResult.nutrition.fat && (
                                        <div className="glass-dark rounded-2xl p-6 text-center space-y-3 border border-white/10 hover:border-amber-500/30 transition-all duration-300 hover:bg-white/10">
                                            <div className="text-5xl">🫒</div>
                                            <p className="text-slate-300 text-xs font-bold tracking-widest uppercase">Fat</p>
                                            <p className="text-4xl font-bold text-amber-300">
                                                {detectionResult.nutrition.fat}g
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Captured Image - Premium */}
                            {capturedImageUrl && (
                                <div className="space-y-3">
                                    <p className="text-sm text-slate-300 font-semibold">Food Photo</p>
                                    <div className="rounded-2xl overflow-hidden border-2 border-white/20 hover:border-blue-500/50 transition-all duration-300">
                                        <div className="relative w-full h-64 bg-slate-800">
                                            <Image
                                                src={capturedImageUrl}
                                                alt="Captured food"
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer Actions */}
                        <div className="glass border-t border-white/10 p-8 space-y-3">
                            <button
                                onClick={handleCapture}
                                className="btn-primary w-full py-4 rounded-xl text-white font-bold flex items-center justify-center gap-2"
                            >
                                <span>📸</span>
                                Scan Another Food
                            </button>
                            <button
                                onClick={() => setDetectionResult(null)}
                                className="w-full py-4 glass rounded-xl text-white font-bold hover:bg-white/10 transition-all"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* HISTORY MODAL - Premium */}
            {showHistory && history.length > 0 && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-xl flex items-center justify-center z-40 p-4">
                    <div className="slide-up glass-dark rounded-3xl shadow-2xl w-full max-w-2xl max-h-[75vh] overflow-hidden flex flex-col border-2 border-white/20">

                        <div className="glass px-8 py-6 border-b border-white/10 flex justify-between items-center">
                            <h3 className="text-2xl font-bold text-white">📋 Scan History</h3>
                            <button
                                onClick={() => setShowHistory(false)}
                                className="text-slate-400 hover:text-white text-3xl transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="overflow-y-auto flex-1 p-6 space-y-3">
                            {history.map((item, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        setDetectionResult(item);
                                        setShowHistory(false);
                                    }}
                                    className="w-full glass-dark text-left p-6 rounded-2xl hover:bg-white/10 hover:border-blue-500/50 transition-all duration-300 border border-white/10 group stagger-in"
                                    style={{ animationDelay: `${idx * 0.05}s` }}
                                >
                                    <div className="flex justify-between items-start gap-4">
                                        <div>
                                            <p className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors">
                                                {item.detected_food}
                                            </p>
                                            <p className="text-sm text-slate-400 mt-2">
                                                {item.nutrition?.calories || 0} kcal
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-bold gradient-text">
                                                {(item.confidence * 100).toFixed(0)}%
                                            </p>
                                            <p className="text-xs text-slate-400 mt-1">confidence</p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>

                        <div className="glass border-t border-white/10 p-6">
                            <button
                                onClick={() => setShowHistory(false)}
                                className="w-full py-3 glass hover:bg-white/10 text-white font-bold rounded-xl transition-all"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CameraFoodDetection;
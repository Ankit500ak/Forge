/**
 * useCamera Hook
 * Complete camera functionality for food detection
 * 
 * Features:
 *  - Real-time camera access
 *  - Photo capture
 *  - Food detection integration
 *  - Camera settings optimization
 *  - Error handling
 *  - Loading states
 */

import { useRef, useState, useEffect, useCallback } from 'react';

interface CameraSettings {
    facingMode: 'user' | 'environment';
    width: { ideal: number };
    height: { ideal: number };
    frameRate: { ideal: number };
    autoFocus: boolean;
    autoExposure: boolean;
    flashMode: 'off' | 'on' | 'auto';
}

interface CaptureResult {
    status: string;
    capture?: {
        id: string;
        timestamp: string;
        filesize: number;
        dimensions: { width: number; height: number };
    };
    detection?: {
        status: string;
        detected_food?: string;
        confidence?: number;
        nutrition?: any;
    };
    error?: string;
}

interface CameraRecommendations {
    lightingRequired?: boolean;
    optimalLighting?: string;
    bestDistance?: string;
    position?: string;
    background?: string;
    tips?: string[];
}

interface CameraHookReturn {
    // Camera controls
    startCamera: (settings?: Partial<CameraSettings>) => Promise<void>;
    stopCamera: () => void;
    switchCamera: () => Promise<void>;

    // Capture & detection
    capturePhoto: (autoDetect?: boolean, confidenceThreshold?: number) => Promise<CaptureResult | null>;

    // Settings
    getOptimalSettings: (useCase?: string, deviceType?: string) => Promise<CameraSettings & { recommendations: CameraRecommendations }>;

    // State
    videoRef: React.RefObject<HTMLVideoElement>;
    canvasRef: React.RefObject<HTMLCanvasElement>;
    isLoading: boolean;
    isFacingUser: boolean;
    error: string | null;
    lastCapture: CaptureResult | null;

    // Utilities
    hasDeviceCamera: boolean;
    cameraPermissionGranted: boolean;
}

export function useCamera(): CameraHookReturn {
    // ────────────────────────────────────────────────────────────────────
    // REFS
    // ────────────────────────────────────────────────────────────────────

    const videoRef = useRef<HTMLVideoElement>(null) as React.RefObject<HTMLVideoElement>;
    const canvasRef = useRef<HTMLCanvasElement>(null) as React.RefObject<HTMLCanvasElement>;
    const streamRef = useRef<MediaStream | null>(null);

    // ────────────────────────────────────────────────────────────────────
    // STATE
    // ────────────────────────────────────────────────────────────────────

    const [isLoading, setIsLoading] = useState(false);
    const [isFacingUser, setIsFacingUser] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastCapture, setLastCapture] = useState<CaptureResult | null>(null);
    const [hasDeviceCamera, setHasDeviceCamera] = useState(false);
    const [cameraPermissionGranted, setCameraPermissionGranted] = useState(false);

    // ────────────────────────────────────────────────────────────────────
    // INITIALIZATION
    // ────────────────────────────────────────────────────────────────────

    useEffect(() => {
        // Check camera availability on mount
        const checkCameraSupport = async () => {
            try {
                if (navigator.mediaDevices) {
                    setHasDeviceCamera(true);
                }
            } catch (err) {
                setHasDeviceCamera(false);
            }
        };

        checkCameraSupport();

        // Cleanup on unmount
        return () => {
            stopCamera();
        };
    }, []);

    // ────────────────────────────────────────────────────────────────────
    // START CAMERA
    // ────────────────────────────────────────────────────────────────────

    const startCamera = useCallback(async (settings?: Partial<CameraSettings>) => {
        try {
            setIsLoading(true);
            setError(null);

            // Check permissions
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Camera not supported on this device');
            }

            // Stop existing stream
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }

            // Merge default settings
            const defaultSettings = {
                video: {
                    facingMode: { ideal: settings?.facingMode || 'user' },
                    width: settings?.width || { ideal: 1920 },
                    height: settings?.height || { ideal: 1440 },
                    frameRate: settings?.frameRate || { ideal: 30 },
                },
                audio: false
            };

            // Request camera access
            const stream = await navigator.mediaDevices.getUserMedia(defaultSettings);
            streamRef.current = stream;
            setCameraPermissionGranted(true);

            // Attach to video element
            if (videoRef.current) {
                videoRef.current.srcObject = stream;

                // Ensure video plays
                try {
                    await videoRef.current.play();
                } catch (err) {
                    console.warn('Auto-play prevented:', err instanceof Error ? err.message : err);
                }
            } else {
                console.warn('Video ref not available');
            }

            // Update facing mode state
            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack) {
                const settings_ = videoTrack.getSettings();
                setIsFacingUser(settings_.facingMode === 'user');
            }

            setIsLoading(false);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to access camera';
            setError(errorMessage);
            setCameraPermissionGranted(false);
            setIsLoading(false);

            console.error('Camera error:', err);
        }
    }, []);

    // ────────────────────────────────────────────────────────────────────
    // STOP CAMERA
    // ────────────────────────────────────────────────────────────────────

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    }, []);

    // ────────────────────────────────────────────────────────────────────
    // SWITCH CAMERA
    // ────────────────────────────────────────────────────────────────────

    const switchCamera = useCallback(async () => {
        try {
            setIsLoading(true);
            const newFacingMode = isFacingUser ? 'environment' : 'user';

            await startCamera({ facingMode: newFacingMode as any });
            setIsFacingUser(newFacingMode === 'user');

            setIsLoading(false);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to switch camera';
            setError(errorMessage);
            setIsLoading(false);
        }
    }, [isFacingUser, startCamera]);

    // ────────────────────────────────────────────────────────────────────
    // CAPTURE PHOTO
    // ────────────────────────────────────────────────────────────────────

    const capturePhoto = useCallback(async (
        autoDetect = true,
        confidenceThreshold = 0.3
    ): Promise<CaptureResult | null> => {
        try {
            setIsLoading(true);
            setError(null);

            // Check if camera is running
            if (!videoRef.current || !streamRef.current) {
                throw new Error('Camera not started');
            }

            // Check if video is ready
            if (videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
                throw new Error('Camera not ready');
            }

            // Get canvas context
            if (!canvasRef.current) {
                throw new Error('Canvas not available');
            }

            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                throw new Error('Cannot get canvas context');
            }

            // Set canvas dimensions to match video
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;

            // Draw video frame to canvas
            ctx.drawImage(videoRef.current, 0, 0);

            // Convert to blob
            const blob = await new Promise<Blob | null>(resolve => {
                canvas.toBlob(resolve, 'image/jpeg', 0.95);
            });

            if (!blob) {
                throw new Error('Failed to capture image');
            }

            // ────────────────────────────────────────────────────────────────
            // UPLOAD TO SERVER
            // ────────────────────────────────────────────────────────────────

            const formData = new FormData();
            formData.append('image', blob, 'capture.jpg');
            formData.append('autoDetect', autoDetect.toString());
            formData.append('confidenceThreshold', confidenceThreshold.toString());

            // Add dimensions
            formData.append('width', canvas.width.toString());
            formData.append('height', canvas.height.toString());

            // Get backend URL from environment or use default
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

            // Try detect-and-log endpoint which includes detection
            // Add userId if available
            const userId = typeof window !== 'undefined'
                ? localStorage.getItem('userId') || 'anonymous-' + Date.now()
                : 'anonymous-' + Date.now();
            formData.append('userId', userId);
            formData.append('confidenceThreshold', confidenceThreshold.toString());

            const response = await fetch(`${backendUrl}/api/camera/detect-and-log`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                try {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `HTTP ${response.status}`);
                } catch (e) {
                    throw new Error(`HTTP ${response.status}: Failed to process image`);
                }
            }

            try {
                const data = await response.json();

                // Map detect-and-log response to CaptureResult format
                const result: CaptureResult = {
                    detected_food: data.detection?.detected_food || 'Unknown',
                    confidence: data.detection?.confidence || 0,
                    nutrition: data.detection?.nutrition || {
                        calories: 0,
                        protein: 0,
                        carbs: 0,
                        fats: 0,
                        fiber: 0
                    },
                    source: data.detection?.source || 'ai'
                };

                setLastCapture(result);
                setIsLoading(false);
                return result;
            } catch (jsonError) {
                throw new Error('Invalid response format from server');
            }

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to capture photo';
            setError(errorMessage);
            setIsLoading(false);

            console.error('Capture error:', err);
            return null;
        }
    }, []);

    // ────────────────────────────────────────────────────────────────────
    // GET OPTIMAL SETTINGS
    // ────────────────────────────────────────────────────────────────────

    const getOptimalSettings = useCallback(async (
        useCase = 'food',
        deviceType = 'mobile'
    ): Promise<CameraSettings & { recommendations: CameraRecommendations }> => {
        // Default settings - used when backend is not available
        const defaultSettings = {
            facingMode: 'environment' as const,
            width: { ideal: 1920 },
            height: { ideal: 1440 },
            frameRate: { ideal: 30 },
            autoFocus: true,
            autoExposure: true,
            flashMode: 'auto' as const,
            recommendations: {
                lightingRequired: true,
                bestDistance: '10-15cm',
                position: 'Center food in frame',
                tips: ['Use natural lighting', 'Make sure food is in focus', 'Avoid shadows']
            }
        };

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(
                `/api/camera/settings?useCase=${useCase}&deviceType=${deviceType}`,
                { signal: controller.signal }
            );

            clearTimeout(timeoutId);

            if (!response.ok) {
                console.warn('Backend not available, using default settings');
                return defaultSettings;
            }

            const data = await response.json();
            return data; // Includes both settings and recommendations

        } catch (err) {
            console.warn('Settings endpoint error, using defaults:', err instanceof Error ? err.message : err);
            // Return default settings on any error
            return defaultSettings;
        }
    }, []);

    // ────────────────────────────────────────────────────────────────────
    // RETURN
    // ────────────────────────────────────────────────────────────────────

    return {
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
    };
}

export default useCamera;

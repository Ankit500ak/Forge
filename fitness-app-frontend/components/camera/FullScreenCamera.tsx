'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Repeat2 } from 'lucide-react';

export default function FullScreenCamera() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isFacingUser, setIsFacingUser] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const streamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        startCamera();

        return () => {
            stopCamera();
        };
    }, []);

    const startCamera = async (facingMode: 'user' | 'environment' = 'user') => {
        try {
            setIsLoading(true);

            // Stop previous stream
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }

            const constraints = {
                video: {
                    facingMode: { ideal: facingMode },
                    width: { ideal: window.innerWidth },
                    height: { ideal: window.innerHeight },
                },
                audio: false,
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }

            setIsLoading(false);
        } catch (error) {
            console.error('Error accessing camera:', error);
            setIsLoading(false);
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
    };

    const handleFlipCamera = async () => {
        const newFacingMode = isFacingUser ? 'environment' : 'user';
        setIsFacingUser(!isFacingUser);
        await startCamera(newFacingMode);
    };

    return (
        <div className="relative w-screen h-screen overflow-hidden bg-black">
            <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
            />

            {/* Loading Indicator */}
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="text-white">Starting camera...</div>
                </div>
            )}

            {/* Flip Camera Button - Top Right */}
            <button
                onClick={handleFlipCamera}
                disabled={isLoading}
                className="absolute top-4 right-4 bg-white/90 hover:bg-white text-black rounded-full p-3 shadow-lg transition-all duration-200 z-10 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Flip camera"
            >
                <Repeat2 className="w-6 h-6" />
            </button>
        </div>
    );
}

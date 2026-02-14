import { useState } from 'react'

interface DetectedFood {
    label: string
    confidence: number
    calories: number
    protein: number
    carbs: number
    fat: number
    unit: string
}

export function useFoodDetection() {
    const [isOpen, setIsOpen] = useState(false)
    const [detectedFoods, setDetectedFoods] = useState<DetectedFood[]>([])

    const openCamera = () => {
        setIsOpen(true)
    }

    const closeCamera = () => {
        setIsOpen(false)
    }

    const handleFoodsDetected = (foods: DetectedFood[]) => {
        setDetectedFoods(foods)
    }

    return {
        isOpen,
        detectedFoods,
        openCamera,
        closeCamera,
        handleFoodsDetected,
    }
}

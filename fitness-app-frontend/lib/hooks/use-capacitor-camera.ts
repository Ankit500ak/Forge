'use client'

import { useCallback, useState } from 'react'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'

export function useCapacitorCamera() {
  const [photo, setPhoto] = useState<string | undefined>()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Take a photo from camera
  const takePhoto = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      })

      setPhoto(image.dataUrl)
      return image.dataUrl
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to take photo'
      setError(errorMessage)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Pick a photo from gallery
  const pickPhoto = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
      })

      setPhoto(image.dataUrl)
      return image.dataUrl
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to pick photo'
      setError(errorMessage)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Get camera permissions status (iOS only)
  const checkPermissions = useCallback(async () => {
    try {
      const perms = await Camera.checkPermissions()
      return perms.camera
    } catch (err) {
      setError(`Permission check failed: ${err}`)
      return 'denied'
    }
  }, [])

  // Request camera permissions
  const requestPermissions = useCallback(async () => {
    try {
      const perms = await Camera.requestPermissions({
        permissions: ['camera'],
      })
      return perms.camera
    } catch (err) {
      setError(`Permission request failed: ${err}`)
      return 'denied'
    }
  }, [])

  return {
    photo,
    error,
    isLoading,
    takePhoto,
    pickPhoto,
    checkPermissions,
    requestPermissions,
  }
}

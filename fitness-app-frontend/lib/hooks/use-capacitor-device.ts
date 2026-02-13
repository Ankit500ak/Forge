'use client'

import { useEffect, useState } from 'react'
import { Device } from '@capacitor/device'
import { Motion } from '@capacitor/motion'
import { Geolocation } from '@capacitor/geolocation'

interface DeviceInfo {
  platform: string
  osVersion: string
  model: string
  isNative: boolean
}

interface AccelerometerData {
  x: number
  y: number
  z: number
}

export function useCapacitorDevice() {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null)
  const [accelerometer, setAccelerometer] = useState<AccelerometerData | null>(null)
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Detect if app is running in native context (iOS/Android)
  const isNative = async () => {
    try {
      const info = await Device.getId()
      return !!info.identifier
    } catch {
      return false
    }
  }

  // Get device information
  const getDeviceInfo = async () => {
    try {
      const info = await Device.getId()
      const model = await Device.getInfo()
      const nativeCheck = await isNative()

      setDeviceInfo({
        platform: model.platform,
        osVersion: model.osVersion,
        model: model.model,
        isNative: nativeCheck,
      })
    } catch (err) {
      setError(`Failed to get device info: ${err}`)
    }
  }

  // Start tracking accelerometer (for step counter, motion detection)
  const startAccelerometerTracking = async () => {
    try {
      await Motion.addListener('accel', (event) => {
        setAccelerometer({
          x: Math.round(event.acceleration.x * 100) / 100,
          y: Math.round(event.acceleration.y * 100) / 100,
          z: Math.round(event.acceleration.z * 100) / 100,
        })
      })
    } catch (err) {
      setError(`Failed to start accelerometer: ${err}`)
    }
  }

  // Get user's current location
  const getCurrentLocation = async () => {
    try {
      const coordinates = await Geolocation.getCurrentPosition()
      setLocation({
        latitude: coordinates.coords.latitude,
        longitude: coordinates.coords.longitude,
      })
      return coordinates.coords
    } catch (err) {
      setError(`Failed to get location: ${err}`)
      return null
    }
  }

  // Watch user's location (for outdoor fitness activities)
  const watchLocation = async (callback: (location: { latitude: number; longitude: number }) => void) => {
    try {
      const watchId = await Geolocation.watchPosition(
        {},
        (position, err) => {
          if (position) {
            callback({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            })
          } else if (err) {
            setError(`Location watch error: ${err}`)
          }
        }
      )
      return watchId
    } catch (err) {
      setError(`Failed to watch location: ${err}`)
      return null
    }
  }

  useEffect(() => {
    getDeviceInfo()
    startAccelerometerTracking()
  }, [])

  return {
    deviceInfo,
    accelerometer,
    location,
    error,
    getCurrentLocation,
    watchLocation,
    isNative: deviceInfo?.isNative || false,
  }
}

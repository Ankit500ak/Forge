'use client'

import { useCallback } from 'react'
import { LocalNotifications } from '@capacitor/local-notifications'

export function useCapacitorNotifications() {
  // Send a local notification
  const sendNotification = useCallback(
    async (options: {
      title: string
      body: string
      id?: number
      smallIcon?: string
      color?: string
      actionTypeId?: string
      sound?: string
      vibrate?: boolean
      delay?: number
    }) => {
      try {
        const id = options.id || Date.now()
        
        await LocalNotifications.schedule({
          notifications: [
            {
              title: options.title,
              body: options.body,
              id: id,
              small_icon: options.smallIcon || 'ic_launcher_foreground',
              color: options.color || '#6366f1',
              sound: options.sound || 'notification',
              vibrate: options.vibrate !== false,
              schedule: {
                at: options.delay ? new Date(Date.now() + options.delay * 1000) : new Date(),
              },
            },
          ],
        })

        return id
      } catch (error) {
        console.error('Failed to send notification:', error)
        throw error
      }
    },
    []
  )

  // Schedule a notification for later
  const scheduleNotification = useCallback(
    async (options: {
      title: string
      body: string
      id?: number
      delaySeconds: number
      smallIcon?: string
      color?: string
      sound?: string
    }) => {
      try {
        return await sendNotification({
          ...options,
          delay: options.delaySeconds,
        })
      } catch (error) {
        console.error('Failed to schedule notification:', error)
        throw error
      }
    },
    [sendNotification]
  )

  // Cancel a notification
  const cancelNotification = useCallback(async (id: number) => {
    try {
      await LocalNotifications.cancel({
        notifications: [{ id }],
      })
    } catch (error) {
      console.error('Failed to cancel notification:', error)
      throw error
    }
  }, [])

  // Cancel all notifications
  const cancelAllNotifications = useCallback(async () => {
    try {
      await LocalNotifications.removeAllListeners()
    } catch (error) {
      console.error('Failed to cancel all notifications:', error)
      throw error
    }
  }, [])

  // Request notification permissions (iOS)
  const requestPermissions = useCallback(async () => {
    try {
      const result = await LocalNotifications.requestPermissions()
      return result.display === 'granted'
    } catch (error) {
      console.error('Failed to request notification permissions:', error)
      return false
    }
  }, [])

  return {
    sendNotification,
    scheduleNotification,
    cancelNotification,
    cancelAllNotifications,
    requestPermissions,
  }
}

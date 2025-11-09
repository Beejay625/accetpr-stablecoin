'use client'

import { useState, useEffect } from 'react'
import { notificationManager, type Notification, type NotificationType } from '@/lib/notifications'

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    setNotifications(notificationManager.getAll())
    setUnreadCount(notificationManager.getUnreadCount())

    const unsubscribe = notificationManager.subscribe((notifs) => {
      setNotifications(notifs)
      setUnreadCount(notificationManager.getUnreadCount())
    })

    return unsubscribe
  }, [])

  const add = (
    type: NotificationType,
    title: string,
    message: string,
    options?: { actionUrl?: string; actionLabel?: string }
  ) => {
    return notificationManager.add({
      type,
      title,
      message,
      ...options,
    })
  }

  const markAsRead = (id: string) => {
    notificationManager.markAsRead(id)
  }

  const markAllAsRead = () => {
    notificationManager.markAllAsRead()
  }

  const remove = (id: string) => {
    notificationManager.remove(id)
  }

  const clear = () => {
    notificationManager.clear()
  }

  return {
    notifications,
    unreadCount,
    add,
    markAsRead,
    markAllAsRead,
    remove,
    clear,
  }
}


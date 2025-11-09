'use client'

import { useState, useEffect } from 'react'
import { notificationManager, type Notification } from '@/lib/notifications'
import { formatAddress } from '@/lib/utils'

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    setNotifications(notificationManager.getAll())

    const unsubscribe = notificationManager.subscribe((notifs) => {
      setNotifications(notifs)
    })

    return unsubscribe
  }, [])

  const unreadCount = notifications.filter((n) => !n.read).length

  const handleMarkAsRead = (id: string) => {
    notificationManager.markAsRead(id)
  }

  const handleMarkAllAsRead = () => {
    notificationManager.markAllAsRead()
  }

  const handleRemove = (id: string) => {
    notificationManager.remove(id)
  }

  const handleClear = () => {
    notificationManager.clear()
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative px-3 py-1 text-sm border rounded hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border dark:border-gray-700 z-50 max-h-96 overflow-hidden flex flex-col">
          <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
            <h3 className="font-semibold">Notifications</h3>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={handleClear}
                className="text-xs text-red-600 hover:text-red-800"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                No notifications
              </div>
            ) : (
              <div className="divide-y dark:divide-gray-700">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-3 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                      !notif.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                    onClick={() => handleMarkAsRead(notif.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{notif.title}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {notif.message}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {new Date(notif.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        {!notif.read && (
                          <span className="w-2 h-2 bg-blue-600 rounded-full mt-1"></span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRemove(notif.id)
                          }}
                          className="text-gray-400 hover:text-gray-600 text-xs"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}


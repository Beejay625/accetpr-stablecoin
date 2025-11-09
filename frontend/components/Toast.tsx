'use client'

import { useEffect } from 'react'

interface ToastProps {
  message: string
  type: 'success' | 'error' | 'info'
  onClose: () => void
  duration?: number
}

export default function Toast({ message, type, onClose, duration = 5000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const bgColor = {
    success: 'bg-green-100 dark:bg-green-900 border-green-400 text-green-700 dark:text-green-300',
    error: 'bg-red-100 dark:bg-red-900 border-red-400 text-red-700 dark:text-red-300',
    info: 'bg-blue-100 dark:bg-blue-900 border-blue-400 text-blue-700 dark:text-blue-300',
  }[type]

  return (
    <div
      className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg border ${bgColor} z-50 min-w-[300px] max-w-md animate-slide-in`}
    >
      <div className="flex items-center justify-between">
        <p className="flex-1">{message}</p>
        <button
          onClick={onClose}
          className="ml-4 text-current opacity-70 hover:opacity-100"
        >
          ×
        </button>
      </div>
    </div>
  )
}


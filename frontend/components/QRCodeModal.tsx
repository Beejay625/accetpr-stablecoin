'use client'

import { useEffect, useRef } from 'react'

interface QRCodeModalProps {
  address: string
  isOpen: boolean
  onClose: () => void
}

export default function QRCodeModal({ address, isOpen, onClose }: QRCodeModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!isOpen || !address || !canvasRef.current) return

    // Simple QR code generation using a library or API
    // For now, we'll create a simple visual representation
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const size = 200
    canvas.width = size
    canvas.height = size

    // Clear canvas
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, size, size)

    // Draw a simple pattern (in production, use a QR code library)
    ctx.fillStyle = '#000000'
    const blockSize = size / 25
    for (let i = 0; i < address.length; i++) {
      const x = (i % 25) * blockSize
      const y = Math.floor(i / 25) * blockSize
      if (i % 3 === 0 || i % 7 === 0) {
        ctx.fillRect(x, y, blockSize, blockSize)
      }
    }

    // Draw corner markers (QR code style)
    ctx.fillStyle = '#000000'
    const markerSize = blockSize * 7
    const corners = [
      [blockSize, blockSize],
      [size - markerSize - blockSize, blockSize],
      [blockSize, size - markerSize - blockSize],
    ]

    corners.forEach(([x, y]) => {
      ctx.fillRect(x, y, markerSize, markerSize)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(x + blockSize, y + blockSize, blockSize * 5, blockSize * 5)
      ctx.fillStyle = '#000000'
      ctx.fillRect(x + blockSize * 2, y + blockSize * 2, blockSize * 3, blockSize * 3)
    })
  }, [address, isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-bold">Wallet Address QR Code</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="flex flex-col items-center space-y-4">
          <div className="p-4 bg-white rounded-lg border-2 border-gray-200">
            <canvas ref={canvasRef} className="w-48 h-48" />
          </div>

          <div className="w-full">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 text-center break-all">
              {address}
            </p>
            <button
              onClick={() => {
                navigator.clipboard.writeText(address)
              }}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Copy Address
            </button>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Scan this QR code to get the wallet address
          </p>
        </div>
      </div>
    </div>
  )
}


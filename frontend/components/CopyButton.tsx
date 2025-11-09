'use client'

import { useState } from 'react'
import { copyToClipboard } from '@/lib/utils'

interface CopyButtonProps {
  text: string
  label?: string
  className?: string
}

export default function CopyButton({ text, label = 'Copy', className = '' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await copyToClipboard(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className={`px-2 py-1 text-xs border rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${className}`}
      title={copied ? 'Copied!' : `Copy ${text}`}
    >
      {copied ? '✓ Copied' : label}
    </button>
  )
}


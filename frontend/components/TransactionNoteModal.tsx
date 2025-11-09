'use client'

import { useState, useEffect } from 'react'
import { transactionNotes } from '@/lib/transactionNotes'

interface TransactionNoteModalProps {
  transactionId: string
  hash: string
  isOpen: boolean
  onClose: () => void
}

export default function TransactionNoteModal({
  transactionId,
  hash,
  isOpen,
  onClose,
}: TransactionNoteModalProps) {
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen) {
      const existingNote = transactionNotes.getNote(transactionId)
      setNote(existingNote?.note || '')
    }
  }, [isOpen, transactionId])

  const handleSave = () => {
    setSaving(true)
    transactionNotes.setNote(transactionId, hash, note)
    setTimeout(() => {
      setSaving(false)
      onClose()
    }, 300)
  }

  const handleDelete = () => {
    transactionNotes.deleteNote(transactionId)
    setNote('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b dark:border-gray-700">
          <h2 className="text-xl font-bold">Add Note</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Transaction: {hash.substring(0, 10)}...
          </p>
        </div>

        <div className="p-6">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note about this transaction..."
            className="w-full p-3 border rounded dark:bg-gray-700 dark:border-gray-600 min-h-[100px]"
            autoFocus
          />
        </div>

        <div className="p-6 border-t dark:border-gray-700 flex justify-between">
          <button
            onClick={handleDelete}
            disabled={!note}
            className="px-4 py-2 text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Delete Note
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


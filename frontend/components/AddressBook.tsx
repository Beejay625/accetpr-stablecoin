'use client'

import { useState, useEffect } from 'react'
import CopyButton from './CopyButton'
import { formatAddress } from '@/lib/utils'

interface SavedAddress {
  id: string
  name: string
  address: string
  chain: string
}

const STORAGE_KEY = 'wallet_address_book'

export default function AddressBook({ onSelectAddress }: { onSelectAddress?: (address: string) => void }) {
  const [addresses, setAddresses] = useState<SavedAddress[]>([])
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    chain: 'base',
  })

  useEffect(() => {
    loadAddresses()
  }, [])

  const loadAddresses = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setAddresses(JSON.parse(stored))
      }
    } catch (err) {
      console.error('Failed to load addresses:', err)
    }
  }

  const saveAddresses = (newAddresses: SavedAddress[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newAddresses))
      setAddresses(newAddresses)
    } catch (err) {
      console.error('Failed to save addresses:', err)
    }
  }

  const handleAdd = () => {
    if (!formData.name || !formData.address) return

    const newAddress: SavedAddress = {
      id: Math.random().toString(36).substring(7),
      ...formData,
    }

    saveAddresses([...addresses, newAddress])
    setFormData({ name: '', address: '', chain: 'base' })
    setShowForm(false)
  }

  const handleDelete = (id: string) => {
    saveAddresses(addresses.filter((addr) => addr.id !== id))
  }

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Address Book</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : '+ Add Address'}
        </button>
      </div>

      {showForm && (
        <div className="mb-4 p-4 border rounded-lg dark:border-gray-700">
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Name (e.g., My Wallet)"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            />
            <input
              type="text"
              placeholder="Address (0x...)"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            />
            <select
              value={formData.chain}
              onChange={(e) => setFormData({ ...formData, chain: e.target.value })}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="base">Base</option>
              <option value="arbitrum">Arbitrum</option>
              <option value="ethereum">Ethereum</option>
            </select>
            <button
              onClick={handleAdd}
              className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Save Address
            </button>
          </div>
        </div>
      )}

      {addresses.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-center py-4">
          No saved addresses. Add one to get started.
        </p>
      ) : (
        <div className="space-y-2">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className="p-3 border rounded-lg dark:border-gray-700 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <div className="flex-1">
                <p className="font-medium">{addr.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formatAddress(addr.address)}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{addr.chain}</p>
              </div>
              <div className="flex gap-2">
                {onSelectAddress && (
                  <button
                    onClick={() => onSelectAddress(addr.address)}
                    className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Use
                  </button>
                )}
                <CopyButton text={addr.address} label="Copy" />
                <button
                  onClick={() => handleDelete(addr.id)}
                  className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


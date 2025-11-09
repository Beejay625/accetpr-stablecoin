'use client'

import { useState, useEffect } from 'react'
import { addressBook, type AddressEntry } from '@/lib/addressBook'
import { type Address } from 'viem'

export default function AddressBookComponent() {
  const [addresses, setAddresses] = useState<AddressEntry[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newAddress, setNewAddress] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [newTags, setNewTags] = useState('')

  useEffect(() => {
    loadAddresses()
  }, [])

  const loadAddresses = () => {
    if (searchQuery) {
      setAddresses(addressBook.searchAddresses(searchQuery))
    } else {
      setAddresses(Array.from(addressBook['addresses'].values()))
    }
  }

  useEffect(() => {
    loadAddresses()
  }, [searchQuery])

  const handleAdd = () => {
    if (!newAddress || !newLabel) return

    addressBook.addAddress({
      address: newAddress as Address,
      label: newLabel,
      isWhitelisted: false,
      tags: newTags.split(',').map(t => t.trim()).filter(Boolean),
    })

    setNewAddress('')
    setNewLabel('')
    setNewTags('')
    setShowAddForm(false)
    loadAddresses()
  }

  const handleWhitelist = (address: Address) => {
    addressBook.whitelistAddress(address)
    loadAddresses()
  }

  const handleRemove = (address: Address) => {
    addressBook.deleteAddress(address)
    loadAddresses()
  }

  const handleExport = () => {
    const json = addressBook.exportAddresses()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'address-book.json'
    a.click()
  }

  return (
    <div className="p-6 bg-white border rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Address Book</h2>
        <div className="space-x-2">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Add Address
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Export
          </button>
        </div>
      </div>

      <div className="mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search addresses..."
          className="w-full p-2 border rounded-md"
        />
      </div>

      {showAddForm && (
        <div className="p-4 bg-gray-50 rounded-lg mb-4">
          <h3 className="font-semibold mb-2">Add New Address</h3>
          <div className="space-y-2">
            <input
              type="text"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              placeholder="0x..."
              className="w-full p-2 border rounded-md"
            />
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Label"
              className="w-full p-2 border rounded-md"
            />
            <input
              type="text"
              value={newTags}
              onChange={(e) => setNewTags(e.target.value)}
              placeholder="Tags (comma-separated)"
              className="w-full p-2 border rounded-md"
            />
            <div className="flex space-x-2">
              <button
                onClick={handleAdd}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Add
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {addresses.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No addresses found</p>
        ) : (
          addresses.map((entry) => (
            <div
              key={entry.address}
              className="p-4 border rounded-lg flex justify-between items-center"
            >
              <div>
                <div className="font-medium">{entry.label}</div>
                <div className="text-sm text-gray-600 font-mono">
                  {entry.address}
                </div>
                {entry.tags.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {entry.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex space-x-2">
                {entry.isWhitelisted ? (
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                    Whitelisted
                  </span>
                ) : (
                  <button
                    onClick={() => handleWhitelist(entry.address)}
                    className="px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                  >
                    Whitelist
                  </button>
                )}
                <button
                  onClick={() => handleRemove(entry.address)}
                  className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                >
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

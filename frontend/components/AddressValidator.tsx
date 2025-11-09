'use client'

import { useState } from 'react'
import { validateAddress } from '@/lib/addressValidation'
import CopyButton from './CopyButton'

interface AddressValidatorProps {
  onValidAddress?: (address: string) => void
}

export default function AddressValidator({ onValidAddress }: AddressValidatorProps) {
  const [address, setAddress] = useState('')
  const [validation, setValidation] = useState<{ isValid: boolean; error?: string; checksumAddress?: string } | null>(null)

  const handleValidate = () => {
    const result = validateAddress(address)
    setValidation(result)

    if (result.isValid && result.checksumAddress && onValidAddress) {
      onValidAddress(result.checksumAddress)
    }
  }

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Address Validator</h3>
      
      <div className="space-y-3">
        <div>
          <input
            type="text"
            value={address}
            onChange={(e) => {
              setAddress(e.target.value)
              setValidation(null)
            }}
            onBlur={handleValidate}
            placeholder="0x..."
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          />
        </div>

        {validation && (
          <div>
            {validation.isValid ? (
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-800 dark:text-green-200 font-medium">✓ Valid Address</p>
                    {validation.checksumAddress && (
                      <p className="text-sm text-green-700 dark:text-green-300 mt-1 break-all">
                        {validation.checksumAddress}
                      </p>
                    )}
                  </div>
                  {validation.checksumAddress && (
                    <CopyButton text={validation.checksumAddress} label="Copy" />
                  )}
                </div>
              </div>
            ) : (
              <div className="p-3 bg-red-100 dark:bg-red-900 rounded">
                <p className="text-red-800 dark:text-red-200">✗ {validation.error}</p>
              </div>
            )}
          </div>
        )}

        <button
          onClick={handleValidate}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Validate Address
        </button>
      </div>
    </div>
  )
}


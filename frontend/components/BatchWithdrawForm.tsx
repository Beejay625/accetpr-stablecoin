'use client'

import { useState } from 'react'
import { walletApi } from '@/lib/api'

interface WithdrawAsset {
  chain: string
  asset: string
  amount: string
  address: string
  metadata?: Record<string, any>
  reference?: string
}

interface BatchWithdrawFormProps {
  chain: string
  getToken: () => Promise<string | null>
}

export default function BatchWithdrawForm({ chain, getToken }: BatchWithdrawFormProps) {
  const [assets, setAssets] = useState<WithdrawAsset[]>([
    { chain, asset: 'USDC', amount: '', address: '' },
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const addAsset = () => {
    if (assets.length >= 10) {
      setError('Maximum 10 assets allowed per batch')
      return
    }
    setAssets([...assets, { chain, asset: 'USDC', amount: '', address: '' }])
  }

  const removeAsset = (index: number) => {
    if (assets.length === 1) {
      setError('At least one asset is required')
      return
    }
    setAssets(assets.filter((_, i) => i !== index))
  }

  const updateAsset = (index: number, field: keyof WithdrawAsset, value: string) => {
    setAssets(assets.map((asset, i) => (i === index ? { ...asset, [field]: value } : asset)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const token = await getToken()
      if (!token) {
        throw new Error('Authentication required')
      }

      // Validate all assets
      const invalidAssets = assets.filter(
        (a) => !a.chain || !a.asset || !a.amount || !a.address
      )
      if (invalidAssets.length > 0) {
        throw new Error('Please fill in all required fields for all assets')
      }

      const response = await walletApi.withdrawBatch(assets, token)

      if (response.success && response.data) {
        setSuccess(
          `Batch withdrawal initiated! Transaction ID: ${response.data.transactionId}. Total: ${response.data.totalAmount} across ${response.data.assetCount} assets.`
        )
        setAssets([{ chain, asset: 'USDC', amount: '', address: '' }])
      } else {
        throw new Error(response.message || 'Batch withdrawal failed')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to process batch withdrawal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4">Batch Withdraw</h3>

      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-100 dark:bg-green-900 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {assets.map((asset, index) => (
          <div key={index} className="p-4 border rounded-lg dark:border-gray-700">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-medium">Asset {index + 1}</h4>
              {assets.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeAsset(index)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Remove
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Asset</label>
                <select
                  value={asset.asset}
                  onChange={(e) => updateAsset(index, 'asset', e.target.value)}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  required
                >
                  <option value="USDC">USDC</option>
                  <option value="USDT">USDT</option>
                  <option value="ETH">ETH</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Amount</label>
                <input
                  type="text"
                  value={asset.amount}
                  onChange={(e) => updateAsset(index, 'amount', e.target.value)}
                  placeholder="0.0"
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Recipient Address</label>
                <input
                  type="text"
                  value={asset.address}
                  onChange={(e) => updateAsset(index, 'address', e.target.value)}
                  placeholder="0x..."
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  required
                />
              </div>
            </div>
          </div>
        ))}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={addAsset}
            disabled={assets.length >= 10}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
          >
            + Add Asset ({assets.length}/10)
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : `Withdraw ${assets.length} Asset${assets.length > 1 ? 's' : ''}`}
        </button>
      </form>
    </div>
  )
}


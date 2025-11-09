'use client'

import { useState } from 'react'
import { walletApi } from '@/lib/api'
import { useAccount } from 'wagmi'
import { useToast } from './ToastProvider'
import { validateAddress, validateAmount } from '@/lib/addressValidation'
import { useNotifications } from '@/hooks/useNotifications'

interface WithdrawFormProps {
  chain: string
  getToken: () => Promise<string | null>
}

export default function WithdrawForm({ chain, getToken }: WithdrawFormProps) {
  const { address } = useAccount()
  const { showToast } = useToast()
  const { add: addNotification } = useNotifications()
  const [asset, setAsset] = useState('USDC')
  const [amount, setAmount] = useState('')
  const [recipientAddress, setRecipientAddress] = useState('')
  const [reference, setReference] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [addressError, setAddressError] = useState<string | null>(null)
  const [amountError, setAmountError] = useState<string | null>(null)

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

      if (!recipientAddress || !amount) {
        throw new Error('Please fill in all required fields')
      }

      const response = await walletApi.withdrawSingle(
        chain,
        asset,
        amount,
        recipientAddress,
        token,
        undefined,
        reference || undefined
      )

      if (response.success && response.data) {
        const message = `Withdrawal initiated! Transaction ID: ${response.data.transactionId}`
        setSuccess(message)
        showToast(message, 'success')
        setAmount('')
        setRecipientAddress('')
        setReference('')
      } else {
        throw new Error(response.message || 'Withdrawal failed')
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to process withdrawal'
      setError(errorMessage)
      showToast(errorMessage, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4">Withdraw</h3>

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
        <div>
          <label className="block text-sm font-medium mb-1">Asset</label>
          <select
            value={asset}
            onChange={(e) => setAsset(e.target.value)}
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
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Recipient Address</label>
          <input
            type="text"
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
            placeholder="0x..."
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Reference (Optional)</label>
          <input
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="Optional reference note"
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          />
        </div>

        <div>
          <p className="text-xs text-gray-500 mb-2">Chain: {chain}</p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : 'Withdraw'}
        </button>
      </form>
    </div>
  )
}


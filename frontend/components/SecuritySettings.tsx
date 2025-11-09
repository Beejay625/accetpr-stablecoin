'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { securityManager, type SecurityPolicy } from '@/lib/security'
import { parseUnits, formatUnits } from 'viem'

export default function SecuritySettingsComponent() {
  const { address } = useAccount()
  const [policy, setPolicy] = useState<SecurityPolicy | null>(null)
  const [dailyLimit, setDailyLimit] = useState('')
  const [transactionLimit, setTransactionLimit] = useState('')
  const [requireApproval, setRequireApproval] = useState(false)
  const [whitelistOnly, setWhitelistOnly] = useState(false)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)

  useEffect(() => {
    if (address) {
      const currentPolicy = securityManager.getPolicy(address)
      setPolicy(currentPolicy)
      setDailyLimit(formatUnits(currentPolicy.dailyLimit, 18))
      setTransactionLimit(formatUnits(currentPolicy.transactionLimit, 18))
      setRequireApproval(currentPolicy.requireApproval)
      setWhitelistOnly(currentPolicy.whitelistOnly)
      setTwoFactorEnabled(currentPolicy.twoFactorEnabled)
    }
  }, [address])

  const handleSave = () => {
    if (!address) return

    securityManager.setPolicy(address, {
      dailyLimit: parseUnits(dailyLimit, 18),
      transactionLimit: parseUnits(transactionLimit, 18),
      requireApproval,
      whitelistOnly,
      twoFactorEnabled,
    })

    alert('Security settings saved!')
  }

  const handleToggle2FA = () => {
    if (!address) return

    if (twoFactorEnabled) {
      securityManager.disable2FA(address)
      setTwoFactorEnabled(false)
    } else {
      securityManager.enable2FA(address)
      setTwoFactorEnabled(true)
    }
  }

  if (!address) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <p className="text-gray-600">Please connect your wallet</p>
      </div>
    )
  }

  const limit = securityManager.getLimit(address)

  return (
    <div className="p-6 bg-white border rounded-lg shadow-sm">
      <h2 className="text-2xl font-bold mb-4">Security Settings</h2>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Transaction Limits</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Daily Limit (ETH)
              </label>
              <input
                type="number"
                value={dailyLimit}
                onChange={(e) => setDailyLimit(e.target.value)}
                className="w-full p-2 border rounded-md"
                step="0.001"
              />
              <p className="text-xs text-gray-500 mt-1">
                Daily spent: {formatUnits(limit.dailySpent, 18)} ETH
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Transaction Limit (ETH)
              </label>
              <input
                type="number"
                value={transactionLimit}
                onChange={(e) => setTransactionLimit(e.target.value)}
                className="w-full p-2 border rounded-md"
                step="0.001"
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Security Options</h3>
          
          <div className="space-y-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={requireApproval}
                onChange={(e) => setRequireApproval(e.target.checked)}
                className="mr-2"
              />
              <span>Require approval for transactions</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={whitelistOnly}
                onChange={(e) => setWhitelistOnly(e.target.checked)}
                className="mr-2"
              />
              <span>Only allow transactions to whitelisted addresses</span>
            </label>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium">Two-Factor Authentication</div>
                <div className="text-sm text-gray-600">
                  {twoFactorEnabled ? 'Enabled' : 'Disabled'}
                </div>
              </div>
              <button
                onClick={handleToggle2FA}
                className={`px-4 py-2 rounded ${
                  twoFactorEnabled
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-green-500 hover:bg-green-600'
                } text-white`}
              >
                {twoFactorEnabled ? 'Disable' : 'Enable'}
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Save Settings
        </button>
      </div>
    </div>
  )
}


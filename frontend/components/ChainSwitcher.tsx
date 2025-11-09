'use client'

import { useChainId, useSwitchChain } from 'wagmi'
import { getChainDisplayName } from '@/lib/utils'

const CHAINS = [
  { id: 8453, name: 'base' },
  { id: 42161, name: 'arbitrum' },
  { id: 1, name: 'ethereum' },
  { id: 84532, name: 'base-sepolia' },
]

export default function ChainSwitcher() {
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()

  const currentChain = CHAINS.find((c) => c.id === chainId)

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium">Chain:</label>
      <select
        value={chainId}
        onChange={(e) => {
          const targetChainId = parseInt(e.target.value)
          switchChain({ chainId: targetChainId })
        }}
        className="px-3 py-1 border rounded dark:bg-gray-700 dark:border-gray-600 text-sm"
      >
        {CHAINS.map((chain) => (
          <option key={chain.id} value={chain.id}>
            {getChainDisplayName(chain.name)}
          </option>
        ))}
      </select>
    </div>
  )
}


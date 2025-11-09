'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { multisigManager, type MultisigProposal } from '@/lib/multisig'
import { formatUnits } from 'viem'
import { type Address } from 'viem'

interface MultisigProposalProps {
  multisigAddress: Address
}

export default function MultisigProposalComponent({ multisigAddress }: MultisigProposalProps) {
  const { address } = useAccount()
  const [proposals, setProposals] = useState<MultisigProposal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProposals()
    const interval = setInterval(loadProposals, 5000)
    return () => clearInterval(interval)
  }, [multisigAddress])

  const loadProposals = () => {
    const pending = multisigManager.getPendingProposals(multisigAddress)
    setProposals(pending)
    setLoading(false)
  }

  const handleApprove = (transactionId: string) => {
    if (!address) return

    const approved = multisigManager.approveTransaction(transactionId, address)
    if (approved) {
      loadProposals()
    }
  }

  if (loading) {
    return <div className="p-4">Loading proposals...</div>
  }

  if (proposals.length === 0) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">No pending proposals</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Pending Proposals</h3>
      {proposals.map((proposal) => {
        const canExecute = multisigManager.canExecute(proposal.transaction.id)
        const hasApproved = proposal.transaction.approvals.includes(address || '0x')

        return (
          <div key={proposal.transaction.id} className="p-4 border rounded-lg">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-medium">To: {proposal.transaction.to.slice(0, 10)}...</p>
                <p className="text-sm text-gray-600">
                  Value: {formatUnits(proposal.transaction.value, 18)} ETH
                </p>
              </div>
              {canExecute && (
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                  Ready to Execute
                </span>
              )}
            </div>

            {proposal.description && (
              <p className="text-sm text-gray-600 mb-2">{proposal.description}</p>
            )}

            <div className="flex justify-between items-center">
              <div className="text-sm">
                <span className="text-gray-600">Approvals: </span>
                <span className="font-medium">
                  {proposal.transaction.approvals.length} / {multisigManager.getWallet(multisigAddress)?.threshold || 0}
                </span>
              </div>

              {!hasApproved && (
                <button
                  onClick={() => handleApprove(proposal.transaction.id)}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Approve
                </button>
              )}

              {hasApproved && (
                <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                  Approved
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}


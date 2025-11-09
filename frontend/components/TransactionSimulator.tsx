'use client'

import { useState } from 'react'
import { useAccount, useBalance } from 'wagmi'
import { transactionSimulator, type SimulationResult } from '@/lib/transactionSimulator'
import { useCurrentGasPrice } from '@/lib/gas'
import { parseUnits, formatUnits } from 'viem'
import { type Address } from 'viem'

export default function TransactionSimulatorComponent() {
  const { address } = useAccount()
  const { data: balance } = useBalance({ address })
  const { data: gasPrice } = useCurrentGasPrice()
  const [to, setTo] = useState<Address>('0x' as Address)
  const [amount, setAmount] = useState('')
  const [simulation, setSimulation] = useState<SimulationResult | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSimulate = async () => {
    if (!address || !balance || !gasPrice || !to || !amount) return

    setLoading(true)
    try {
      const value = parseUnits(amount, 18)
      const result = await transactionSimulator.simulate(
        address,
        to,
        value,
        '0x',
        gasPrice,
        balance.value
      )
      setSimulation(result)
    } catch (error) {
      console.error('Simulation error:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatted = simulation
    ? transactionSimulator.formatSimulation(simulation.simulation)
    : null

  return (
    <div className="p-6 bg-white border rounded-lg shadow-sm">
      <h2 className="text-2xl font-bold mb-4">Transaction Simulator</h2>

      <div className="space-y-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-2">To Address</label>
          <input
            type="text"
            value={to}
            onChange={(e) => setTo(e.target.value as Address)}
            className="w-full p-2 border rounded-md"
            placeholder="0x..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Amount (ETH)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full p-2 border rounded-md"
            placeholder="0.1"
            step="0.001"
          />
        </div>

        <button
          onClick={handleSimulate}
          disabled={loading || !address || !balance || !gasPrice}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
        >
          {loading ? 'Simulating...' : 'Simulate Transaction'}
        </button>
      </div>

      {simulation && formatted && (
        <div className="space-y-4">
          <div className={`p-4 rounded-lg ${simulation.simulation.success ? 'bg-green-50' : 'bg-red-50'}`}>
            <h3 className="font-semibold mb-2">
              {simulation.simulation.success ? '✓ Transaction Valid' : '✗ Transaction Invalid'}
            </h3>
            {simulation.simulation.error && (
              <p className="text-red-600 mb-2">{simulation.simulation.error}</p>
            )}

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Gas Estimate:</span>
                <span className="font-mono">{formatted.gasEstimate}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Cost:</span>
                <span className="font-mono">{formatted.totalCost} ETH</span>
              </div>
              <div className="flex justify-between">
                <span>Balance Before:</span>
                <span className="font-mono">{formatted.balanceBefore} ETH</span>
              </div>
              <div className="flex justify-between">
                <span>Balance After:</span>
                <span className="font-mono">{formatted.balanceAfter} ETH</span>
              </div>
              <div className="flex justify-between">
                <span>Balance Change:</span>
                <span className="font-mono">-{formatted.balanceChange} ETH</span>
              </div>
            </div>
          </div>

          {simulation.warnings.length > 0 && (
            <div className="p-4 bg-yellow-50 rounded-lg">
              <h4 className="font-semibold mb-2">⚠️ Warnings</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {simulation.warnings.map((warning, i) => (
                  <li key={i}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          {simulation.recommendations.length > 0 && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold mb-2">💡 Recommendations</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {simulation.recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}


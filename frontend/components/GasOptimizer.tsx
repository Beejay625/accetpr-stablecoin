'use client'

import { useGasOptimization } from '@/hooks/useGasOptimization'
import { formatUnits } from 'viem'

export default function GasOptimizer() {
  const { currentGasPrice, optimizedGasPrice, strategy, setStrategy, isLoading } = useGasOptimization()

  if (isLoading) {
    return (
      <div className="p-4 bg-gray-100 rounded-lg">
        <p className="text-sm text-gray-600">Loading gas prices...</p>
      </div>
    )
  }

  return (
    <div className="p-4 bg-white border rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Gas Price Optimization</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Strategy
          </label>
          <select
            value={strategy}
            onChange={(e) => setStrategy(e.target.value as any)}
            className="w-full p-2 border rounded-md"
          >
            <option value="conservative">Conservative (Lower gas, slower)</option>
            <option value="standard">Standard (Balanced)</option>
            <option value="aggressive">Aggressive (Higher gas, faster)</option>
          </select>
        </div>

        {currentGasPrice && (
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Current Gas Price:</span>
              <span className="text-sm font-mono">
                {formatUnits(currentGasPrice, 9)} Gwei
              </span>
            </div>
            
            {optimizedGasPrice && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Optimized Gas Price:</span>
                <span className="text-sm font-mono font-semibold">
                  {formatUnits(optimizedGasPrice, 9)} Gwei
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}


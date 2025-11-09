'use client'

interface HelpModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-bold">Help & Documentation</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          <section>
            <h3 className="text-lg font-semibold mb-2">Getting Started</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li>Connect your wallet using the AppKit button</li>
              <li>Sign in with Clerk authentication</li>
              <li>Select your preferred blockchain network</li>
              <li>View your balance and transaction history</li>
            </ol>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">Features</h3>
            <ul className="list-disc list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li><strong>Balance Display:</strong> View your wallet balance for the selected chain</li>
              <li><strong>Transactions:</strong> Browse and filter your transaction history</li>
              <li><strong>Withdrawals:</strong> Execute single or batch withdrawals</li>
              <li><strong>Address Book:</strong> Save frequently used addresses</li>
              <li><strong>Statistics:</strong> View transaction statistics and metrics</li>
              <li><strong>Export:</strong> Export transaction data as CSV or JSON</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">Supported Networks</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
              <li>Base</li>
              <li>Arbitrum</li>
              <li>Ethereum</li>
              <li>Base Sepolia (Testnet)</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">Supported Assets</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
              <li>USDC (USD Coin)</li>
              <li>USDT (Tether)</li>
              <li>ETH (Ethereum)</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">Tips</h3>
            <ul className="list-disc list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li>Use the address book to save frequently used addresses</li>
              <li>Filter transactions by status or asset to find specific transactions</li>
              <li>Export your transaction history for record-keeping</li>
              <li>Check the statistics dashboard for quick insights</li>
              <li>Use QR codes to easily share your wallet address</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">Troubleshooting</h3>
            <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <p><strong>Can't connect wallet?</strong> Make sure you have a compatible wallet extension installed.</p>
              <p><strong>Transactions not showing?</strong> Check that you're on the correct network.</p>
              <p><strong>Balance not updating?</strong> Click the refresh button or wait for auto-refresh.</p>
            </div>
          </section>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}


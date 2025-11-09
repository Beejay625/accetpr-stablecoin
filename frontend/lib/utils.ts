export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function formatAddress(address: string, startLength = 6, endLength = 4): string {
  if (!address) return ''
  if (address.length <= startLength + endLength) return address
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`
}

export function formatAmount(amount: string | number, decimals = 6): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(num)) return '0'
  return num.toFixed(decimals).replace(/\.?0+$/, '')
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text)
}

export function getExplorerUrl(chain: string, hash: string): string {
  const explorerMap: Record<string, string> = {
    base: 'https://basescan.org',
    'base-sepolia': 'https://sepolia.basescan.org',
    arbitrum: 'https://arbiscan.io',
    ethereum: 'https://etherscan.io',
  }
  const baseUrl = explorerMap[chain.toLowerCase()] || 'https://basescan.org'
  return `${baseUrl}/tx/${hash}`
}

export function getChainDisplayName(chain: string): string {
  const chainMap: Record<string, string> = {
    base: 'Base',
    'base-sepolia': 'Base Sepolia',
    arbitrum: 'Arbitrum',
    ethereum: 'Ethereum',
  }
  return chainMap[chain.toLowerCase()] || chain
}


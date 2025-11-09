import { cookieStorage, createStorage, http } from '@wagmi/core'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { 
  mainnet, 
  arbitrum, 
  base, 
  baseSepolia,
  optimism,
  polygon,
  scroll,
  bsc,
  fantom,
  linea,
  mantle,
  celo,
  zkSync,
  avalanche
} from '@reown/appkit/networks'

// Get projectId from https://dashboard.reown.com
export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID

if (!projectId) {
  throw new Error('Project ID is not defined. Please set NEXT_PUBLIC_PROJECT_ID in your .env file')
}

// Set up networks based on environment
const isDev = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'dev'

// Production networks (testnets)
const productionNetworks = [baseSepolia]

// Development networks (mainnets + testnets)
const developmentNetworks = [
  mainnet,
  arbitrum,
  base,
  optimism,
  polygon,
  scroll,
  bsc,
  fantom,
  linea,
  mantle,
  celo,
  zkSync,
  avalanche
]

export const networks = isDev ? developmentNetworks : productionNetworks

// Network priority order for UI display
export const networkPriority = [
  'base',
  'arbitrum',
  'optimism',
  'polygon',
  'scroll',
  'ethereum',
  'bsc',
  'fantom',
  'linea',
  'mantle',
  'celo',
  'zksync',
  'avalanche'
] as const

// Set up the Wagmi Adapter (Config)
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage
  }),
  ssr: true,
  projectId,
  networks
})

export const config = wagmiAdapter.wagmiConfig


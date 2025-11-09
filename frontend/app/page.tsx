import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs'
import WalletConnectButton from '@/components/WalletConnectButton'
import WalletDashboard from '@/components/WalletDashboard'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">StableStack Wallet</h1>
        
        <div className="flex flex-col items-center gap-4">
          <SignedOut>
            <SignInButton>
              <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
          
          <SignedIn>
            <div className="flex items-center gap-4 mb-4">
              <UserButton />
              <WalletConnectButton />
            </div>
            <WalletDashboard />
          </SignedIn>
        </div>
      </div>
    </main>
  )
}


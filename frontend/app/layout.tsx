import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { headers } from 'next/headers'
import { ClerkProvider } from '@clerk/nextjs'
import ContextProvider from '@/context'
import { ToastProvider } from '@/components/ToastProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'StableStack - Wallet Management',
  description: 'Powered by Reown AppKit',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const headersObj = await headers()
  const cookies = headersObj.get('cookie')

  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <ContextProvider cookies={cookies}>
            <ToastProvider>{children}</ToastProvider>
          </ContextProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}


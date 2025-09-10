import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { SessionProvider } from '@/components/session-provider'
import { ThemeProvider } from '@/components/theme-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Scale Labs - AI-Powered Business Automation',
  description: 'Scale your business with AI agents for sales and customer support',
  icons: {
    icon: [
      { url: '/images/scaleExpert.png', sizes: '32x32', type: 'image/png' },
      { url: '/images/scaleExpert.png', sizes: '16x16', type: 'image/png' }
    ],
    apple: [
      { url: '/images/scaleExpert.png', sizes: '180x180', type: 'image/png' }
    ],
    shortcut: '/images/scaleExpert.png'
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <SessionProvider>
            {children}
            <Toaster />
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { SessionProvider } from '@/components/session-provider'
import { ThemeProvider } from '@/components/theme-provider'
import { Analytics } from '@vercel/analytics/next'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Scale Labs - AI-Powered Business Automation',
  description: 'Scale your business with AI agents for sales and customer support',
  icons: {
    icon: [
      { url: 'https://yjq0uw1vlhs3s48i.public.blob.vercel-storage.com/images/scaleExpert.png', sizes: '32x32', type: 'image/png' },
      { url: 'https://yjq0uw1vlhs3s48i.public.blob.vercel-storage.com/images/scaleExpert.png', sizes: '16x16', type: 'image/png' }
    ],
    apple: [
      { url: 'https://yjq0uw1vlhs3s48i.public.blob.vercel-storage.com/images/scaleExpert.png', sizes: '180x180', type: 'image/png' }
    ],
    shortcut: 'https://yjq0uw1vlhs3s48i.public.blob.vercel-storage.com/images/scaleExpert.png'
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
        <Analytics />
      </body>
    </html>
  )
}

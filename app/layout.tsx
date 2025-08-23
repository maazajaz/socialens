import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../src/globals.css'
import { QueryProvider } from '../src/lib/react-query/QueryProvider'
import { AuthProvider } from '../src/context/SupabaseAuthContext'
import { NotificationProvider } from '../src/context/NotificationContext'
import NotificationManager from '../src/components/NotificationManager'
import { Toaster } from '../src/components/ui/toaster'
import '../src/lib/utils/suppressAuthWarnings'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Socialens',
  description: 'A social media application powered by Next.js and Supabase',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryProvider>
          <AuthProvider>
            <NotificationProvider>
              {children}
              <NotificationManager />
              <Toaster />
            </NotificationProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  )
}

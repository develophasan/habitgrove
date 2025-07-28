import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'HabitGrove - Sustainability Habit Tracking',
  description: 'Track your sustainable habits and join groups to make a collective impact on the environment.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
          {children}
        </div>
      </body>
    </html>
  )
}

import type { Metadata } from 'next'
import { Rubik } from 'next/font/google'
import './globals.sass'

const rubik = Rubik({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-rubik',
})

export const metadata: Metadata = {
  title: 'Taskly',
  description: '📋 Tasks, 🎯 Goals & 🔥 Habits tracker',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={rubik.variable} suppressHydrationWarning>{children}</body>
    </html>
  )
}

import type { Metadata } from 'next'
import { Rubik, Space_Grotesk } from 'next/font/google'
import './globals.sass'

const rubik = Rubik({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-rubik',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-space-grotesk',
})

export const metadata: Metadata = {
  title: 'Taskly',
  description: '📋 Tasks, 🎯 Goals & 🔥 Habits tracker',
}

// Runs before paint to avoid a flash of the wrong theme.
// Reads localStorage; falls back to OS preference; defaults to dark.
const themeBootstrap = `(function(){try{var t=localStorage.getItem('taskly-theme');if(!t){t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}if(t==='light')document.documentElement.setAttribute('data-theme','light');}catch(e){}})();`

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body
        className={`${rubik.variable} ${spaceGrotesk.variable}`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  )
}

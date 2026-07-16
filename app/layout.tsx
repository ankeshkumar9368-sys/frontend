import './globals.css'
import type { Metadata, Viewport } from 'next'
import { ThemeProvider } from '../components/theme-provider'
import AuthProvider from '../components/AuthProvider'
import CapacitorHandler from '../components/CapacitorHandler'
import PushNotificationManager from '../components/PushNotificationManager'
import GlobalAntiCheat from '../components/GlobalAntiCheat'
import Script from 'next/script'

export const viewport: Viewport = {
  themeColor: '#6366f1',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover'
};

export const metadata: Metadata = {
  title: 'Achivox - Padho kam, score zyada | CBSE, BSEB Class 9-12 Topper Notes & Mock Tests',
  description: 'Achivox is the #1 study app for Class 9-12 (CBSE, Bihar Board) and competitive exams. Get toppers handwritten notes, mock tests, subject syllabus, and live AI doubt solver.',
  keywords: [
    'topper notes', 'CBSE Class 10 notes', 'Bihar board Class 12 notes', 
    'free school mock tests', 'Govt exam preparation', 'previous year questions PYQs', 
    'class 9 to 12 study app', 'Achivox study portal', 'padho kam score zyada'
  ],
  appleWebApp: { title: 'Achivox' },
  icons: {
    icon: '/achivox-logo.png',
    apple: '/achivox-logo.png',
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script 
          src="https://unpkg.com/html2pdf.js@0.10.1/dist/html2pdf.bundle.min.js" 
          strategy="beforeInteractive"
        />

      </head>
      <body className="bg-slate-200 h-[100dvh] overflow-hidden flex items-center justify-center select-none">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <GlobalAntiCheat />
          <CapacitorHandler />
          <PushNotificationManager />
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

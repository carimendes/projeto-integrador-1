import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import './globals.css'
import {
  PreferenciasProvider,
  SCRIPT_APLICAR_ANTES,
} from '@/components/acessibilidade/preferencias-provider'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Projeto Integrado I - UNIVESP | Sistema de Estoque',
  description: 'Sistema de gerenciamento de estoque de bobinas de papel',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    // suppressHydrationWarning: o script abaixo coloca as preferências de
    // acessibilidade no <html> antes do React carregar.
    <html lang="pt-BR" className="bg-background" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_APLICAR_ANTES }} />
      </head>
      <body className="font-sans antialiased min-h-screen">
        <PreferenciasProvider>{children}</PreferenciasProvider>
        <Toaster richColors position="top-right" />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}

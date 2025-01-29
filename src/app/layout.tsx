import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'UniTn Voting Platform',
    description: 'A blockchain-based voting platform for the University of Trento',
  }

export default function RootLayout({
    children,
  }: {
    children: React.ReactNode
  }) {
    return (
      <html lang="en">
        <head>
        </head>
        <body>
          <div id="root">{children}</div>
        </body>
      </html>
    )
  }
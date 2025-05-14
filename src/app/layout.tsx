import './globals.css'

export const metadata = {
  title: 'Молитвенная стена',
  description: 'Молитвенная стена',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

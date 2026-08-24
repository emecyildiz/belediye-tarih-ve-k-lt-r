import React from 'react'

export const metadata = {
  description: 'Hatay tarihi ve kültürel miras içerik yönetim sistemi.',
  title: 'TKMBS İçerik Yönetimi',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="tr">
      <body>
        <main>{children}</main>
      </body>
    </html>
  )
}

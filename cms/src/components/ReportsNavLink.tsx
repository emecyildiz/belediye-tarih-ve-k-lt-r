'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'

import './ReportsNavLink.scss'

export default function ReportsNavLink() {
  const pathname = usePathname()
  const active = pathname === '/admin/raporlar'

  return (
    <div className="tkmbs-report-nav">
      <span className="tkmbs-report-nav__group">Raporlama</span>
      <Link className={active ? 'is-active' : ''} href="/admin/raporlar" aria-current={active ? 'page' : undefined}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19V9m6 10V5m6 14v-7m4 7H2" /></svg>
        <span>Raporlar ve Analitik</span>
      </Link>
    </div>
  )
}

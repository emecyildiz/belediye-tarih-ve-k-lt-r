'use client'

import { Link, NavGroup, useAuth } from '@payloadcms/ui'
import { usePathname } from 'next/navigation'
import React from 'react'

export default function ReportsNavLink() {
  const pathname = usePathname()
  const { user } = useAuth()
  const active = pathname === '/admin/raporlar'
  if (user?.role !== 'admin') return null
  const label = <>
    {active && <div className="nav__link-indicator" />}
    <span className="nav__link-label">Raporlar ve Analitik</span>
  </>

  return (
    <NavGroup label="Raporlama">
      {active
        ? <div className="nav__link" id="nav-reports">{label}</div>
        : <Link className="nav__link" href="/admin/raporlar" id="nav-reports" prefetch={false}>{label}</Link>}
    </NavGroup>
  )
}

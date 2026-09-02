'use client'

import { Link, NavGroup, useAuth } from '@payloadcms/ui'
import { usePathname } from 'next/navigation'
import React from 'react'

export default function PortalUsersNavLink() {
  const active = usePathname() === '/admin/portal-kullanicilari'
  const { user } = useAuth()
  if (user?.role !== 'admin') return null
  const label = <>
    {active && <div className="nav__link-indicator" />}
    <span className="nav__link-label">Portal Kullanıcıları</span>
  </>

  return (
    <NavGroup label="Kullanıcı Yönetimi">
      {active
        ? <div className="nav__link" id="nav-portal-users">{label}</div>
        : <Link className="nav__link" href="/admin/portal-kullanicilari" id="nav-portal-users" prefetch={false}>{label}</Link>}
    </NavGroup>
  )
}

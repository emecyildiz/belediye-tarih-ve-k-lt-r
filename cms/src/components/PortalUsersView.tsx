import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { AdminViewServerProps } from 'payload'
import React from 'react'

import './PortalUsersView.scss'

type PortalUserRow = {
  id: string
  name: string
  email: string
  role: 'citizen' | 'editor' | 'admin'
  active: boolean
  created_at: Date | string
  two_factor_enabled: boolean
  two_factor_failed_attempts: number | string
  two_factor_locked_until: Date | string | null
  two_factor_locked: boolean
  recovery_count: number | string
  favorite_count: number | string
  custom_route_count: number | string
}

type AuditRow = { event_type: string; success: boolean; created_at: Date | string }
type RouteRow = { id: string; title: string; stop_count: number | string; updated_at: Date | string }

const roleLabel = { citizen: 'Vatandaş', editor: 'İçerik Editörü', admin: 'Yönetici' }
const eventLabel: Record<string, string> = {
  admin_account_status_changed: 'Hesap durumu yönetici tarafından değiştirildi',
  admin_two_factor_reset: 'İki adımlı doğrulama yönetici tarafından sıfırlandı',
  login_failed: 'Başarısız giriş',
  login_success: 'Başarılı giriş',
  two_factor_failed: 'Hatalı doğrulama kodu',
  two_factor_verified: 'İki adımlı doğrulama başarılı',
}
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const first = (value: unknown) => Array.isArray(value) ? String(value[0] || '') : String(value || '')
const formatDate = (value: Date | string) => new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))

export default async function PortalUsersView({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const { permissions, req, visibleEntities } = initPageResult
  if (!req.user || !permissions.canAccessAdmin) redirect('/admin/login')
  if (req.user.role !== 'admin') redirect('/admin')

  const query = await searchParams
  const q = first(query?.q).trim().slice(0, 100)
  const requestedRole = first(query?.role)
  const role = ['citizen', 'editor', 'admin'].includes(requestedRole) ? requestedRole : 'all'
  const requestedStatus = first(query?.status)
  const status = ['active', 'passive', 'locked'].includes(requestedStatus) ? requestedStatus : 'all'
  const selectedId = first(query?.selected)
  const notice = first(query?.notice)
  const pageSize = 20
  const requestedPage = Math.max(1, Number.parseInt(first(query?.page), 10) || 1)

  const conditions: string[] = []
  const values: unknown[] = []
  if (q) {
    values.push(`%${q.toLocaleLowerCase('tr-TR')}%`)
    conditions.push(`(lower(users.name) LIKE $${values.length} OR lower(users.email) LIKE $${values.length})`)
  }
  if (role !== 'all') {
    values.push(role)
    conditions.push(`users.role = $${values.length}`)
  }
  if (status === 'active') conditions.push('users.active = true')
  if (status === 'passive') conditions.push('users.active = false')
  if (status === 'locked') conditions.push('users.two_factor_locked_until > now()')
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  const countResult = await req.payload.db.pool.query<{ count: string }>(`SELECT COUNT(*) AS count FROM tkmbs_portal_users users ${where}`, values)
  const total = Number(countResult.rows[0]?.count || 0)
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(requestedPage, totalPages)
  const listValues = [...values, pageSize, (page - 1) * pageSize]
  const result = await req.payload.db.pool.query<PortalUserRow>(`
    SELECT users.id, users.name, users.email, users.role, users.active, users.created_at, users.two_factor_enabled,
      users.two_factor_failed_attempts, users.two_factor_locked_until,
      (users.two_factor_locked_until IS NOT NULL AND users.two_factor_locked_until > now()) AS two_factor_locked,
      jsonb_array_length(COALESCE(users.two_factor_recovery_codes, '[]'::jsonb)) AS recovery_count,
      (SELECT COUNT(*) FROM tkmbs_user_favorites favorites WHERE favorites.user_id = users.id) AS favorite_count,
      (SELECT COUNT(*) FROM tkmbs_user_routes routes WHERE routes.user_id = users.id) AS custom_route_count
    FROM tkmbs_portal_users users ${where}
    ORDER BY users.role DESC, users.name ASC
    LIMIT $${values.length + 1} OFFSET $${values.length + 2}
  `, listValues)

  const selected = uuidPattern.test(selectedId)
    ? await req.payload.db.pool.query<PortalUserRow>(`
        SELECT users.id, users.name, users.email, users.role, users.active, users.created_at, users.two_factor_enabled,
          users.two_factor_failed_attempts, users.two_factor_locked_until,
          (users.two_factor_locked_until IS NOT NULL AND users.two_factor_locked_until > now()) AS two_factor_locked,
          jsonb_array_length(COALESCE(users.two_factor_recovery_codes, '[]'::jsonb)) AS recovery_count,
          (SELECT COUNT(*) FROM tkmbs_user_favorites favorites WHERE favorites.user_id = users.id) AS favorite_count,
          (SELECT COUNT(*) FROM tkmbs_user_routes routes WHERE routes.user_id = users.id) AS custom_route_count
        FROM tkmbs_portal_users users WHERE users.id = $1
      `, [selectedId])
    : null
  const selectedUser = selected?.rows[0]
  const [audits, routes] = selectedUser
    ? await Promise.all([
        req.payload.db.pool.query<AuditRow>('SELECT event_type, success, created_at FROM tkmbs_security_audit WHERE user_id = $1 ORDER BY created_at DESC LIMIT 8', [selectedUser.id]),
        req.payload.db.pool.query<RouteRow>('SELECT routes.id, routes.title, routes.updated_at, COUNT(stops.monument_id) AS stop_count FROM tkmbs_user_routes routes LEFT JOIN tkmbs_user_route_stops stops ON stops.route_id = routes.id WHERE routes.user_id = $1 GROUP BY routes.id ORDER BY routes.updated_at DESC LIMIT 5', [selectedUser.id]),
      ])
    : [{ rows: [] as AuditRow[] }, { rows: [] as RouteRow[] }]

  const baseParams = new URLSearchParams()
  if (q) baseParams.set('q', q)
  if (role !== 'all') baseParams.set('role', role)
  if (status !== 'all') baseParams.set('status', status)
  if (page > 1) baseParams.set('page', String(page))
  const returnTo = `/admin/portal-kullanicilari${baseParams.size ? `?${baseParams}` : ''}`
  const pageHref = (nextPage: number) => {
    const next = new URLSearchParams(baseParams)
    next.delete('selected')
    next.set('page', String(nextPage))
    return `/admin/portal-kullanicilari?${next}`
  }

  return (
    <DefaultTemplate i18n={req.i18n} locale={initPageResult.locale} params={params} payload={req.payload} permissions={permissions} req={req} searchParams={searchParams} user={req.user} viewType="portalUsers" visibleEntities={{ collections: visibleEntities.collections, globals: visibleEntities.globals }}>
      <Gutter className="tkmbs-portal-users">
        <header><div><span>POSTGRESQL CANLI HESAPLAR</span><h1>Portal Kullanıcıları</h1><p>Vatandaş, editör ve yönetici hesaplarının durumunu, kullanımını ve iki adımlı doğrulamasını yönetin.</p></div><strong>{total} hesap</strong></header>
        {notice === 'reset' && <p className="tkmbs-portal-users__notice">İki adımlı doğrulama sıfırlandı ve açık oturumlar kapatıldı.</p>}
        {notice === 'status' && <p className="tkmbs-portal-users__notice">Hesap durumu güncellendi ve açık oturumlar kapatıldı.</p>}

        <form className="tkmbs-portal-users__filters" method="get" action="/admin/portal-kullanicilari">
          <label><span>Ad veya e-posta</span><input type="search" name="q" defaultValue={q} placeholder="Kullanıcı ara…" /></label>
          <label><span>Rol</span><select name="role" defaultValue={role}><option value="all">Tüm roller</option><option value="citizen">Vatandaş</option><option value="editor">İçerik Editörü</option><option value="admin">Yönetici</option></select></label>
          <label><span>Durum</span><select name="status" defaultValue={status}><option value="all">Tüm durumlar</option><option value="active">Aktif</option><option value="passive">Pasif</option><option value="locked">Geçici kilitli</option></select></label>
          <button type="submit">Listeyi Güncelle</button>
          {(q || role !== 'all' || status !== 'all') && <Link href="/admin/portal-kullanicilari">Temizle</Link>}
        </form>

        {selectedUser && <section className="tkmbs-portal-users__detail">
          <header><div><span>KULLANICI AYRINTISI</span><h2>{selectedUser.name}</h2><p>{selectedUser.email} · {roleLabel[selectedUser.role]}</p></div><Link href={returnTo}>Kapat</Link></header>
          <div className="tkmbs-portal-users__summary">
            <article><span>Hesap</span><strong>{selectedUser.active ? 'Aktif' : 'Pasif'}</strong><small>{formatDate(selectedUser.created_at)} tarihinde oluşturuldu</small></article>
            <article><span>İki adımlı doğrulama</span><strong>{selectedUser.two_factor_enabled ? 'Açık' : 'Kapalı'}</strong><small>{Number(selectedUser.recovery_count)} kurtarma kodu</small></article>
            <article><span>Favoriler</span><strong>{Number(selectedUser.favorite_count)}</strong><small>Kayıtlı içerik</small></article>
            <article><span>Kişisel rotalar</span><strong>{Number(selectedUser.custom_route_count)}</strong><small>Kullanıcının oluşturduğu rota</small></article>
          </div>
          <div className="tkmbs-portal-users__detail-grid">
            <article><h3>Son güvenlik olayları</h3>{audits.rows.map((audit) => <p key={`${audit.event_type}-${audit.created_at}`}><i className={audit.success ? 'is-success' : ''} /><span><strong>{eventLabel[audit.event_type] || audit.event_type}</strong><small>{formatDate(audit.created_at)}</small></span></p>)}{!audits.rows.length && <small>Güvenlik olayı bulunmuyor.</small>}</article>
            <article><h3>Son kişisel rotalar</h3>{routes.rows.map((route) => <p key={route.id}><span><strong>{route.title}</strong><small>{Number(route.stop_count)} durak · {formatDate(route.updated_at)}</small></span></p>)}{!routes.rows.length && <small>Kayıtlı kişisel rota bulunmuyor.</small>}</article>
          </div>
        </section>}

        <div className="tkmbs-portal-users__table-wrap"><table><thead><tr><th>Kullanıcı</th><th>Rol</th><th>Hesap</th><th>İki adımlı doğrulama</th><th>Kullanım</th><th>İşlemler</th></tr></thead><tbody>
          {result.rows.map((user) => {
            const locked = user.two_factor_locked
            const isCurrent = user.email.toLowerCase() === req.user?.email?.toLowerCase()
            const detailParams = new URLSearchParams(baseParams)
            detailParams.set('selected', user.id)
            return <tr key={user.id}>
              <td><strong>{user.name}</strong><small>{user.email}</small></td>
              <td><span className={`role role--${user.role}`}>{roleLabel[user.role]}</span></td>
              <td><span className={user.active ? 'status is-active' : 'status'}><i />{user.active ? 'Aktif' : 'Pasif'}</span><small>{locked ? 'Geçici kilitli' : 'Güvenlik normal'}</small></td>
              <td><strong>{user.two_factor_enabled ? 'Açık' : 'Kapalı'}</strong><small>{Number(user.recovery_count)} kurtarma kodu</small></td>
              <td><strong>{Number(user.favorite_count)} favori</strong><small>{Number(user.custom_route_count)} kişisel rota</small></td>
              <td><div className="actions">
                <Link href={`/admin/portal-kullanicilari?${detailParams}`}>Ayrıntı</Link>
                {user.two_factor_enabled && <form method="post" action="/api/portal-users/action"><input type="hidden" name="userId" value={user.id} /><input type="hidden" name="action" value="reset-two-factor" /><input type="hidden" name="returnTo" value={returnTo} /><button type="submit">2FA Sıfırla</button></form>}
                <form method="post" action="/api/portal-users/action"><input type="hidden" name="userId" value={user.id} /><input type="hidden" name="action" value="toggle-active" /><input type="hidden" name="returnTo" value={returnTo} /><button type="submit" disabled={isCurrent}>{user.active ? 'Pasif Yap' : 'Aktif Yap'}</button></form>
              </div>{isCurrent && <small>Kendi hesabınız</small>}</td>
            </tr>
          })}
          {!result.rows.length && <tr><td colSpan={6} className="tkmbs-portal-users__empty">Filtrelerle eşleşen kullanıcı bulunamadı.</td></tr>}
        </tbody></table></div>
        {totalPages > 1 && <nav className="tkmbs-portal-users__pagination" aria-label="Kullanıcı listesi sayfaları"><span>Sayfa {page} / {totalPages}</span><div>{page > 1 && <Link href={pageHref(page - 1)}>Önceki</Link>}{page < totalPages && <Link href={pageHref(page + 1)}>Sonraki</Link>}</div></nav>}
      </Gutter>
    </DefaultTemplate>
  )
}

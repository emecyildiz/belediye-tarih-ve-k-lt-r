import type { Payload } from 'payload'
import Link from 'next/link'
import React from 'react'

import './ReportsDashboard.scss'
import { analyticsFilterSql, contentTypeLabels, type ReportFilters } from '../reporting/reportFilters'

type TrendRow = { day: string; views: string | number; visitors: string | number }
type TopPageRow = { path: string; views: string | number; visitors: string | number }
type CustomRouteRow = { id: string; title: string; name: string; email: string; stop_count: string | number; updated_at: Date | string }

const number = (value: unknown) => Number(value || 0)
const formatNumber = (value: unknown) => new Intl.NumberFormat('tr-TR').format(number(value))

function pageLabel(path: string, labels: Map<string, string>) {
  if (labels.has(path)) return labels.get(path) as string
  const staticLabels: Record<string, string> = {
    '/': 'Ana Sayfa', '/harita': 'Harita', '/tarihi-eserler': 'Tarihi Eserler',
    '/kultur-rotalari': 'Kültürel Rotalar', '/etkinlikler': 'Etkinlikler',
    '/hakkinda': 'Hakkında', '/profil': 'Profil', '/bildirimler': 'Bildirimler',
  }
  return staticLabels[path] || path
}

export default async function ReportsDashboard({ payload, filters }: { payload: Payload; filters: ReportFilters }) {
  const [monumentCount, routeCount, eventCount, managerCount, monuments, routes, events] = await Promise.all([
    payload.count({ collection: 'monuments', overrideAccess: true }),
    payload.count({ collection: 'cultural-routes', overrideAccess: true }),
    payload.count({ collection: 'events', overrideAccess: true }),
    payload.count({ collection: 'users', overrideAccess: true }),
    payload.find({ collection: 'monuments', limit: 500, depth: 0, overrideAccess: true, select: { name: true, slug: true } }),
    payload.find({ collection: 'cultural-routes', limit: 500, depth: 0, overrideAccess: true, select: { title: true, slug: true, monuments: true } }),
    payload.find({ collection: 'events', limit: 500, depth: 0, overrideAccess: true, select: { title: true, slug: true } }),
  ])

  const labels = new Map<string, string>()
  monuments.docs.forEach((item) => labels.set(`/tarihi-eserler/${item.slug}`, item.name))
  routes.docs.forEach((item) => labels.set(`/kultur-rotalari/${item.slug}`, item.title))
  events.docs.forEach((item) => labels.set(`/etkinlikler/${item.slug}`, item.title))

  let analyticsReady = true
  let summary = { views: 0, visitors: 0, sessions: 0 }
  let trend: TrendRow[] = []
  let topPages: TopPageRow[] = []
  let portalUsers = 0
  let activeUsers = 0
  let favorites = 0
  let securityEvents = 0
  let failedSecurityEvents = 0
  let lockedUsers = 0
  let customRoutes = 0
  let usersWithRoutes = 0
  let routeStops = 0
  let recentCustomRoutes: CustomRouteRow[] = []

  try {
    const typeFilter = analyticsFilterSql(filters.contentType)
    const queryValues = [filters.from, filters.to, ...typeFilter.values]
    const [summaryResult, trendResult, topResult, userResult, securityResult, customRouteResult] = await Promise.all([
      payload.db.pool.query(`
        SELECT
          COUNT(*) AS views,
          COUNT(DISTINCT visitor_id) AS visitors,
          COUNT(DISTINCT session_id) AS sessions
        FROM tkmbs_analytics_events
        WHERE occurred_at >= $1::date AND occurred_at < ($2::date + interval '1 day')${typeFilter.clause}
      `, queryValues),
      payload.db.pool.query(`
        WITH days AS (
          SELECT generate_series($1::date, $2::date, interval '1 day')::date AS day
        ), totals AS (
          SELECT (occurred_at AT TIME ZONE 'Europe/Istanbul')::date AS day,
            COUNT(*) AS views, COUNT(DISTINCT visitor_id) AS visitors
          FROM tkmbs_analytics_events
          WHERE occurred_at >= $1::date AND occurred_at < ($2::date + interval '1 day')${typeFilter.clause}
          GROUP BY 1
        )
        SELECT days.day::text, COALESCE(totals.views, 0) AS views, COALESCE(totals.visitors, 0) AS visitors
        FROM days LEFT JOIN totals USING (day) ORDER BY days.day
      `, queryValues),
      payload.db.pool.query(`
        SELECT path, COUNT(*) AS views, COUNT(DISTINCT visitor_id) AS visitors
        FROM tkmbs_analytics_events
        WHERE occurred_at >= $1::date AND occurred_at < ($2::date + interval '1 day')${typeFilter.clause}
        GROUP BY path ORDER BY views DESC, path ASC LIMIT 7
      `, queryValues),
      payload.db.pool.query(`
        SELECT
          (SELECT COUNT(*) FROM tkmbs_portal_users) AS users,
          (SELECT COUNT(*) FROM tkmbs_portal_users WHERE active = true) AS active_users,
          (SELECT COUNT(*) FROM tkmbs_user_favorites) AS favorites,
          (SELECT COUNT(*) FROM tkmbs_portal_users WHERE two_factor_locked_until > now()) AS locked_users,
          (SELECT COUNT(*) FROM tkmbs_user_routes) AS custom_routes,
          (SELECT COUNT(DISTINCT user_id) FROM tkmbs_user_routes) AS users_with_routes,
          (SELECT COUNT(*) FROM tkmbs_user_route_stops) AS route_stops
      `),
      payload.db.pool.query(`
        SELECT COUNT(*) AS events, COUNT(*) FILTER (WHERE success = false) AS failed
        FROM tkmbs_security_audit
        WHERE created_at >= $1::date AND created_at < ($2::date + interval '1 day')
      `, [filters.from, filters.to]),
      payload.db.pool.query<CustomRouteRow>(`
        SELECT routes.id, routes.title, users.name, users.email,
          COUNT(stops.monument_id) AS stop_count, routes.updated_at
        FROM tkmbs_user_routes routes
        JOIN tkmbs_portal_users users ON users.id = routes.user_id
        LEFT JOIN tkmbs_user_route_stops stops ON stops.route_id = routes.id
        GROUP BY routes.id, routes.title, users.name, users.email, routes.updated_at
        ORDER BY routes.updated_at DESC LIMIT 5
      `),
    ])
    const row = summaryResult.rows[0] || {}
    summary = {
      views: number(row.views), visitors: number(row.visitors), sessions: number(row.sessions),
    }
    trend = trendResult.rows
    topPages = topResult.rows
    portalUsers = number(userResult.rows[0]?.users)
    activeUsers = number(userResult.rows[0]?.active_users)
    favorites = number(userResult.rows[0]?.favorites)
    lockedUsers = number(userResult.rows[0]?.locked_users)
    customRoutes = number(userResult.rows[0]?.custom_routes)
    usersWithRoutes = number(userResult.rows[0]?.users_with_routes)
    routeStops = number(userResult.rows[0]?.route_stops)
    recentCustomRoutes = customRouteResult.rows
    securityEvents = number(securityResult.rows[0]?.events)
    failedSecurityEvents = number(securityResult.rows[0]?.failed)
  } catch {
    analyticsReady = false
  }

  const maxViews = Math.max(1, ...trend.map((item) => number(item.views)))
  const invalidRoutes = routes.docs.filter((route) => !Array.isArray(route.monuments) || route.monuments.length === 0).length
  const metrics = [
    { label: 'Sayfa Görüntüleme', value: summary.views, detail: contentTypeLabels[filters.contentType] },
    { label: 'Eşsiz Ziyaretçi', value: summary.visitors, detail: 'Seçili tarih aralığı' },
    { label: 'Oturum', value: summary.sessions, detail: 'Seçili tarih aralığı' },
    { label: 'Portal Kullanıcısı', value: portalUsers, detail: `${formatNumber(activeUsers)} aktif hesap` },
    { label: 'Kişisel Rota', value: customRoutes, detail: `${formatNumber(usersWithRoutes)} kullanıcı rota oluşturdu` },
    { label: 'Yayındaki İçerik', value: monumentCount.totalDocs + routeCount.totalDocs + eventCount.totalDocs, detail: `${managerCount.totalDocs} yönetim hesabı` },
  ]

  return (
    <section className="tkmbs-report">
      <header className="tkmbs-report__header">
        <div><span>POSTGRESQL CANLI VERİ</span><h1>Raporlama ve Analitik</h1><p>Portal kullanımı, içerik performansı ve veri bütünlüğü tek kaynaktan izlenir.</p></div>
        <div className={`tkmbs-report__status ${analyticsReady ? 'is-ready' : 'is-warning'}`}><i />{analyticsReady ? 'Rapor veritabanı bağlı' : 'Analitik migration bekliyor'}</div>
      </header>

      <form className="tkmbs-report__filters" method="get" action="/admin/raporlar">
        <label><span>Başlangıç</span><input type="date" name="from" defaultValue={filters.from} /></label>
        <label><span>Bitiş</span><input type="date" name="to" defaultValue={filters.to} /></label>
        <label><span>İçerik türü</span><select name="contentType" defaultValue={filters.contentType}>{Object.entries(contentTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <button type="submit">Raporu Güncelle</button>
        <Link href={`/api/reports/export?report=analytics&from=${filters.from}&to=${filters.to}&contentType=${filters.contentType}`}>Analitik CSV</Link>
        <Link href={`/api/reports/export?report=analytics&format=pdf&from=${filters.from}&to=${filters.to}&contentType=${filters.contentType}`}>Analitik PDF</Link>
      </form>

      <div className="tkmbs-report__metrics">
        {metrics.map((metric) => <article key={metric.label}><span>{metric.label}</span><strong>{formatNumber(metric.value)}</strong><small>{metric.detail}</small></article>)}
      </div>

      <div className="tkmbs-report__grid">
        <article className="tkmbs-report__panel tkmbs-report__trend">
          <header><div><span>{filters.from} — {filters.to}</span><h2>Ziyaretçi eğilimi</h2></div><small>Mavi: görüntüleme · Altın: ziyaretçi</small></header>
          <div className="tkmbs-report__chart">
            {trend.map((item) => {
              const date = new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'short' }).format(new Date(`${item.day}T12:00:00`))
              return <div className="tkmbs-report__bar" key={item.day} title={`${date}: ${item.views} görüntüleme`}><div><i style={{ height: `${Math.max(3, number(item.views) / maxViews * 100)}%` }} /><b style={{ height: `${Math.max(2, number(item.visitors) / maxViews * 100)}%` }} /></div><span>{date}</span></div>
            })}
            {!trend.length && <p className="tkmbs-report__empty">Migration uygulandıktan sonra ziyaretler burada günlük olarak görünecek.</p>}
          </div>
        </article>

        <article className="tkmbs-report__panel tkmbs-report__top">
          <header><div><span>SEÇİLİ DÖNEM</span><h2>En çok görüntülenen sayfalar</h2></div></header>
          <ol>{topPages.map((item, index) => <li key={item.path}><i>{index + 1}</i><div><strong>{pageLabel(item.path, labels)}</strong><small>{item.path}</small></div><span>{formatNumber(item.views)}<small>görüntüleme</small></span></li>)}</ol>
          {!topPages.length && <p className="tkmbs-report__empty">Portal ziyaretleri başladığında içerik sıralaması otomatik oluşacak.</p>}
        </article>
      </div>

      <div className="tkmbs-report__footer-grid">
        <article className="tkmbs-report__panel"><header><div><span>İÇERİK ENVANTERİ</span><h2>Veri dağılımı</h2></div></header><div className="tkmbs-report__inventory"><Link href="/admin/collections/monuments"><strong>{monumentCount.totalDocs}</strong><span>Tarihi eser</span></Link><Link href="/admin/collections/cultural-routes"><strong>{routeCount.totalDocs}</strong><span>Kültürel rota</span></Link><Link href="/admin/collections/events"><strong>{eventCount.totalDocs}</strong><span>Etkinlik</span></Link></div></article>
        <article className="tkmbs-report__panel"><header><div><span>VERİ KALİTESİ</span><h2>Bütünlük kontrolü</h2></div></header><div className="tkmbs-report__integrity"><p><i className={invalidRoutes ? 'warning' : ''} />Rota-durak ilişkileri <strong>{invalidRoutes ? `${invalidRoutes} sorun` : 'Tutarlı'}</strong></p><p><i className={analyticsReady ? '' : 'warning'} />Analitik veri tablosu <strong>{analyticsReady ? 'Hazır' : 'Migration gerekli'}</strong></p><p><i />Rapor kaynağı <strong>PostgreSQL</strong></p></div></article>
      </div>
      <div className="tkmbs-report__footer-grid">
        <article className="tkmbs-report__panel"><header><div><span>KULLANICI RAPORU</span><h2>Hesap ve kişisel içerik özeti</h2></div><div className="tkmbs-report__exports"><Link href="/api/reports/export?report=users">CSV</Link><Link href="/api/reports/export?report=users&format=pdf">PDF</Link></div></header><div className="tkmbs-report__integrity"><p><i />Aktif portal hesabı <strong>{formatNumber(activeUsers)} / {formatNumber(portalUsers)}</strong></p><p><i className={lockedUsers ? 'warning' : ''} />Geçici kilitli hesap <strong>{formatNumber(lockedUsers)}</strong></p><p><i />Toplam favori kaydı <strong>{formatNumber(favorites)}</strong></p><p><i />Kişisel rota / durak <strong>{formatNumber(customRoutes)} / {formatNumber(routeStops)}</strong></p></div></article>
        <article className="tkmbs-report__panel"><header><div><span>GÜVENLİK RAPORU</span><h2>Kimlik doğrulama olayları</h2></div><div className="tkmbs-report__exports"><Link href={`/api/reports/export?report=security&from=${filters.from}&to=${filters.to}`}>CSV</Link><Link href={`/api/reports/export?report=security&format=pdf&from=${filters.from}&to=${filters.to}`}>PDF</Link></div></header><div className="tkmbs-report__integrity"><p><i />Toplam güvenlik olayı <strong>{formatNumber(securityEvents)}</strong></p><p><i className={failedSecurityEvents ? 'warning' : ''} />Başarısız işlem <strong>{formatNumber(failedSecurityEvents)}</strong></p><p><i />Kayıt kaynağı <strong>Güvenlik denetim tablosu</strong></p></div></article>
      </div>
      <div className="tkmbs-report__footer-grid tkmbs-report__footer-grid--single">
        <article className="tkmbs-report__panel tkmbs-report__top"><header><div><span>SON GÜNCELLENENLER</span><h2>Kullanıcıların kişisel rotaları</h2></div><Link href="/admin/portal-kullanicilari">Kullanıcıları yönet</Link></header><ol>{recentCustomRoutes.map((route, index) => <li key={route.id}><i>{index + 1}</i><div><strong>{route.title}</strong><small>{route.name} · {route.email}</small></div><span>{formatNumber(route.stop_count)}<small>durak</small></span></li>)}</ol>{!recentCustomRoutes.length && <p className="tkmbs-report__empty">Kullanıcılar rota kaydettiğinde son etkinlikler burada görünecek.</p>}</article>
      </div>
    </section>
  )
}

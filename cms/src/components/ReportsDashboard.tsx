import type { ServerProps } from 'payload'
import Link from 'next/link'
import React from 'react'

import './ReportsDashboard.scss'

type TrendRow = { day: string; views: string | number; visitors: string | number }
type TopPageRow = { path: string; views: string | number; visitors: string | number }

const number = (value: unknown) => Number(value || 0)
const formatNumber = (value: unknown) => new Intl.NumberFormat('tr-TR').format(number(value))

function change(current: number, previous: number) {
  if (!previous) return current ? 100 : 0
  return Math.round(((current - previous) / previous) * 1000) / 10
}

function pageLabel(path: string, labels: Map<string, string>) {
  if (labels.has(path)) return labels.get(path) as string
  const staticLabels: Record<string, string> = {
    '/': 'Ana Sayfa', '/harita': 'Harita', '/tarihi-eserler': 'Tarihi Eserler',
    '/kultur-rotalari': 'Kültürel Rotalar', '/etkinlikler': 'Etkinlikler',
    '/hakkinda': 'Hakkında', '/profil': 'Profil', '/bildirimler': 'Bildirimler',
  }
  return staticLabels[path] || path
}

export default async function ReportsDashboard({ payload }: ServerProps) {
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
  let summary = { views: 0, visitors: 0, sessions: 0, previousViews: 0, previousVisitors: 0 }
  let trend: TrendRow[] = []
  let topPages: TopPageRow[] = []
  let portalUsers = 0
  let activeUsers = 0
  let favorites = 0

  try {
    const [summaryResult, trendResult, topResult, userResult] = await Promise.all([
      payload.db.pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE occurred_at >= now() - interval '30 days') AS views,
          COUNT(DISTINCT visitor_id) FILTER (WHERE occurred_at >= now() - interval '30 days') AS visitors,
          COUNT(DISTINCT session_id) FILTER (WHERE occurred_at >= now() - interval '30 days') AS sessions,
          COUNT(*) FILTER (WHERE occurred_at >= now() - interval '60 days' AND occurred_at < now() - interval '30 days') AS previous_views,
          COUNT(DISTINCT visitor_id) FILTER (WHERE occurred_at >= now() - interval '60 days' AND occurred_at < now() - interval '30 days') AS previous_visitors
        FROM tkmbs_analytics_events
      `),
      payload.db.pool.query(`
        WITH days AS (
          SELECT generate_series(current_date - interval '13 days', current_date, interval '1 day')::date AS day
        ), totals AS (
          SELECT (occurred_at AT TIME ZONE 'Europe/Istanbul')::date AS day,
            COUNT(*) AS views, COUNT(DISTINCT visitor_id) AS visitors
          FROM tkmbs_analytics_events
          WHERE occurred_at >= current_date - interval '13 days'
          GROUP BY 1
        )
        SELECT days.day::text, COALESCE(totals.views, 0) AS views, COALESCE(totals.visitors, 0) AS visitors
        FROM days LEFT JOIN totals USING (day) ORDER BY days.day
      `),
      payload.db.pool.query(`
        SELECT path, COUNT(*) AS views, COUNT(DISTINCT visitor_id) AS visitors
        FROM tkmbs_analytics_events
        WHERE occurred_at >= now() - interval '30 days'
        GROUP BY path ORDER BY views DESC, path ASC LIMIT 7
      `),
      payload.db.pool.query(`
        SELECT
          (SELECT COUNT(*) FROM tkmbs_portal_users) AS users,
          (SELECT COUNT(*) FROM tkmbs_portal_users WHERE active = true) AS active_users,
          (SELECT COUNT(*) FROM tkmbs_user_favorites) AS favorites
      `),
    ])
    const row = summaryResult.rows[0] || {}
    summary = {
      views: number(row.views), visitors: number(row.visitors), sessions: number(row.sessions),
      previousViews: number(row.previous_views), previousVisitors: number(row.previous_visitors),
    }
    trend = trendResult.rows
    topPages = topResult.rows
    portalUsers = number(userResult.rows[0]?.users)
    activeUsers = number(userResult.rows[0]?.active_users)
    favorites = number(userResult.rows[0]?.favorites)
  } catch {
    analyticsReady = false
  }

  const maxViews = Math.max(1, ...trend.map((item) => number(item.views)))
  const invalidRoutes = routes.docs.filter((route) => !Array.isArray(route.monuments) || route.monuments.length === 0).length
  const metrics = [
    { label: 'Sayfa Görüntüleme', value: summary.views, detail: `Önceki döneme göre %${change(summary.views, summary.previousViews)}` },
    { label: 'Eşsiz Ziyaretçi', value: summary.visitors, detail: `Önceki döneme göre %${change(summary.visitors, summary.previousVisitors)}` },
    { label: 'Oturum', value: summary.sessions, detail: 'Son 30 gün' },
    { label: 'Portal Kullanıcısı', value: portalUsers, detail: `${formatNumber(activeUsers)} aktif hesap` },
    { label: 'Toplam Favori', value: favorites, detail: 'Eser, rota ve etkinlik' },
    { label: 'Yayındaki İçerik', value: monumentCount.totalDocs + routeCount.totalDocs + eventCount.totalDocs, detail: `${managerCount.totalDocs} yönetim hesabı` },
  ]

  return (
    <section className="tkmbs-report">
      <header className="tkmbs-report__header">
        <div><span>POSTGRESQL CANLI VERİ</span><h1>Raporlama ve Analitik</h1><p>Portal kullanımı, içerik performansı ve veri bütünlüğü tek kaynaktan izlenir.</p></div>
        <div className={`tkmbs-report__status ${analyticsReady ? 'is-ready' : 'is-warning'}`}><i />{analyticsReady ? 'Rapor veritabanı bağlı' : 'Analitik migration bekliyor'}</div>
      </header>

      <div className="tkmbs-report__metrics">
        {metrics.map((metric) => <article key={metric.label}><span>{metric.label}</span><strong>{formatNumber(metric.value)}</strong><small>{metric.detail}</small></article>)}
      </div>

      <div className="tkmbs-report__grid">
        <article className="tkmbs-report__panel tkmbs-report__trend">
          <header><div><span>SON 14 GÜN</span><h2>Ziyaretçi eğilimi</h2></div><small>Mavi: görüntüleme · Altın: ziyaretçi</small></header>
          <div className="tkmbs-report__chart">
            {trend.map((item) => {
              const date = new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'short' }).format(new Date(`${item.day}T12:00:00`))
              return <div className="tkmbs-report__bar" key={item.day} title={`${date}: ${item.views} görüntüleme`}><div><i style={{ height: `${Math.max(3, number(item.views) / maxViews * 100)}%` }} /><b style={{ height: `${Math.max(2, number(item.visitors) / maxViews * 100)}%` }} /></div><span>{date}</span></div>
            })}
            {!trend.length && <p className="tkmbs-report__empty">Migration uygulandıktan sonra ziyaretler burada günlük olarak görünecek.</p>}
          </div>
        </article>

        <article className="tkmbs-report__panel tkmbs-report__top">
          <header><div><span>SON 30 GÜN</span><h2>En çok görüntülenen sayfalar</h2></div></header>
          <ol>{topPages.map((item, index) => <li key={item.path}><i>{index + 1}</i><div><strong>{pageLabel(item.path, labels)}</strong><small>{item.path}</small></div><span>{formatNumber(item.views)}<small>görüntüleme</small></span></li>)}</ol>
          {!topPages.length && <p className="tkmbs-report__empty">Portal ziyaretleri başladığında içerik sıralaması otomatik oluşacak.</p>}
        </article>
      </div>

      <div className="tkmbs-report__footer-grid">
        <article className="tkmbs-report__panel"><header><div><span>İÇERİK ENVANTERİ</span><h2>Veri dağılımı</h2></div></header><div className="tkmbs-report__inventory"><Link href="/admin/collections/monuments"><strong>{monumentCount.totalDocs}</strong><span>Tarihi eser</span></Link><Link href="/admin/collections/cultural-routes"><strong>{routeCount.totalDocs}</strong><span>Kültürel rota</span></Link><Link href="/admin/collections/events"><strong>{eventCount.totalDocs}</strong><span>Etkinlik</span></Link></div></article>
        <article className="tkmbs-report__panel"><header><div><span>VERİ KALİTESİ</span><h2>Bütünlük kontrolü</h2></div></header><div className="tkmbs-report__integrity"><p><i className={invalidRoutes ? 'warning' : ''} />Rota-durak ilişkileri <strong>{invalidRoutes ? `${invalidRoutes} sorun` : 'Tutarlı'}</strong></p><p><i className={analyticsReady ? '' : 'warning'} />Analitik veri tablosu <strong>{analyticsReady ? 'Hazır' : 'Migration gerekli'}</strong></p><p><i />Rapor kaynağı <strong>PostgreSQL</strong></p></div></article>
      </div>
    </section>
  )
}

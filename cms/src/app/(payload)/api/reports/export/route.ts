import config from '@payload-config'
import path from 'node:path'
import PDFDocument from 'pdfkit'
import { getPayload } from 'payload'

import { analyticsFilterSql, parseReportFilters } from '../../../../../reporting/reportFilters'

type CsvValue = string | number | boolean | Date | null | undefined
type ReportData = { headers: string[]; rows: CsvValue[][] }

const reportNames = {
  analytics: 'analitik',
  users: 'portal-kullanicilari',
  security: 'guvenlik',
} as const

function csvCell(value: CsvValue) {
  const text = value instanceof Date ? value.toISOString() : String(value ?? '')
  return `"${text.replaceAll('"', '""')}"`
}

function csv(headers: string[], rows: CsvValue[][]) {
  return `\uFEFF${[headers, ...rows].map((row) => row.map(csvCell).join(';')).join('\r\n')}`
}

function displayValue(value: CsvValue) {
  if (value instanceof Date) return new Intl.DateTimeFormat('tr-TR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Istanbul' }).format(value)
  if (typeof value === 'boolean') return value ? 'Evet' : 'Hayır'
  return String(value ?? '')
}

async function pdf(title: string, filters: { from: string; to: string }, data: ReportData) {
  const document = new PDFDocument({ size: 'A4', layout: data.headers.length > 5 ? 'landscape' : 'portrait', margin: 34, info: { Title: title, Author: 'Hatay Büyükşehir Belediyesi TKMBS' } })
  const regularFont = path.join(process.cwd(), 'node_modules', '@fontsource', 'noto-sans', 'files', 'noto-sans-latin-ext-400-normal.woff')
  const boldFont = path.join(process.cwd(), 'node_modules', '@fontsource', 'noto-sans', 'files', 'noto-sans-latin-ext-700-normal.woff')
  document.registerFont('NotoSans', regularFont).registerFont('NotoSansBold', boldFont)

  const chunks: Buffer[] = []
  document.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
  const completed = new Promise<Buffer>((resolve, reject) => {
    document.on('end', () => resolve(Buffer.concat(chunks)))
    document.on('error', reject)
  })

  document.font('NotoSansBold').fontSize(18).fillColor('#082f5f').text(title)
  document.moveDown(0.25).font('NotoSans').fontSize(9).fillColor('#526b85').text(`Rapor dönemi: ${filters.from} — ${filters.to} · Oluşturulma: ${new Intl.DateTimeFormat('tr-TR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Istanbul' }).format(new Date())}`)
  document.moveDown(0.8)

  const left = document.page.margins.left
  const usableWidth = document.page.width - left - document.page.margins.right
  const columnWidth = usableWidth / data.headers.length
  const drawHeader = () => {
    const y = document.y
    document.rect(left, y, usableWidth, 22).fill('#0b4b85')
    data.headers.forEach((header, index) => document.font('NotoSansBold').fontSize(7.5).fillColor('#ffffff').text(header, left + index * columnWidth + 4, y + 6, { width: columnWidth - 8, ellipsis: true, lineBreak: false }))
    document.y = y + 26
  }
  drawHeader()

  data.rows.forEach((row, rowIndex) => {
    if (document.y + 22 > document.page.height - document.page.margins.bottom) {
      document.addPage()
      drawHeader()
    }
    const y = document.y
    if (rowIndex % 2 === 1) document.rect(left, y - 2, usableWidth, 20).fill('#f2f6fa')
    row.forEach((value, index) => document.font('NotoSans').fontSize(7.2).fillColor('#183b5d').text(displayValue(value), left + index * columnWidth + 4, y + 3, { width: columnWidth - 8, ellipsis: true, lineBreak: false }))
    document.y = y + 20
  })
  if (!data.rows.length) document.font('NotoSans').fontSize(10).fillColor('#526b85').text('Seçilen ölçütlerde kayıt bulunamadı.')
  document.end()
  return completed
}

export async function GET(request: Request) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })
  if (!user || user.collection !== 'users' || user.role !== 'admin') {
    return Response.json({ error: 'Bu raporu indirme yetkiniz yok.' }, { status: 403 })
  }

  const url = new URL(request.url)
  const report = url.searchParams.get('report') as keyof typeof reportNames
  if (!reportNames[report]) return Response.json({ error: 'Rapor türü geçersiz.' }, { status: 400 })

  const filters = parseReportFilters(Object.fromEntries(url.searchParams.entries()))
  const format = url.searchParams.get('format') === 'pdf' ? 'pdf' : 'csv'
  let data: ReportData

  if (report === 'analytics') {
    const typeFilter = analyticsFilterSql(filters.contentType)
    const result = await payload.db.pool.query(`
      SELECT (occurred_at AT TIME ZONE 'Europe/Istanbul')::date AS day,
        COALESCE(content_type, 'page') AS content_type, path,
        COUNT(*) AS views, COUNT(DISTINCT visitor_id) AS visitors,
        COUNT(DISTINCT session_id) AS sessions
      FROM tkmbs_analytics_events
      WHERE occurred_at >= $1::date AND occurred_at < ($2::date + interval '1 day')${typeFilter.clause}
      GROUP BY 1, 2, 3 ORDER BY 1 DESC, views DESC, path ASC LIMIT 10000
    `, [filters.from, filters.to, ...typeFilter.values])
    data = { headers: ['Tarih', 'İçerik türü', 'Sayfa', 'Görüntüleme', 'Eşsiz ziyaretçi', 'Oturum'], rows: result.rows.map((row) => [row.day, row.content_type, row.path, row.views, row.visitors, row.sessions]) }
  } else if (report === 'users') {
    const result = await payload.db.pool.query(`
      SELECT users.name, users.email, users.role, users.active, users.two_factor_enabled,
        (users.two_factor_locked_until > now()) AS temporarily_locked,
        COUNT(DISTINCT favorites.item_type || ':' || favorites.item_id) AS favorite_count,
        COUNT(DISTINCT routes.id) AS custom_route_count,
        users.created_at
      FROM tkmbs_portal_users users
      LEFT JOIN tkmbs_user_favorites favorites ON favorites.user_id = users.id
      LEFT JOIN tkmbs_user_routes routes ON routes.user_id = users.id
      GROUP BY users.id, users.name, users.email, users.role, users.active,
        users.two_factor_enabled, users.two_factor_locked_until, users.created_at
      ORDER BY users.role DESC, users.name ASC LIMIT 10000
    `)
    data = { headers: ['Ad Soyad', 'E-posta', 'Rol', 'Aktif', '2FA', 'Geçici kilit', 'Favori', 'Kişisel rota', 'Kayıt tarihi'], rows: result.rows.map((row) => [row.name, row.email, row.role, row.active, row.two_factor_enabled, row.temporarily_locked, row.favorite_count, row.custom_route_count, row.created_at]) }
  } else {
    const result = await payload.db.pool.query(`
      SELECT created_at, email, event_type, success
      FROM tkmbs_security_audit
      WHERE created_at >= $1::date AND created_at < ($2::date + interval '1 day')
      ORDER BY created_at DESC LIMIT 10000
    `, [filters.from, filters.to])
    data = { headers: ['Tarih ve saat', 'Hesap', 'Olay türü', 'Başarılı'], rows: result.rows.map((row) => [row.created_at, row.email, row.event_type, row.success]) }
  }

  const extension = format === 'pdf' ? 'pdf' : 'csv'
  const filename = `tkmbs-${reportNames[report]}-${filters.from}-${filters.to}.${extension}`
  const output = format === 'pdf'
    ? await pdf(`TKMBS ${reportNames[report].replaceAll('-', ' ')} raporu`, filters, data)
    : csv(data.headers, data.rows)
  return new Response(output, {
    headers: {
      'Cache-Control': 'no-store',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Type': format === 'pdf' ? 'application/pdf' : 'text/csv; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

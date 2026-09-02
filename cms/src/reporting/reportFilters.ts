export const REPORT_CONTENT_TYPES = ['all', 'monument', 'route', 'event', 'page'] as const

export type ReportContentType = (typeof REPORT_CONTENT_TYPES)[number]

export type ReportFilters = {
  from: string
  to: string
  contentType: ReportContentType
}

const datePattern = /^\d{4}-\d{2}-\d{2}$/

function localDate(value: Date) {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Istanbul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(value)
}

function validDate(value: unknown) {
  const text = String(value || '')
  if (!datePattern.test(text)) return null
  const parsed = new Date(`${text}T12:00:00+03:00`)
  return Number.isNaN(parsed.getTime()) ? null : text
}

function firstValue(value: unknown) {
  return Array.isArray(value) ? value[0] : value
}

export function parseReportFilters(input: Record<string, unknown> = {}): ReportFilters {
  const today = localDate(new Date())
  const defaultFromDate = new Date(`${today}T12:00:00+03:00`)
  defaultFromDate.setDate(defaultFromDate.getDate() - 29)

  let from = validDate(firstValue(input.from)) || localDate(defaultFromDate)
  let to = validDate(firstValue(input.to)) || today
  if (from > to) [from, to] = [to, from]

  const earliest = new Date(`${to}T12:00:00+03:00`)
  earliest.setDate(earliest.getDate() - 365)
  const earliestText = localDate(earliest)
  if (from < earliestText) from = earliestText

  const requestedType = String(firstValue(input.contentType) || 'all')
  const contentType = REPORT_CONTENT_TYPES.includes(requestedType as ReportContentType)
    ? requestedType as ReportContentType
    : 'all'

  return { from, to, contentType }
}

export function analyticsFilterSql(contentType: ReportContentType, parameterIndex = 3) {
  if (contentType === 'all') return { clause: '', values: [] as string[] }
  if (contentType === 'page') return { clause: ' AND content_type IS NULL', values: [] as string[] }
  return { clause: ` AND content_type = $${parameterIndex}`, values: [contentType] }
}

export const contentTypeLabels: Record<ReportContentType, string> = {
  all: 'Tüm içerikler',
  monument: 'Tarihi eserler',
  route: 'Kültürel rotalar',
  event: 'Etkinlikler',
  page: 'Genel sayfalar',
}

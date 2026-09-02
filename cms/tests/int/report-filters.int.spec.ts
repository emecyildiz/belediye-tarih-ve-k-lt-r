import { analyticsFilterSql, parseReportFilters } from '@/reporting/reportFilters'
import { describe, expect, it } from 'vitest'

describe('rapor filtreleri', () => {
  it('ters girilen tarihleri sıralar ve içerik türünü korur', () => {
    expect(parseReportFilters({ from: '2026-08-28', to: '2026-08-01', contentType: 'route' })).toEqual({
      from: '2026-08-01',
      to: '2026-08-28',
      contentType: 'route',
    })
  })

  it('geçersiz içerik türünü tüm içeriklere dönüştürür', () => {
    expect(parseReportFilters({ from: '2026-08-01', to: '2026-08-28', contentType: 'unknown' }).contentType).toBe('all')
  })

  it('SQL filtresinde yalnızca izin verilen sabit alanları üretir', () => {
    expect(analyticsFilterSql('page')).toEqual({ clause: ' AND content_type IS NULL', values: [] })
    expect(analyticsFilterSql('event')).toEqual({ clause: ' AND content_type = $3', values: ['event'] })
  })
})

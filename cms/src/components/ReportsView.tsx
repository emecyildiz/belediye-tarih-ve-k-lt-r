import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import { redirect } from 'next/navigation'
import type { AdminViewServerProps } from 'payload'
import React from 'react'

import ReportsDashboard from './ReportsDashboard'
import { parseReportFilters } from '../reporting/reportFilters'

export default async function ReportsView({
  initPageResult,
  params,
  searchParams,
}: AdminViewServerProps) {
  const { permissions, req, visibleEntities } = initPageResult

  if (!req.user || !permissions.canAccessAdmin) {
    redirect('/admin/login')
  }
  if (req.user.role !== 'admin') redirect('/admin')

  const resolvedSearchParams = (await searchParams) || {}
  const filters = parseReportFilters(resolvedSearchParams as Record<string, unknown>)

  return (
    <DefaultTemplate
      i18n={req.i18n}
      locale={initPageResult.locale}
      params={params}
      payload={req.payload}
      permissions={permissions}
      req={req}
      searchParams={searchParams}
      user={req.user}
      viewType="reports"
      visibleEntities={{
        collections: visibleEntities.collections,
        globals: visibleEntities.globals,
      }}
    >
      <Gutter className="tkmbs-report-view">
        <ReportsDashboard payload={req.payload} filters={filters} />
      </Gutter>
    </DefaultTemplate>
  )
}

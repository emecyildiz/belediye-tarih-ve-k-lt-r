import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import type { AdminViewServerProps } from 'payload'
import React from 'react'

import ReportsDashboard from './ReportsDashboard'

export default async function ReportsView({
  i18n,
  initPageResult,
  locale,
  params,
  payload,
  permissions,
  searchParams,
  user,
  viewActions,
  viewType,
}: AdminViewServerProps) {
  return (
    <DefaultTemplate
      i18n={i18n}
      locale={locale}
      params={params}
      payload={payload}
      permissions={permissions}
      req={initPageResult.req}
      searchParams={searchParams}
      user={user}
      viewActions={viewActions}
      viewType={viewType}
      visibleEntities={{
        collections: initPageResult.visibleEntities.collections,
        globals: initPageResult.visibleEntities.globals,
      }}
    >
      <Gutter className="tkmbs-report-view">
        <ReportsDashboard payload={payload} />
      </Gutter>
    </DefaultTemplate>
  )
}

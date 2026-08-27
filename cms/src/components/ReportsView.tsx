import { Gutter } from '@payloadcms/ui'
import type { AdminViewServerProps } from 'payload'
import React from 'react'

import ReportsDashboard from './ReportsDashboard'

export default async function ReportsView({ payload }: AdminViewServerProps) {
  return (
    <Gutter className="tkmbs-report-view">
      <ReportsDashboard payload={payload} />
    </Gutter>
  )
}

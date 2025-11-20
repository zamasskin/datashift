import { Head } from '@inertiajs/react'
import { DataTable } from '~/pages/sources/data-table'
import { RootLayout } from '~/components/root-layout'

import React from 'react'
import { useI18n } from '~/hooks/useI18nLocal'

const SourcesPage = () => {
  const { t } = useI18n()
  return (
    <>
      <Head title={t('sources.title', 'Подключения')} />
      <DataTable />
    </>
  )
}

function SourcesLayout({ children }: { children: React.ReactNode }) {
  const { t } = useI18n()
  return <RootLayout title={t('sources.title', 'Подключения')}>{children}</RootLayout>
}

SourcesPage.layout = (page: React.ReactNode) => {
  return <SourcesLayout>{page}</SourcesLayout>
}

export default SourcesPage

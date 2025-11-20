import { Head } from '@inertiajs/react'
import { DataTable } from '~/pages/sources/data-table'
import { RootLayout } from '~/components/root-layout'

import React from 'react'

const SourcesPage = () => {
  return (
    <>
      <Head title="Подключения" />
      <DataTable />
    </>
  )
}

SourcesPage.layout = (page: React.ReactNode) => {
  return <RootLayout title="Подключения">{page}</RootLayout>
}

export default SourcesPage

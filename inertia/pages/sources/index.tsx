import { Head, usePage } from '@inertiajs/react'
import { DataTable } from '~/pages/sources/data-table'
import { RootLayout } from '~/components/root-layout'

import React from 'react'

const SourcesPage = () => {
  const { props } = usePage<{ sourcesMessages?: any }>()
  const m = props.sourcesMessages || {}
  return (
    <>
      <Head title={m.title || 'Подключения'} />
      <DataTable />
    </>
  )
}

function SourcesLayout({ children }: { children: React.ReactNode }) {
  const { props } = usePage<{ sourcesMessages?: any }>()
  const m = props.sourcesMessages || {}
  return <RootLayout title={m.title || 'Подключения'}>{children}</RootLayout>
}

SourcesPage.layout = (page: React.ReactNode) => {
  return <SourcesLayout>{page}</SourcesLayout>
}

export default SourcesPage

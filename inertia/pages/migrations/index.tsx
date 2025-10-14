import { Head } from '@inertiajs/react'
import { RootLayout } from '~/components/layouts/root_layout'

const Migrations = () => {
  return (
    <>
      <Head title="Миграции" />
      Тут будут Миграции
    </>
  )
}

Migrations.layout = (page: React.ReactNode) => {
  return <RootLayout title="Миграции">{page}</RootLayout>
}

export default Migrations

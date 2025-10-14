import { Head } from '@inertiajs/react'
import { RootLayout } from '~/components/layouts/root_layout'

const Datasets = () => {
  return (
    <>
      <Head title="Датасеты" />
      Тут будут Датасеты
    </>
  )
}

Datasets.layout = (page: React.ReactNode) => {
  return <RootLayout title="Датасеты">{page}</RootLayout>
}

export default Datasets

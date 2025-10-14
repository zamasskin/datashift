import { Head } from '@inertiajs/react'
import { RootLayout } from '~/components/root-layout'

const Help = () => {
  return (
    <>
      <Head title="Помощь" />
      Тут Документация
    </>
  )
}

Help.layout = (page: React.ReactNode) => {
  return <RootLayout title="Помощь">{page}</RootLayout>
}

export default Help

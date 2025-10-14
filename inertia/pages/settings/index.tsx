import { Head } from '@inertiajs/react'
import { RootLayout } from '~/components/root-layout'

const Settings = () => {
  return (
    <>
      <Head title="Настройки" />
      Тут настройки
    </>
  )
}

Settings.layout = (page: React.ReactNode) => {
  return <RootLayout title="Настройки">{page}</RootLayout>
}

export default Settings

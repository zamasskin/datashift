import { Head } from '@inertiajs/react'
import { RootLayout } from '~/components/layouts/root_layout'

const Home = () => {
  return (
    <>
      <Head title="Главная" />
      Что-то будет на главной странице
    </>
  )
}

Home.layout = (page: React.ReactNode) => {
  return <RootLayout title="Главная страница">{page}</RootLayout>
}

export default Home

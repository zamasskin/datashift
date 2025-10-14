import { Head } from '@inertiajs/react'
import { RootLayout } from '~/components/root-layout'

const Home = () => {
  return (
    <>
      <Head title="Главная" />
      Что-то будет на главной странице
    </>
  )
}

Home.layout = (page: React.ReactNode) => {
  return <RootLayout title="Dataship">{page}</RootLayout>
}

export default Home

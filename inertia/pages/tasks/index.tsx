import { Head } from '@inertiajs/react'
import { RootLayout } from '~/components/layouts/root_layout'

const Tasks = () => {
  return (
    <>
      <Head title="Задания" />
      Тут будут Задания
    </>
  )
}

Tasks.layout = (page: React.ReactNode) => {
  return <RootLayout title="Задания">{page}</RootLayout>
}

export default Tasks

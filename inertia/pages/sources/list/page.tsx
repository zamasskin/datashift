import { Head, Link } from '@inertiajs/react'
import { RootLayout } from '~/components/layouts/root_layout'
import { columns, Sources } from './columns'
import { DataTable } from './data-table'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Trash } from 'lucide-react'

function getData(): Sources[] {
  // Fetch data from your API here.
  return [
    {
      id: 1,
      name: 'База данных сайта',
      type: 'mysql',
      connectionUrl: 'mysql://user:******@localhost:3306/tiande',
      createdBy: 'user@example.com',
    },
    {
      id: 2,
      name: 'База данных портала',
      type: 'postgresql',
      connectionUrl: 'mysql://user:******@localhost:3306/portal',
      createdBy: 'user@example.com',
    },
    // ...
  ]
}

const SourcesList = () => {
  const data = getData()

  return (
    <>
      <Head title="Источники данных" />
      <div className="flex justify-between mb-4">
        <div className="flex items-center">
          <Input placeholder="Поиск по имени..." className="max-w-sm" />
        </div>
        <div className="flex justify-end ">
          <Button className="cursor-pointer">
            <Link href="/sources/new">Новый</Link>
          </Button>
        </div>
      </div>
      <DataTable columns={columns} data={data} />
      <div className="flex justify-end mt-4">
        <Button variant="destructive" className="cursor-pointer">
          <Trash /> Удалить
        </Button>
      </div>
    </>
  )
}

SourcesList.layout = (page: React.ReactNode) => {
  return <RootLayout title="Источники данных">{page}</RootLayout>
}

export default SourcesList

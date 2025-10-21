import { Head } from '@inertiajs/react'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { QueryTool } from '~/components/dataset/query-tool'
import { RootLayout } from '~/components/root-layout'
import { Button } from '~/components/ui/button'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'

const Datasets = () => {
  const [datasets, setDatasets] = useState<any[]>([])

  const addDataset = (dataset: any) => {
    setDatasets([...datasets, dataset])
  }

  return (
    <>
      <Head title="Датасеты" />

      <div className=" px-4 lg:px-6 space-y-4">
        <QueryTool
          title="b1"
          dataSourceId={1}
          params={['item1.name', 'item1.description']}
          onApply={() => Promise.resolve()}
        />
      </div>

      <div className=" px-4 lg:px-6 space-y-4">
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Plus />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="bottom">
              <DropdownMenuItem>Новая выборка</DropdownMenuItem>
              <DropdownMenuItem>Новый запрос</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Обогатить</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="bottom">
              <DropdownMenuItem>Настройка полей</DropdownMenuItem>
              <DropdownMenuItem>Скрипт</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </>
  )
}

Datasets.layout = (page: React.ReactNode) => {
  return <RootLayout title="Датасеты">{page}</RootLayout>
}

export default Datasets

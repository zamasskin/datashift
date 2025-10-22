import { Head } from '@inertiajs/react'
import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { QueryTool } from '~/components/dataset/query-tool'
import { RootLayout } from '~/components/root-layout'
import { Button } from '~/components/ui/button'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { Dataset } from '~/interfaces/datasets'

function buildName(datasets: Dataset[], prefix: string) {
  const max = datasets.reduce((acc, d) => {
    const num = Number(d.name.replace(prefix, ''))
    return num > acc ? num : acc
  }, 0)
  return `${prefix}${max + 1}`
}

const defaultDatasetProps = {
  sql: {
    data: { value: '', variables: [] },
    props: { isEdit: true, isLoading: false, error: '' },
  },
}

const Datasets = () => {
  const [datasetsRaw, setDatasetsRaw] = useState<Dataset[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [params, setParams] = useState<Record<string, string[]>>({})

  const datasets = useMemo(() => {
    return datasetsRaw.map((dataset) => {
      return {
        data: dataset,
        props: {
          params: [],
        },
      }
    })
  }, [datasetsRaw])

  // const

  const pushSqlProps = () => {
    setDatasetsRaw((old) => [
      ...old,
      {
        name: buildName(old, 'sql_'),
        type: 'sql',
        data: { value: '', variables: [] },
        props: { isEdit: true, isLoading: false, error: '' },
      },
    ])
  }

  const applySqlProps = (name: string, value: string, variables: string[]) => {}

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
              <DropdownMenuItem onClick={pushSqlProps}>Новый запрос</DropdownMenuItem>
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

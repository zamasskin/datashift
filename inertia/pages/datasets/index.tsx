import { Head } from '@inertiajs/react'
import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { SqlTool } from '~/components/dataset/tools/sql-tool'
import { RootLayout } from '~/components/root-layout'
import { Button } from '~/components/ui/button'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { Dataset, SqlSaveProps } from '~/interfaces/datasets'

function buildName(datasets: Dataset[], prefix: string) {
  const max = datasets.reduce((acc, d) => {
    const num = Number(d.name.replace(prefix, ''))
    return num > acc ? num : acc
  }, 0)
  return `${prefix}${max + 1}`
}

const Datasets = () => {
  const [datasetsRaw, setDatasetsRaw] = useState<Dataset[]>([])
  const [params, setParams] = useState<string[]>([])

  const datasets = useMemo(() => {
    return datasetsRaw.map((dataset, i) => {
      return {
        data: dataset,
        datasets: datasetsRaw.slice(0, i),
      }
    })
  }, [datasetsRaw])

  const showActions = useMemo(() => {
    return !datasetsRaw.some((d) => d.type == 'sql' && d.value == '')
  }, [datasetsRaw])

  const pushSqlProps = () => {
    setDatasetsRaw((old) => [
      ...old,
      {
        name: buildName(old, 'sql_'),
        type: 'sql',
        value: '',
        variables: [],
        dataSourceId: 0,
      },
    ])
  }

  const applySqlProps = (name: string, saved: SqlSaveProps) => {
    const { dataSourceId, query, variables, fields } = saved
    setDatasetsRaw((old) =>
      old.map((d) => (d.name == name ? { ...d, value: query, variables, dataSourceId, fields } : d))
    )
  }

  return (
    <>
      <Head title="Датасеты" />

      <div className=" px-4 lg:px-6 space-y-4">
        {datasets.map((dataset) => (
          <div key={dataset.data.name}>
            {dataset.data.type == 'sql' && (
              <SqlTool
                data={dataset.data}
                datasets={dataset.datasets}
                params={params}
                onSave={(saved) => applySqlProps(dataset.data.name, saved)}
                onDelete={() =>
                  setDatasetsRaw((old) => old.filter((d) => d.name != dataset.data.name))
                }
              />
            )}
          </div>
        ))}
      </div>

      {showActions && (
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
      )}
    </>
  )
}

Datasets.layout = (page: React.ReactNode) => {
  return <RootLayout title="Датасеты">{page}</RootLayout>
}

export default Datasets

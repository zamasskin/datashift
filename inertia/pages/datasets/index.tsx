import { Head, usePage } from '@inertiajs/react'
import { Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
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
import { DatasetResult } from '~/components/dataset/dataset-result'

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
  const { props: pageProps } = usePage<{ csrfToken: string }>()
  const [overallResult, setOverallResult] = useState<{
    rows: Array<Record<string, any>>
    columns?: string[]
    loading?: boolean
    error?: string
  }>({ rows: [] })

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

  const runOverall = async () => {
    setOverallResult((prev) => ({ ...prev, loading: true, error: undefined }))
    const last = datasetsRaw[datasetsRaw.length - 1]
    if (!last) {
      setOverallResult({ rows: [], loading: false, error: 'Нет датасетов' })
      return
    }
    if (last.type !== 'sql') {
      setOverallResult({ rows: [], loading: false, error: 'Пока поддерживается только SQL' })
      return
    }
    if (!last.dataSourceId || !last.value?.trim()) {
      setOverallResult({ rows: [], loading: false, error: 'Заполните источник и SQL' })
      return
    }
    try {
      const res = await fetch('/datasets/test-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': pageProps.csrfToken },
        body: JSON.stringify({
          dataSourceId: last.dataSourceId,
          sql: last.value,
          variables: last.variables,
        }),
      })
      const data = await res.json()
      if (data.error) {
        setOverallResult({ rows: [], columns: [], loading: false, error: data.error })
      } else {
        setOverallResult({ rows: data.rows ?? [], columns: data.columns, loading: false })
      }
    } catch (e: any) {
      setOverallResult({ rows: [], loading: false, error: e.message })
    }
  }

  // Автозапуск запроса при изменении датасетов
  useEffect(() => {
    const last = datasetsRaw[datasetsRaw.length - 1]
    if (!last || last.type !== 'sql' || !last.dataSourceId || !last.value?.trim()) return
    const timer = setTimeout(() => {
      runOverall()
    }, 400)
    return () => clearTimeout(timer)
  }, [datasetsRaw])

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

      <div className=" px-4 lg:px-6 space-y-4">
        <DatasetResult result={overallResult} onReload={runOverall} />
      </div>
    </>
  )
}

Datasets.layout = (page: React.ReactNode) => {
  return <RootLayout title="Датасеты">{page}</RootLayout>
}

export default Datasets

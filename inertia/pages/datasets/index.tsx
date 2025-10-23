import { Head, usePage } from '@inertiajs/react'
import { Cog, Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { SqlTool } from '~/components/dataset/tools/sql-tool'
import { RootLayout } from '~/components/root-layout'
import { Button } from '~/components/ui/button'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { Dataset, SqlSaveProps } from '~/interfaces/datasets'
import { DatasetResult } from '~/components/dataset/dataset-result'
import { ParamsEditor, DatasetParamItem } from '~/components/dataset/params-editor'
import { ParamsValues } from '~/components/dataset/params-values'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '~/components/ui/sheet'

function buildName(datasets: Dataset[], prefix: string) {
  const max = datasets.reduce((acc, d) => {
    const num = Number(d.name.replace(prefix, ''))
    return num > acc ? num : acc
  }, 0)
  return `${prefix}${max + 1}`
}

const Datasets = () => {
  const [datasetsRaw, setDatasetsRaw] = useState<Dataset[]>([])
  const [paramItems, setParamItems] = useState<DatasetParamItem[]>([])
  const [paramsSheetOpen, setParamsSheetOpen] = useState(false)
  const canCloseParams = useMemo(() => {
    if (paramItems.length === 0) return true
    const keys = paramItems.map((i) => (i.key || '').trim())
    if (keys.some((k) => k.length === 0)) return false
    const seen = new Set<string>()
    for (const k of keys) {
      const key = k.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
    }
    return true
  }, [paramItems])
  const handleParamsOpenChange = (next: boolean) => {
    if (!next && !canCloseParams) {
      setParamsSheetOpen(true)
      return
    }
    setParamsSheetOpen(next)
  }
  const { props: pageProps } = usePage<{ csrfToken: string }>()
  const [overallResult, setOverallResult] = useState<{
    rows: Array<Record<string, any>>
    columns?: string[]
    loading?: boolean
    error?: string
  }>({ rows: [] })

  const datasets = useMemo(() => {
    return datasetsRaw.map((dataset, i, arr) => {
      const oldDatasets = arr.slice(0, i)
      const field = [
        ...paramItems.map((item) => `params.${item.key || ''}`),
        ...oldDatasets.flatMap((d) => (d.fields || []).map((f) => `${d.name}.${f}`)),
      ]

      return {
        data: dataset,
        fields: field,
        datasets: datasetsRaw.slice(0, i - 1),
      }
    })
  }, [datasetsRaw])

  const params = useMemo(
    () => paramItems.map((item) => Object.fromEntries([[item.key || '', item.value || '']])),
    [paramItems]
  )

  const showActions = useMemo(() => {
    return !datasetsRaw.some((d) => d.type == 'sql' && d.value == '')
  }, [datasetsRaw])

  const pushSqlProps = () => {
    setDatasetsRaw((old) => [
      ...old,
      {
        name: buildName(old, 'sql'),
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

  const resolveVariableValue = (token: string) => {
    // Ожидается {{key}} или {{key.from}}/{{key.to}}. Если без {{ }}, возвращаем как есть.
    const m = token.match(/^\s*\{\{\s*([^}]+)\s*\}\}\s*$/)
    const path = m ? m[1] : token
    const [key, sub] = path.split('.')
    const item = paramItems.find((p) => p.key === key)
    if (!item) return token
    if (item.type === 'date_range') {
      if (sub === 'from') return item.valueFrom || ''
      if (sub === 'to') return item.valueTo || ''
      return ''
    }
    if (item.type === 'number') {
      const n = Number(item.value || '')
      return Number.isFinite(n) ? n : item.value || ''
    }
    // string/date
    return item.value || ''
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
      const resolvedVars = (last.variables || []).map((v) => resolveVariableValue(v))
      const res = await fetch('/datasets/test-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': pageProps.csrfToken },
        body: JSON.stringify({
          dataSourceId: last.dataSourceId,
          sql: last.value,
          variables: resolvedVars,
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

  // Автозапуск запроса при изменении датасетов или параметров
  useEffect(() => {
    const last = datasetsRaw[datasetsRaw.length - 1]
    if (!last || last.type !== 'sql' || !last.dataSourceId || !last.value?.trim()) return
    const timer = setTimeout(() => {
      runOverall()
    }, 400)
    return () => clearTimeout(timer)
  }, [datasetsRaw, paramItems])

  return (
    <>
      <Head title="Датасеты" />

      <div className=" px-4 lg:px-6 space-y-4">
        <div className="flex justify-end">
          <Sheet open={paramsSheetOpen} onOpenChange={handleParamsOpenChange}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <Cog />
                Параметры
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Параметры</SheetTitle>
              </SheetHeader>
              <div className="p-4">
                <ParamsEditor value={paramItems} onChange={setParamItems} />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <ParamsValues items={paramItems} onChange={setParamItems} />

        {datasets.map((dataset) => (
          <div key={dataset.data.name}>
            {dataset.data.type == 'sql' && (
              <SqlTool
                data={dataset.data}
                datasets={dataset.datasets}
                fields={dataset.fields}
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
                  Добавить датасет
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="bottom">
                <DropdownMenuLabel>База данных</DropdownMenuLabel>
                <DropdownMenuGroup>
                  <DropdownMenuItem>Запрос</DropdownMenuItem>
                  <DropdownMenuItem onClick={pushSqlProps}>Sql-запрос</DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Редактирование</DropdownMenuLabel>
                <DropdownMenuGroup>
                  <DropdownMenuItem>Объединение</DropdownMenuItem>
                  <DropdownMenuItem>Трансформация</DropdownMenuItem>
                </DropdownMenuGroup>
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

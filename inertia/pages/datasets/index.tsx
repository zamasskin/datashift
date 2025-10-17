import { Head } from '@inertiajs/react'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { RootLayout } from '~/components/root-layout'
import { Button } from '~/components/ui/button'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { SqlTool } from '~/components/dataset/sql-tool'
import { QueryBuilderTool } from '~/components/dataset/query-builder-tool'
import { v4 as uuidv4 } from 'uuid'

type SqlDataset = {
  type: 'query'
  value: string
  dataSourceId?: number
}

type queryBuilderDataset = {
  type: 'query-builder'
  dataSourceId?: number
}

type DatasetItem = SqlDataset | queryBuilderDataset
type Dataset = DatasetItem & { id: string }

const DatasetDefaults: Record<DatasetItem['type'], DatasetItem> = {
  'query': {
    type: 'query',
    value: '',
  },
  'query-builder': {
    type: 'query-builder',
  },
}

const Datasets = () => {
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [isShowActions, setIsShowActions] = useState(true)

  const onAddDataset = (type: DatasetItem['type']) => {
    setIsShowActions(false)
    setDatasets([...datasets, { ...DatasetDefaults[type], id: uuidv4() }])
  }

  const onChange = (id: string, newDataset: Dataset) => {
    setDatasets((datasets) => datasets.map((d) => (d.id === id ? { ...d, ...newDataset } : d)))
  }

  return (
    <>
      <Head title="Датасеты" />

      <div className=" px-4 lg:px-6 space-y-4">
        {datasets.map((dataset, i) => (
          <div key={dataset.id} className="space-y-4">
            <Tool
              dataset={dataset}
              isShowDeleteButton={i === datasets.length - 1}
              onChangeShowActions={setIsShowActions}
              onChange={onChange}
            />
          </div>
        ))}

        {isShowActions && (
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Plus />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="bottom">
                <DropdownMenuItem onClick={() => onAddDataset('query-builder')}>
                  Новая выборка
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAddDataset('query')}>
                  Новый запрос
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {datasets.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">Обогатить</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" side="bottom">
                  <DropdownMenuItem>Настройка полей</DropdownMenuItem>
                  <DropdownMenuItem>Скрипт</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )}
      </div>
    </>
  )
}

type ToolProps = {
  dataset: Dataset
  isShowDeleteButton?: boolean
  onChangeShowActions: (isEdit: boolean) => void
  onChange(id: string, newDataset: Dataset): void
}

function Tool({ dataset, isShowDeleteButton, onChangeShowActions, onChange }: ToolProps) {
  if (dataset.type === 'query') {
    return (
      <>
        <SqlTool
          isEditMode={!!(dataset.dataSourceId && dataset.value)}
          value={dataset.value}
          isShowDeleteButton={isShowDeleteButton}
          onChangeEditMode={(isEdit) => onChangeShowActions(!isEdit)}
          dataSourceId={dataset.dataSourceId}
          onChangeDataSourceId={(dataSourceId) =>
            onChange(dataset.id, { ...dataset, dataSourceId })
          }
          onChangeValue={(value) => onChange(dataset.id, { ...dataset, value })}
        />
      </>
    )
  }

  if (dataset.type === 'query-builder') {
    return <QueryBuilderTool isShowDeleteButton={isShowDeleteButton} />
  }

  return null
}

Datasets.layout = (page: React.ReactNode) => {
  return <RootLayout title="Датасеты">{page}</RootLayout>
}

export default Datasets

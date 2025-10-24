import { useMemo, useState } from 'react'
import { DataSourceSelect } from '~/components/datasource/data-source-select'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog'
import { SqlEditor } from '../sql-editor'
import { Spinner } from '~/components/ui/spinner'

export type SqlEditorProps = {
  isLoading?: boolean
}

export function SqlDataset(props: SqlEditorProps) {
  const [sourceId, setSourceId] = useState(0)
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const isShowLoading = useMemo(() => props.isLoading || isLoading, [props.isLoading, isLoading])

  const onSelectSourceId = (value: number) => {
    setSourceId(value)
    // TODO: Подгрузить таблицы из источника данных
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Добавить</Button>
      </DialogTrigger>
      <DialogContent className="max-w-[92vw] sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl max-h-[75vh] overflow-y-auto p-4">
        <DialogHeader>
          <DialogTitle>Sql запрос</DialogTitle>
          <DialogDescription>
            <DataSourceSelect value={sourceId} onChange={setSourceId} />
          </DialogDescription>

          <div className="relative">
            <SqlEditor
              value={query}
              onChange={setQuery}
              tables={['users', 'orders', 'products']}
              paramKeys={['userId', 'date', 'region']}
              prevResults={{ sql1: ['ID', 'TOTAL', 'USER_ID'] }}
            />

            {isShowLoading && (
              <div className="absolute bottom-4 right-2">
                <Spinner className="text-muted-foreground" />
              </div>
            )}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Закрыть</Button>
            </DialogClose>
            <Button type="submit">Добавить</Button>
          </DialogFooter>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}

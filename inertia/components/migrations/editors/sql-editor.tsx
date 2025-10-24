import { useState } from 'react'
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

export function SqlEditor() {
  const [sourceId, setSourceId] = useState(0)
  const [query, setQuery] = useState('')

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Добавить</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sql запрос</DialogTitle>
          <DialogDescription>
            <DataSourceSelect value={sourceId} onChange={setSourceId} />
          </DialogDescription>

          <textarea
            className="min-h-40 w-full rounded-md border px-3 py-2 text-sm"
            placeholder="SELECT * FROM table WHERE ..."
            value={query}
            onChange={(ev) => setQuery(ev.target.value)}
          />

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

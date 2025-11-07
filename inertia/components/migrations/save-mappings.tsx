import { useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import { Button } from '~/components/ui/button'
import { Spinner } from '~/components/ui/spinner'
import { FileWarning } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { MappingEditor } from './mapping-editor'

export function SaveMappings({
  error,
  isLoading,
  fetchConfigsLength,
  resultColumns = [],
  sources = [],
  tables = [],
  fields = [],
}: {
  error?: string | null
  isLoading?: boolean
  fetchConfigsLength: number
  resultColumns?: string[]
  sources?: string[]
  tables?: string[]
  fields?: string[]
}) {
  const [open, setOpen] = useState(false)
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle className="text-destructive">Ошибка</AlertTitle>
        <AlertDescription className="text-destructive">
          <pre className="whitespace-pre-wrap break-words max-h-48 overflow-auto">{error}</pre>
        </AlertDescription>
      </Alert>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner />
        Загрузка…
      </div>
    )
  }

  return (
    <>
      {fetchConfigsLength === 0 && (
        <Alert>
          <FileWarning />
          <AlertTitle>
            Предупреждение: сначала добавьте датасеты, чтобы настраивать соответствия
          </AlertTitle>
        </Alert>
      )}

      {fetchConfigsLength > 0 && (
        <>
          <Button variant="outline" onClick={() => setOpen(true)}>Добавить соответствие</Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Создание соответствия</DialogTitle>
              </DialogHeader>
              <MappingEditor
                resultColumns={resultColumns}
                sources={sources}
                tables={tables}
                fields={fields}
                onCancel={() => setOpen(false)}
                onSave={() => setOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </>
      )}
    </>
  )
}

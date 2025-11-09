import { useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import { Button } from '~/components/ui/button'
import { Spinner } from '~/components/ui/spinner'
import { FileWarning } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { MappingEditor } from './mapping-editor'
import type { SaveMapping } from '#interfaces/save_mapping'

export function SaveMappings({
  error,
  isLoading,
  fetchConfigsLength,
  resultColumns = [],
  onSave,
}: {
  error?: string | null
  isLoading?: boolean
  fetchConfigsLength: number
  resultColumns?: string[]
  onSave?: (mapping: SaveMapping) => void
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
            <DialogContent className="w-[95vw] sm:max-w-xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl max-h-[95vh] overflow-hidden">
              <DialogHeader>
                <DialogTitle>Создание соответствия</DialogTitle>
              </DialogHeader>
              <MappingEditor
                resultColumns={resultColumns}
                onCancel={() => setOpen(false)}
                onSave={(mapping) => {
                  onSave?.(mapping)
                  setOpen(false)
                }}
              />
            </DialogContent>
          </Dialog>
        </>
      )}
    </>
  )
}

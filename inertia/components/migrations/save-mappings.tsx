import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import { Button } from '~/components/ui/button'
import { Spinner } from '~/components/ui/spinner'
import { FileWarning } from 'lucide-react'
import { MappingEditor } from './mapping-editor'
import type { SaveMapping } from '#interfaces/save_mapping'

export function SaveMappings({
  error,
  isLoading,
  fetchConfigsLength,
  resultColumns = [],
  saveMappings = [],
  onSave,
}: {
  error?: string | null
  isLoading?: boolean
  fetchConfigsLength: number
  resultColumns?: string[]
  saveMappings?: SaveMapping[]
  onSave?: (mapping: SaveMapping[]) => void
}) {
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
          <MappingEditor
            resultColumns={resultColumns}
            // onCancel={() => setOpen(false)}
            onSave={(mapping) => {
              if (onSave) {
                onSave([...saveMappings, mapping])
              }
            }}
          >
            <Button variant="outline">Добавить соответствие</Button>
          </MappingEditor>
        </>
      )}
    </>
  )
}

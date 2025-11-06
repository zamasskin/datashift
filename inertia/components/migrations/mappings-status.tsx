import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import { Button } from '~/components/ui/button'
import { Spinner } from '~/components/ui/spinner'
import { FileWarning } from 'lucide-react'

export function SaveMappings({
  error,
  isLoading,
  fetchConfigsLength,
}: {
  error?: string | null
  isLoading?: boolean
  fetchConfigsLength: number
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

      {fetchConfigsLength > 0 && <Button>Добавить соответствие</Button>}
    </>
  )
}

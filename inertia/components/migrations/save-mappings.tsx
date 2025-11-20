import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import { Button } from '~/components/ui/button'
import { Spinner } from '~/components/ui/spinner'
import { FileWarning, Trash2, Settings } from 'lucide-react'
import { MappingEditor } from './mapping-editor'
import type { SaveMapping } from '#interfaces/save_mapping'
import { Item, ItemContent, ItemFooter } from '../ui/item'

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
          <AlertTitle>Датасеты ещё не настроены</AlertTitle>
          <AlertDescription>
            Чтобы настраивать соответствия, добавьте хотя бы один датасет.
          </AlertDescription>
          <div className="col-start-2 mt-2">
            <a href="/sources">
              <Button size="sm" variant="outline">
                Открыть подключения
              </Button>
            </a>
          </div>
        </Alert>
      )}

      {fetchConfigsLength > 0 && (
        <>
          {saveMappings.map((mapping, idx) => (
            <Item key={mapping.id} variant="outline">
              <ItemContent>
                <div className="space-y-2 p-1">
                  <div className="text-sm text-muted-foreground">
                    ID: {mapping.id} · Подключение: {mapping.sourceId}
                  </div>

                  <div className="space-y-1">
                    <div className="font-medium">Соответствия колонок</div>
                    {mapping.savedMapping?.length ? (
                      <div className="flex flex-wrap gap-2">
                        {mapping.savedMapping.map((m: any, idx: number) => (
                          <div
                            key={idx}
                            className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs"
                            title={`${m?.tableColumn || ''} → ${m?.resultColumn || ''}`}
                          >
                            <span>{m?.tableColumn || ''}</span>
                            <span>→</span>
                            <span>{m?.resultColumn || ''}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">Нет соответствий</div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="font-medium">Условия обновления</div>
                    {mapping.updateOn?.length ? (
                      <div className="flex flex-wrap gap-2">
                        {mapping.updateOn.map((u: any, idx: number) => (
                          <div
                            key={idx}
                            className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs"
                            title={`${u?.tableColumn || ''} ${u?.operator || ''} ${u?.aliasColumn || ''}${u?.cond ? ` (${u?.cond})` : ''}`}
                          >
                            <span>{u?.tableColumn || ''}</span>
                            <span>{u?.operator || ''}</span>
                            <span>{u?.aliasColumn || ''}</span>
                            {idx > 0 && u?.cond && (
                              <span className="ml-1 text-muted-foreground">({u?.cond})</span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">Нет условий</div>
                    )}
                  </div>
                </div>
              </ItemContent>
              <ItemFooter>
                <div className="flex items-center gap-2 ml-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (onSave) {
                        const next = saveMappings.filter((m) => m.id !== mapping.id)
                        onSave(next)
                      }
                    }}
                  >
                    <Trash2 />
                  </Button>

                  <MappingEditor
                    config={mapping}
                    resultColumns={Array.from(
                      new Set([
                        ...resultColumns,
                        ...saveMappings.slice(0, idx).map((m) => `${m.id}.ID`),
                      ])
                    )}
                    saveBtnName="Сохранить"
                    onSave={(updated) => {
                      if (onSave) {
                        const next = saveMappings.map((m) => (m.id === updated.id ? updated : m))
                        onSave(next)
                      }
                    }}
                  >
                    <Button variant="outline" size="sm">
                      <Settings />
                    </Button>
                  </MappingEditor>
                </div>
              </ItemFooter>
            </Item>
          ))}
          <MappingEditor
            resultColumns={Array.from(
              new Set([...resultColumns, ...saveMappings.map((m) => `${m.id}.ID`)])
            )}
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

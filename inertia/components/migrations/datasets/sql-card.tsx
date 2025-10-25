import { Settings, Trash } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '~/components/ui/item'
import { Config, SqlDataset } from './sql-dataset'

export type SqlCardProps = {
  isLoading?: boolean
  paramKeys?: string[]
  config?: Config
  prevResults?: Record<string, string[]>

  onRemove?: (id: string) => void
  onUpdate?: (config: Config) => void
}

export function SqlCard({
  config,
  paramKeys,
  prevResults,
  isLoading,
  onRemove: onRemove,
  onUpdate,
}: SqlCardProps) {
  const handleRemove = () => {
    if (onRemove) {
      onRemove(config?.id || '')
    }
  }

  return (
    <Item variant="outline">
      <ItemMedia>
        <img
          src="/icons/sql-edit.png"
          alt={config?.id}
          width={32}
          height={32}
          className="object-cover grayscale"
        />
      </ItemMedia>
      <ItemContent>
        <ItemTitle className="line-clamp-1">
          Sql запрос - <span className="text-muted-foreground">{config?.id}</span>
        </ItemTitle>
        <ItemDescription>Источник данных № {config?.params?.sourceId}</ItemDescription>
      </ItemContent>
      <ItemContent className="flex-none text-center">
        <ItemDescription>
          <div className="flex gap-2">
            <Button size="icon" variant="outline" onClick={handleRemove}>
              <Trash />
            </Button>

            <SqlDataset
              onSave={onUpdate}
              prevResults={prevResults}
              paramKeys={paramKeys}
              isLoading={isLoading}
              config={config}
              saveBtnName="Сохранить"
            >
              <Button size="icon" variant="outline">
                <Settings />
              </Button>
            </SqlDataset>
          </div>
        </ItemDescription>
      </ItemContent>
    </Item>
  )
}

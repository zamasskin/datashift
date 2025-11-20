import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle, ItemFooter } from '~/components/ui/item'
import { Button } from '~/components/ui/button'
import { Settings, Trash } from 'lucide-react'
import { ModificationDataset } from '../datasets/modification-dataset'
import type { ModificationConfig } from '#interfaces/modification_config'

export type ModificationCardProps = {
  config?: ModificationConfig
  suggestions?: Record<string, string[]>
  isLoading?: boolean
  onRemove?: (id: string) => void
  onSave?: (config: ModificationConfig) => void
}

export function ModificationCard({
  config,
  suggestions,
  isLoading,
  onRemove,
  onSave,
}: ModificationCardProps) {
  const handleRemove = () => {
    if (onRemove) {
      onRemove(config?.id || '')
    }
  }

  return (
    <Item variant="outline">
      <ItemMedia>
        <img
          src="/icons/modify.png"
          alt={config?.id}
          width={32}
          height={32}
          className="object-cover grayscale"
        />
      </ItemMedia>
      <ItemContent>
        <ItemTitle className="line-clamp-1">
          Модификация - <span className="text-muted-foreground">{config?.id}</span>
        </ItemTitle>
        <ItemDescription>Датасет № {config?.params?.datasetId}</ItemDescription>
      </ItemContent>
      <ItemFooter>
        <div className="flex items-center gap-2 ml-auto">
          <Button size="icon" variant="outline" onClick={handleRemove}>
            <Trash />
          </Button>
          <ModificationDataset
            saveBtnName="Сохранить"
            config={config}
            suggestions={suggestions}
            isLoading={isLoading}
            onSave={onSave}
          >
            <Button size="icon" variant="outline" aria-label="Редактировать">
              <Settings />
            </Button>
          </ModificationDataset>
        </div>
      </ItemFooter>
    </Item>
  )
}

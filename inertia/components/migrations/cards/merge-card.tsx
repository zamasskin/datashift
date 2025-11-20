import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle, ItemFooter } from '~/components/ui/item'
import { MergeDataset } from '../datasets/merge-dataset'
import { Button } from '~/components/ui/button'
import { Settings, Trash } from 'lucide-react'
import { MergeConfig } from '#interfaces/merge_config'
import { FetchConfigMeta } from '#interfaces/fetchсonfigs'

export type MergeCardProps = {
  config?: MergeConfig
  isLoading?: boolean
  suggestions?: FetchConfigMeta['suggestions']
  onRemove?: (id: string) => void
  onSave?: (config: MergeConfig) => void
}
export function MergeCard({ config, isLoading, suggestions, onRemove, onSave }: MergeCardProps) {
  const handleRemove = () => {
    if (onRemove) {
      onRemove(config?.id || '')
    }
  }

  const formatMergeOn = (
    on?: { tableColumn: string; aliasColumn: string; operator: string; cond?: 'and' | 'or' }[]
  ) => {
    if (!on || on.length === 0) return ''
    return on
      .map((o, i) => {
        const cond = i > 0 && o.cond ? ` ${o.cond.toUpperCase()} ` : i > 0 ? ' AND ' : ''
        return `${cond}${o.tableColumn} ${o.operator} ${o.aliasColumn}`
      })
      .join('')
  }

  return (
    <Item variant="outline">
      <ItemMedia>
        <img
          src="/icons/merge.png"
          alt={config?.id}
          width={32}
          height={32}
          className="object-cover grayscale"
        />
      </ItemMedia>
      <ItemContent>
        <ItemTitle className="line-clamp-1">
          Объединение - <span className="text-muted-foreground">{config?.id}</span>
        </ItemTitle>
        <ItemDescription>
          Объединение Датасета {config?.params.datasetLeftId} с {config?.params.datasetRightId}
        </ItemDescription>
        <ItemDescription className="line-clamp-none">
          <div className="text-xs text-muted-foreground space-y-0.5">
            {config?.params?.datasetLeftId ? (
              <div>
                · Левый датасет: <span className="font-medium">{config?.params?.datasetLeftId}</span>
              </div>
            ) : null}
            {config?.params?.datasetRightId ? (
              <div>
                · Правый датасет: <span className="font-medium">{config?.params?.datasetRightId}</span>
              </div>
            ) : null}
            {config?.params?.on?.length ? (
              <div>· ON: {formatMergeOn(config?.params?.on)}</div>
            ) : null}
          </div>
        </ItemDescription>
      </ItemContent>
      <ItemFooter>
        <div className="flex items-center gap-2 ml-auto">
          <Button size="icon" variant="outline" onClick={handleRemove}>
            <Trash />
          </Button>
          <MergeDataset
            saveBtnName="Сохранить"
            config={config}
            suggestions={suggestions}
            isLoading={isLoading}
            onSave={onSave}
          >
            <Button size="icon" variant="outline" aria-label="Редактировать">
              <Settings />
            </Button>
          </MergeDataset>
        </div>
      </ItemFooter>
    </Item>
  )
}

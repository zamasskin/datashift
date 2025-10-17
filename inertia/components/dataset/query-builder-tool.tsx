import { IconPlayerPlay, IconTrash } from '@tabler/icons-react'
import { Button } from '../ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '../ui/card'

export type QueryBuilderToolProps = {
  isShowDeleteButton?: boolean
}

export function QueryBuilderTool(props: QueryBuilderToolProps) {
  const { isShowDeleteButton = false } = props
  return (
    <Card>
      <CardHeader>
        <CardTitle>Выбор источника и таблицы</CardTitle>
        <CardAction>
          <Button type="button" variant="ghost" size="icon" title="Перевыполнить">
            <IconPlayerPlay />
            <span className="sr-only">Перевыполнить</span>
          </Button>
          {isShowDeleteButton && (
            <Button type="button" variant="ghost" size="icon" title="Удалить блок">
              <IconTrash />
              <span className="sr-only">Удалить блок</span>
            </Button>
          )}
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4"></CardContent>
    </Card>
  )
}

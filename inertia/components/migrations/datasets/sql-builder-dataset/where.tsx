import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { WhereData, WhereEditor } from './where-editor'

export type WhereContentProps = {
  data?: WhereData
  onChange?: (newData: WhereData) => void
}

export function WhereContent({ data, onChange }: WhereContentProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Where</CardTitle>
        <CardDescription>Настройка фильтров</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="max-h-72 max-w-full overflow-scroll">
          <WhereEditor data={data} onChange={onChange} />
        </div>
      </CardContent>
    </Card>
  )
}

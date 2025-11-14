import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '~/components/ui/chart'
import { AreaChart as ReAreaChart, Area, CartesianGrid, XAxis, YAxis } from 'recharts'

type Point = { date: string; value: number }
type ChartPoint = {
  date: string
  runs?: number
  errors?: number
  success?: number
  canceled?: number
}

export function DashboardAreaChart({
  title = 'Активность миграций',
  hint = 'Показывает число запусков за период',
  badge,
  data,
  dataRuns,
  dataErrors,
  dataSuccess,
  dataCanceled,
}: {
  title?: string
  hint?: string
  badge?: string
  data?: Point[]
  dataRuns?: Point[]
  dataErrors?: Point[]
  dataSuccess?: Point[]
  dataCanceled?: Point[]
}) {
  const defaultData: ChartPoint[] = [
    { date: 'Янв', runs: 12 },
    { date: 'Фев', runs: 18 },
    { date: 'Мар', runs: 16 },
    { date: 'Апр', runs: 22 },
    { date: 'Май', runs: 20 },
    { date: 'Июн', runs: 26 },
  ]

  function mergeByDate(
    runs: Point[] = [],
    errors: Point[] = [],
    success: Point[] = [],
    canceled: Point[] = []
  ): ChartPoint[] {
    const map = new Map<string, ChartPoint>()
    for (const r of runs) {
      const item = map.get(r.date) || { date: r.date }
      item.runs = r.value
      map.set(r.date, item)
    }
    for (const e of errors) {
      const item = map.get(e.date) || { date: e.date }
      item.errors = e.value
      map.set(e.date, item)
    }
    for (const s of success) {
      const item = map.get(s.date) || { date: s.date }
      item.success = s.value
      map.set(s.date, item)
    }
    for (const c of canceled) {
      const item = map.get(c.date) || { date: c.date }
      item.canceled = c.value
      map.set(c.date, item)
    }
    return Array.from(map.values()).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
  }

  const chartData: ChartPoint[] = (() => {
    if (dataRuns?.length || dataErrors?.length || dataSuccess?.length || dataCanceled?.length)
      return mergeByDate(dataRuns ?? [], dataErrors ?? [], dataSuccess ?? [], dataCanceled ?? [])
    if (data?.length) return data.map((p) => ({ date: p.date, runs: p.value }))
    return defaultData
  })()

  const chartConfig = {
    runs: { label: 'Запуски', color: 'var(--color-chart-1)' },
    success: { label: 'Успешные', color: 'var(--color-chart-2)' },
    canceled: { label: 'Отменённые', color: 'var(--color-chart-4)' },
    errors: { label: 'Ошибки', color: 'var(--color-chart-5)' },
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base font-medium text-muted-foreground">{title}</CardTitle>
          {badge && <Badge variant="secondary">{badge}</Badge>}
        </div>
        {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
      </CardHeader>
      <CardContent className="pt-0">
        <ChartContainer config={chartConfig} className="h-[240px] w-full">
          <ReAreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="areaRuns" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-runs)" stopOpacity={0.6} />
                <stop offset="95%" stopColor="var(--color-runs)" stopOpacity={0.06} />
              </linearGradient>
              <linearGradient id="areaErrors" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-errors)" stopOpacity={0.6} />
                <stop offset="95%" stopColor="var(--color-errors)" stopOpacity={0.06} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value: string) => {
                const d = new Date(value)
                return d.toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' })
              }}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              domain={[0, 'dataMax']}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  indicator="dot"
                  labelFormatter={(value: string) =>
                    new Date(value).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' })
                  }
                />
              }
            />
            <Area
              type="monotone"
              dataKey="errors"
              name="Ошибки"
              stroke="var(--color-errors)"
              strokeOpacity={0.7}
              fill="url(#areaErrors)"
              strokeWidth={1.5}
              dot={{ r: 1.5 }}
            />
            <Area
              type="monotone"
              dataKey="canceled"
              name="Отменённые"
              stroke="var(--color-canceled)"
              strokeOpacity={0.75}
              fill="none"
              strokeWidth={1.5}
              dot={{ r: 1.5 }}
            />
            <Area
              type="monotone"
              dataKey="success"
              name="Успешные"
              stroke="var(--color-success)"
              strokeOpacity={0.75}
              fill="none"
              strokeWidth={1.5}
              dot={{ r: 1.5 }}
            />
            <Area
              type="monotone"
              dataKey="runs"
              name="Запуски"
              stroke="var(--color-runs)"
              strokeOpacity={0.7}
              fill="url(#areaRuns)"
              strokeWidth={1.5}
              dot={{ r: 1.5 }}
            />
            <ChartLegend content={<ChartLegendContent />} />
          </ReAreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import {
  AreaChart as ReAreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

type Point = { date: string; value: number }
type ChartPoint = { date: string; runs?: number; errors?: number }

export function DashboardAreaChart({
  title = 'Активность миграций',
  hint = 'Показывает число запусков за период',
  badge,
  data,
  dataRuns,
  dataErrors,
}: {
  title?: string
  hint?: string
  badge?: string
  data?: Point[]
  dataRuns?: Point[]
  dataErrors?: Point[]
}) {
  const defaultData: ChartPoint[] = [
    { date: 'Янв', runs: 12 },
    { date: 'Фев', runs: 18 },
    { date: 'Мар', runs: 16 },
    { date: 'Апр', runs: 22 },
    { date: 'Май', runs: 20 },
    { date: 'Июн', runs: 26 },
  ]

  function mergeByDate(runs: Point[] = [], errors: Point[] = []): ChartPoint[] {
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
    return Array.from(map.values()).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
  }

  const chartData: ChartPoint[] = (() => {
    if (dataRuns?.length || dataErrors?.length) return mergeByDate(dataRuns ?? [], dataErrors ?? [])
    if (data?.length) return data.map((p) => ({ date: p.date, runs: p.value }))
    return defaultData
  })()

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
        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ReAreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="areaRuns" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="areaErrors" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} domain={[0, 'dataMax']} />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 8,
                }}
              />
              <Area
                type="monotone"
                dataKey="runs"
                name="Запуски"
                stroke="#3b82f6"
                fill="url(#areaRuns)"
                strokeWidth={2}
                dot={{ r: 2 }}
              />
              <Area
                type="monotone"
                dataKey="errors"
                name="Ошибки"
                stroke="#ef4444"
                fill="url(#areaErrors)"
                strokeWidth={2}
                dot={{ r: 2 }}
              />
              <Legend />
            </ReAreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

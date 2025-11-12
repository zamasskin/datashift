import type MigrationRun from '#models/migration_run'
import { Link } from '@inertiajs/react'
import { Progress } from './ui/progress'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'

type Props = {
  runnings: MigrationRun[]
}

export function RunningIndicators({ runnings }: Props) {
  if (runnings.length === 0) return null

  return (
    <div className="mt-4 p-2 rounded-md border border-[hsl(var(--sidebar-border))]">
      <div className="text-xs font-medium text-muted-foreground mb-2">
        Запущено ({runnings.length})
      </div>
      <ul className="space-y-2">
        {runnings.map((r) => (
          <li key={r.id} className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <Link href={`/migrations/${r.migrationId}`} className="flex items-center gap-2">
                <span className="inline-block size-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm text-foreground">Миграция #{r.migrationId}</span>
              </Link>
              <span className="text-xs text-muted-foreground">{r.trigger}</span>
            </div>
            {r.progress.length > 0 && (
              <Popover>
                <PopoverTrigger asChild>
                  <div className="cursor-pointer">
                    <Progress value={r.progress[0]} />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Прогресс</span>
                      <span className="text-xs text-foreground">{r.progress[0]}%</span>
                    </div>
                  </div>
                </PopoverTrigger>
                <PopoverContent>
                  {r.progress.map((percent, idx) => (
                    <div key={idx} className="space-y-2">
                      <span className="text-xs text-muted-foreground">{`Поток ${idx + 1}`}</span>
                      <Progress value={percent} />
                      <span className="text-xs text-foreground">{`${percent}%`}</span>
                    </div>
                  ))}
                </PopoverContent>
              </Popover>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

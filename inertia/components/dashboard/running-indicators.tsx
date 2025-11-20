import type MigrationRun from '#models/migration_run'
import { Link, usePage } from '@inertiajs/react'
import { Progress } from '../ui/progress'
import { Card, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { StopCircle } from 'lucide-react'
import { useState } from 'react'
import { useI18n } from '~/hooks/useI18nLocal'

type Props = {
  runnings: MigrationRun[]
}

export function DashboardRunningIndicators({ runnings }: Props) {
  if (runnings.length === 0) return null

  const {
    props: { csrfToken },
  } = usePage<{ csrfToken: string }>()
  const { t } = useI18n()
  const [stopping, setStopping] = useState<Record<number, boolean>>({})

  const stopRun = async (r: MigrationRun) => {
    setStopping((prev) => ({ ...prev, [r.id]: true }))
    try {
      await fetch('/migrations/stop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': csrfToken,
        },
        body: JSON.stringify({ migrationId: r.migrationId, trigger: r.trigger }),
      })
    } finally {
      setStopping((prev) => ({ ...prev, [r.id]: false }))
    }
  }

  return (
    <Card>
      <CardContent className="pt-4">
        <ul className="space-y-4">
          {runnings.map((r) => {
            const anyR = r as any
            const name = anyR?.migrationName ?? anyR?.migration?.name
            const progressBars = r.progress.length > 0 ? r.progress : [0]

            return (
              <li key={r.id} className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Link href={`/migrations/${r.migrationId}`} className="flex items-center gap-2">
                    <span className="inline-block size-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-sm text-foreground">
                      {name
                        ? name
                        : `${String(t('layout.root.runningIndicators.noNamePrefix', 'Миграция #'))}${r.migrationId}`}
                    </span>
                  </Link>
                  <span className="text-xs text-muted-foreground">{r.trigger}</span>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    {progressBars.map((percent, idx) => (
                      <div key={idx} className="mb-2 last:mb-0">
                        <Progress value={percent} />
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {`${String(t('layout.root.runningIndicators.flowLabel', 'Поток'))} ${idx + 1}`}
                          </span>
                          <span className="text-xs text-foreground">{percent}%</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={!!stopping[r.id]}
                    onClick={() => stopRun(r)}
                    aria-label={String(t('layout.root.runningIndicators.stopAria', 'Остановить запуск'))}
                  >
                    <StopCircle className="text-destructive" />
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}

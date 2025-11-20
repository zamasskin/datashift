import type MigrationRun from '#models/migration_run'
import { Link, usePage } from '@inertiajs/react'
import { Progress } from './ui/progress'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from './ui/dropdown-menu'
import { ScrollArea } from './ui/scroll-area'
import { Button } from './ui/button'
import { useState } from 'react'
import { StopCircle } from 'lucide-react'

type Props = {
  runnings: MigrationRun[]
}

export function RunningIndicators({ runnings }: Props) {
  if (runnings.length === 0) return null

  const {
    props: { csrfToken, layoutMessages },
  } = usePage<{ csrfToken: string; layoutMessages: any }>()
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
    <div className="mt-4 p-2 rounded-md border border-[hsl(var(--sidebar-border))]">
      <div className="text-xs font-medium text-muted-foreground mb-2">
        {`${layoutMessages?.root?.runningIndicators?.header || 'Running'} (${runnings.length})`}
      </div>
      <ScrollArea className="max-h-56">
        <ul className="space-y-2">
          {runnings.map((r) => {
            const anyR = r as any
            const name = anyR?.migrationName ?? anyR?.migration?.name
            return (
              <li key={r.id} className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <Link href={`/migrations/${r.migrationId}`} className="flex items-center gap-2">
                    <span className="inline-block size-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-sm text-foreground">
                      {name
                        ? name
                        : `${layoutMessages?.root?.runningIndicators?.noNamePrefix || 'Migration #'}${r.migrationId}`}
                    </span>
                  </Link>

                  <span className="text-xs text-muted-foreground">{r.trigger}</span>
                </div>

              <div className="flex items-center gap-2">
                {r.progress.length > 0 ? (
                  <div className="flex-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <div className="cursor-pointer">
                          <Progress value={r.progress[0]} />
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              {layoutMessages?.root?.runningIndicators?.progress || 'Progress'}
                            </span>
                            <span className="text-xs text-foreground">{r.progress[0]}%</span>
                          </div>
                        </div>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" side="right">
                        <DropdownMenuLabel>
                          {layoutMessages?.root?.runningIndicators?.streamsLabel || 'Streams'}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {r.progress.map((percent, idx) => (
                          <DropdownMenuItem key={idx} className="flex flex-col gap-1">
                            <span className="text-xs text-muted-foreground">
                              {`${layoutMessages?.root?.runningIndicators?.flowLabel || 'Flow'} ${
                                idx + 1
                              }`}
                            </span>
                            <Progress value={percent} />
                            <span className="text-xs text-foreground">{`${percent}%`}</span>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ) : (
                  <div className="flex-1">
                    <Progress value={0} />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {layoutMessages?.root?.runningIndicators?.progress || 'Progress'}
                      </span>
                      <span className="text-xs text-foreground">{0}%</span>
                    </div>
                  </div>
                )}

                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={!!stopping[r.id]}
                  onClick={() => stopRun(r)}
                  aria-label={layoutMessages?.root?.runningIndicators?.stopAria || 'Stop run'}
                >
                  <StopCircle className="text-destructive" />
                </Button>
              </div>
              </li>
            )
          })}
        </ul>
      </ScrollArea>
    </div>
  )
}

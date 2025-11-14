import MigrationRun from '#models/migration_run'
import { usePage } from '@inertiajs/react'
import { ReactNode, useEffect, useRef } from 'react'
import { useMigrationRuns } from '~/store/migrations'

export const GlobalSseProvider = ({ children }: { children: ReactNode }) => {
  const { setRunnings, changeRunning } = useMigrationRuns()
  const esRef = useRef<EventSource | null>(null)
  const page = usePage()

  useEffect(() => {
    setRunnings(page.props.runningMigrations as MigrationRun[])
  }, [page.props.runningMigrations])

  const closeStream = () => {
    esRef.current?.close()
    esRef.current = null
  }

  const openStream = () => {
    closeStream()
    const es = new EventSource(`/stream`)
    es.onopen = () => {
      console.log('open stream')
    }
    es.onmessage = (e) => {
      // Общие события без имени
      // Можно показать статус «listening»
      console.log('message', e.data)
    }
    es.addEventListener('migration_run', (e: MessageEvent) => {
      const payload = JSON.parse(e.data)
      // Сохраняем имя миграции между событиями, если оно уже было получено
      const current = useMigrationRuns.getState().runnings
      const prev = current.find(
        (r) => r.id === payload.id || r.migrationId === payload.migrationId
      ) as any
      const migrationName = (payload?.migration?.name as string | undefined) ?? prev?.migrationName
      changeRunning({ ...payload, migrationName })
    })

    es.addEventListener('error', (e: MessageEvent) => {
      console.error('error', e)
      // При остановке/завершении сервер может закрыть соединение — браузер
      // сгенерирует error и затем переподключится. Не закрываем вручную.
      if (es.readyState === 2 /* EventSource.CLOSED */) {
        closeStream()
      }
    })
    esRef.current = es
  }

  useEffect(() => {
    openStream()
    return () => closeStream()
  }, [])

  return children
}

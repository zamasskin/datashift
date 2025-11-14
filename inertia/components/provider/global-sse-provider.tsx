import MigrationRun from '#models/migration_run'
import { usePage } from '@inertiajs/react'
import { ReactNode, useEffect, useRef } from 'react'
import { useMigrationRuns } from '~/store/migrations'
import { useNotifications } from '~/store/notifications'

export const GlobalSseProvider = ({ children }: { children: ReactNode }) => {
  const { setRunnings, changeRunning } = useMigrationRuns()
  const { setItems, addItem, updateItem, removeItem, clear } = useNotifications()
  const esRef = useRef<EventSource | null>(null)
  const page = usePage()

  useEffect(() => {
    setRunnings(page.props.runningMigrations as MigrationRun[])
  }, [page.props.runningMigrations])

  // Инициализация уведомлений из SSR-пропсов, если доступны
  useEffect(() => {
    const events = (page.props as any)?.events?.items ?? []
    if (Array.isArray(events)) {
      setItems(events as any)
    }
  }, [(page.props as any)?.events])

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

    // Живые уведомления
    es.addEventListener('notification_create', (ev: MessageEvent) => {
      try {
        const payload = JSON.parse(ev.data)
        const e = {
          id: Number(payload.id),
          createdAt: payload.createdAt ?? null,
          type: payload.type,
          errorId: payload.errorId ?? undefined,
          message: payload.message ?? null,
        }
        addItem(e as any)
      } catch {}
    })
    es.addEventListener('notification_update', (ev: MessageEvent) => {
      try {
        const payload = JSON.parse(ev.data)
        const id = Number(payload.id)
        const muted = !!payload.muted
        if (muted) {
          removeItem(id)
        } else {
          updateItem(id, payload)
        }
      } catch {}
    })
    es.addEventListener('notifications_cleared', (_ev: MessageEvent) => {
      clear()
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

import { create } from 'zustand'

export type EventItem = {
  id: number
  createdAt?: string | null
  type?: 'error' | 'notify' | string
  errorId?: number
  message?: string | null
  // Дополнительные поля, если приходят вместе с событием
  error?: {
    id: number
    uuid?: string
    message: string | null
  }
  severity?: 'error' | 'warning' | 'info'
  status?: 'open' | 'resolved'
  muted?: boolean
}

type NotificationsState = {
  items: EventItem[]
  setItems: (items: EventItem[]) => void
  addItem: (item: EventItem) => void
  updateItem: (id: number, patch: Partial<EventItem>) => void
  removeItem: (id: number) => void
  clear: () => void
}

export const useNotifications = create<NotificationsState>((set, get) => ({
  items: [],
  setItems: (items) => {
    // дедупликация по id
    const map = new Map<number, EventItem>()
    for (const it of items) map.set(Number(it.id), it)
    set({ items: Array.from(map.values()) })
  },
  addItem: (item) => {
    const id = Number(item.id)
    const prev = get().items
    if (prev.some((x) => Number(x.id) === id)) return
    set({ items: [item, ...prev] })
  },
  updateItem: (id, patch) => {
    const nid = Number(id)
    set((state) => ({
      items: state.items.map((x) => (Number(x.id) === nid ? { ...x, ...patch } : x)),
    }))
  },
  removeItem: (id) => {
    const nid = Number(id)
    set((state) => ({ items: state.items.filter((x) => Number(x.id) !== nid) }))
  },
  clear: () => set({ items: [] }),
}))

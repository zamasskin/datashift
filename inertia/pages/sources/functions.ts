import { router } from '@inertiajs/react'

export async function SourcesDelete(ids: number[], confirmText?: string) {
  if (!confirm(confirmText || 'Вы точно уверены?')) return
  router.delete('/sources', {
    data: { ids },
    preserveScroll: true,
  })
}

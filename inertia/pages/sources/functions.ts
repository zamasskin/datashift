import { router } from '@inertiajs/react'

export async function SourcesDelete(ids: number[]) {
  if (!confirm('Вы точно уверены?')) return
  router.delete('/sources', {
    data: { ids },
    preserveScroll: true,
  })
}

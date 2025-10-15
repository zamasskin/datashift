export async function SourcesDelete(ids: number[], csrfToken: string) {
  if (confirm('Вы точно уверены?')) {
    await fetch('/sources', {
      method: 'DELETE',
      body: JSON.stringify({ ids }),
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': csrfToken,
        'X-Requested-With': 'XMLHttpRequest',
      },
    })
    // Пока не знаем как обновить таблицу после удаления
    window.location.reload()
  }
}

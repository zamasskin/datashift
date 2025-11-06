export type SqlConfig = {
  type: 'sql'
  id: string
  params: { sourceId: number; query: string }
}

export type SqlConfigExecute = SqlConfig & {
  page?: number
}

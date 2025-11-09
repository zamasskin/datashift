export type UpdateOn = {
  tableColumn: string
  aliasColumn: string
  operator: '=' | '!=' | '<' | '<=' | '>' | '>='
  cond?: 'and' | 'or'
}

export type SaveMapping = {
  sourceId: number
  savedMapping: Record<string, string>[]
  updateOn: UpdateOn[]
}

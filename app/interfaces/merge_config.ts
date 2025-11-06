type MergeOn = {
  tableColumn: string
  aliasColumn: string
  operator: '=' | '!=' | '<' | '<=' | '>' | '>='
  cond?: 'and' | 'or'
}

export type MergeConfig = {
  type: 'merge'
  id: string
  params: {
    datasetLeftId: string
    datasetRightId: string
    on: MergeOn[]
  }
}

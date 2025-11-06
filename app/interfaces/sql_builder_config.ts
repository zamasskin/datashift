type JoinOn = {
  tableColumn: string
  aliasColumn: string
  operator: '=' | '!=' | '<' | '<=' | '>' | '>='
  cond?: 'and' | 'or'
}

type JoinItem = {
  table: string
  alias?: string
  type: 'inner' | 'left' | 'right' | 'full'
  on: JoinOn[]
}

type WhereField = {
  key: string
  value?: any
  values?: any[]
  op?: '=' | '!=' | '<>' | '>' | '>=' | '<' | '<=' | 'in' | 'nin'
}
type WhereData = {
  fields?: WhereField[]
  $and?: Record<string, any>
  $or?: Record<string, any>
}

export type SqlBuilderConfig = {
  type: 'sql_builder'
  id: string
  params: {
    sourceId: number
    table: string
    alias?: string
    selects?: string[]
    orders?: Record<string, 'asc' | 'desc'>[]
    joins?: JoinItem[]
    where?: WhereData
    hawing?: WhereData
    group?: string[]
  }
}

export type SqlBuilderConfigExecute = SqlBuilderConfig & {
  page?: number
}

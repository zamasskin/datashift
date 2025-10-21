export interface SqlDataset {
  type: 'sql'
  query: string
  datasourceId: number
  variables: string[]
}

export interface BuildSqlDataset {
  type: 'buildQuery'
  datasourceId: number
  variables: string[]
  table: string
  columns?: string[]
  filters?: {
    column: string
    operator: '=' | '!=' | '>' | '<' | '>=' | '<='
    value: string
  }[]
  groupBy?: string[]
  orderBy?: {
    column: string
    direction: 'asc' | 'desc'
  }[]
  having?: {
    column: string
    operator: '=' | '!=' | '>' | '<' | '>=' | '<='
    value: string
  }[]
  joins?: {
    type: 'join' | 'leftJoin' | 'rightJoin' | 'innerJoin'
    table: string
    on: {
      left: string
      right: string
      operator?: 'AND' | 'OR'
    }[]
  }[]
}

export type DatasetItem = SqlDataset | BuildSqlDataset
export type Dataset = DatasetItem & {
  name: string
}

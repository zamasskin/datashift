export interface SqlDataset {
  type: 'sql'
  value: string
  variables: string[]
  dataSourceId: number
}

interface MergeDataset {
  type: 'merge'
  rules: any[]
}

type DatasetItem = SqlDataset | MergeDataset
export type Dataset = DatasetItem & {
  name: string
  fields?: string[]
}

export type SqlSaveProps = {
  dataSourceId: number
  query: string
  variables: string[]
  fields: string[]
}

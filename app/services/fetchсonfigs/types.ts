import {
  MergeConfig,
  ModificationConfig,
  ParamItem,
  SqlBuilderConfig,
  SqlConfig,
} from '#models/migration'

type SqlData = {
  dataType: 'sql'
  data: Record<string, any>[]
}

type ParamsData = {
  dataType: 'params'
  data: ParamItem[]
}

type DataItem = SqlData | ParamsData
export type LastData = DataItem & {
  id: string
}

export type GenSqlBuilderConfig = SqlBuilderConfig & {
  page?: number
}

export type GenFetchConfig = GenSqlConfig | GenSqlBuilderConfig | MergeConfig | ModificationConfig

type GenSqlConfig = SqlConfig & {
  page?: number
}

import { SqlBuilderConfig } from '#interfaces/sql_builder_config'
import { SqlConfig } from '#interfaces/sql_config'
import { MergeConfig } from '#interfaces/merge_config'
import { ModificationConfig } from '#interfaces/modification_config'

export type FetchConfig = SqlConfig | SqlBuilderConfig | MergeConfig | ModificationConfig

export type ArrayColumnsResult = {
  datasetId: string
  dataType: 'array_columns'
  data: Record<string, any>[]
  meta: {
    name: string
    columns: string[]
  }
}

export type ParamsResult = {
  dataType: 'params'
  data: Record<string, any>
}

export type FetchConfigResult = (ArrayColumnsResult | ParamsResult) & {
  progress?: number
  count?: number
}

export type FetchConfigMeta = {
  params: Record<string, any>
  progressList: number[]
  suggestions: Record<string, string[]>
}

import { FetchConfig } from '#models/migration'
import _ from 'lodash'
import { GenFetchConfig, LastData } from './types.js'
import { executeSqlConfig } from './sql_config.js'
import { executeSqlBuilderConfig } from './sql_builder_config.js'
import { executeMergeConfig } from './merge_config.js'
import { executeModificationConfig } from './modification_config.js'

export async function* queryFetchConfig(
  configs: GenFetchConfig[],
  lastData: LastData[]
): AsyncGenerator<LastData> {
  if (configs.length === 0) {
    return
  }

  const [head, ...tail] = configs
  for await (const data of executeFetchConfig(head, lastData)) {
    for await (const result of queryFetchConfig(tail, [...lastData, data])) {
      yield result
    }
  }
}

export function executeFetchConfig(config: GenFetchConfig, lastData: LastData[]) {
  switch (config.type) {
    case 'sql':
      return executeSqlConfig(config, lastData)
    case 'sql_builder':
      return executeSqlBuilderConfig(config, lastData)
    case 'merge':
      return executeMergeConfig(config, lastData)
    case 'modification':
      return executeModificationConfig(config, lastData)
    default:
      throw new Error(`Unsupported fetch config type: ${(config as FetchConfig).type}`)
  }
}

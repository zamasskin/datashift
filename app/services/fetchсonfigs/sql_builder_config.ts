import { GenSqlBuilderConfig, LastData } from './types.js'

export async function* executeSqlBuilderConfig(
  config: GenSqlBuilderConfig,
  lastData: LastData[]
): AsyncGenerator<LastData> {
  yield {
    id: config.id,
    dataType: 'sql',
    data: [],
  }
}

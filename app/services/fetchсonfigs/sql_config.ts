import { SqlConfig } from '#models/migration'
import { LastData } from './types.js'

export async function* executeSqlConfig(
  config: SqlConfig,
  lastData: LastData[]
): AsyncGenerator<LastData> {
  yield {
    id: config.id,
    dataType: 'sql',
    data: [],
  }
}

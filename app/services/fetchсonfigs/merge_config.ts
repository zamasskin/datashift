import { MergeConfig } from '#models/migration'
import { LastData } from './types.js'

export async function* executeMergeConfig(
  config: MergeConfig,
  lastData: LastData[]
): AsyncGenerator<LastData> {
  yield {
    id: config.id,
    dataType: 'sql',
    data: [],
  }
}

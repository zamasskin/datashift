import { ModificationConfig } from '#models/migration'
import { LastData } from './types.js'

export async function* executeModificationConfig(
  config: ModificationConfig,
  lastData: LastData[]
): AsyncGenerator<LastData> {
  yield {
    id: config.id,
    dataType: 'sql',
    data: [],
  }
}

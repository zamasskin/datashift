import SqlConfigService from '#services/sql_config_service'
import SqlBuilderConfigService from '#services/sql_builder_config_service'
import MergeConfigService from '#services/merge_config_service'
import ModificationConfigService from '#services/modification_config_service'
import { FetchConfig, FetchConfigMeta, FetchConfigResult } from '#interfaces/fetchсonfigs'

export default class FetchConfigService {
  constructor(
    private sqlConfig = new SqlConfigService(),
    private sqlBuilderConfig = new SqlBuilderConfigService(),
    private mergeConfig = new MergeConfigService(),
    private modificationConfig = new ModificationConfigService()
  ) {}

  async *execute(
    configList: FetchConfig[],
    resultList: FetchConfigResult[]
  ): AsyncGenerator<{ data: FetchConfigResult; meta: FetchConfigMeta }> {
    // Рекурсивная обработка: каждый ранее полученный датасет является родителем,
    // поэтому запускаем «хвост» для каждого результата «головы».
    if (configList.length === 0) {
      return
    }

    const [head, ...tail] = configList
    for await (const data of this.executeOne(head, resultList)) {
      if (tail.length === 0) {
        // Последний конфиг в цепочке — отдаём конечный результат
        yield { data, meta: this.parseMeta([...resultList, data]) }
      } else {
        // Пробрасываем родительскую цепочку дальше
        for await (const result of this.execute(tail, [...resultList, data])) {
          yield result
        }
      }
    }
  }

  private executeOne(
    config: FetchConfig,
    lastData: FetchConfigResult[]
  ): AsyncGenerator<FetchConfigResult> {
    switch (config.type) {
      case 'sql':
        return this.sqlConfig.execute(config as any, lastData)
      case 'sql_builder':
        return this.sqlBuilderConfig.execute(config as any, lastData)
      case 'merge':
        return this.mergeConfig.execute(config as any, lastData)
      case 'modification':
        return this.modificationConfig.execute(config as any, lastData)
      default:
        throw new Error(`Unsupported fetch config type: ${(config as FetchConfig).type}`)
    }
  }

  private parseMeta(resultList: FetchConfigResult[]): FetchConfigMeta {
    const paramsItem = resultList.find((item) => item.dataType === 'params')
    const progressList = resultList
      .map((item) => item?.progress)
      .filter((progress) => typeof progress === 'number')

    const suggestions: Record<string, string[]> = {}
    for (const item of resultList) {
      if (item.dataType === 'params') {
        suggestions['params'] = Object.keys(item.data || {}).map((key) => `params.${key}`)
      }

      if (item.dataType === 'array_columns') {
        suggestions[item.datasetId] = item.meta.columns.map(
          (column) => `${item.datasetId}.${column}`
        )
      }
    }

    return {
      params: paramsItem?.data || {},
      progressList,
      suggestions,
    }
  }
}

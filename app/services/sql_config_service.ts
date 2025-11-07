import { FetchConfigResult } from '#interfaces/fetchсonfigs'
import { SqlConfigExecute } from '#interfaces/sql_config'
import DataSource from '#models/data_source'
import SqlService from '#services/sql_service'

export default class SqlConfigService {
  private limit = 100

  constructor(private sqlService = new SqlService()) {}

  async *execute(
    config: SqlConfigExecute,
    resultList: FetchConfigResult[]
  ): AsyncGenerator<FetchConfigResult> {
    const { params } = config
    const ds = await DataSource.find(params.sourceId)
    if (!ds) {
      throw new Error(`DataSource not found: ${params.sourceId}`)
    }

    const prepared = this.sqlService.replaceSqlPlaceholders(
      config.params.query,
      this.sqlService.getSource(resultList)
    )

    console.log(prepared.sql, prepared.values, config)

    const count = await this.sqlService.countSql(ds.type, ds.config, prepared.sql, prepared.values)
    if (config.page) {
      const { rows, columns } = await this.sqlService.executeSql(
        ds.type,
        ds.config,
        prepared.sql,
        prepared.values,
        this.limit,
        (config.page - 1) * this.limit
      )

      yield {
        datasetId: config.id,
        dataType: 'array_columns',
        data: rows,
        count: Math.ceil(count / this.limit),
        meta: {
          name: 'Sql',
          columns: columns || [],
        },
      }
    } else {
      const countPages = Math.ceil(count / this.limit)
      for (let page = 1; page <= countPages; page++) {
        const { rows, columns } = await this.sqlService.executeSql(
          ds.type,
          ds.config,
          prepared.sql,
          prepared.values,
          this.limit,
          (page - 1) * this.limit
        )

        yield {
          datasetId: config.id,
          dataType: 'array_columns',
          data: rows,
          progress: Math.round((page / countPages) * 100),
          count: Math.ceil(count / this.limit),
          meta: {
            name: 'Sql',
            columns: columns || [],
          },
        }
      }
    }
  }

  // TODO: Если появятся новые DataType(например json)
  // нужно будет их правильно обработать
}

import { FetchConfig, FetchConfigResult } from '#interfaces/fetchсonfigs'
import type { SqlConfig } from '#interfaces/sql_config'
import type { SqlBuilderConfig } from '#interfaces/sql_builder_config'
import type { MergeConfig } from '#interfaces/merge_config'
import type { ModificationConfig } from '#interfaces/modification_config'
import type { DateParamValue, Param } from '#interfaces/params'
import DataSource from '#models/data_source'
import Migration from '#models/migration'
import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import { ParamsService } from '#services/params_service'
import FetchConfigService from '#services/fetchсonfigs'

export default class MigrationsController {
  async index({ inertia }: HttpContext) {
    const migrations = await Migration.query().preload('user')
    return inertia.render('migrations', { migrations })
  }

  async edit({ inertia, params }: HttpContext) {
    const dataSources = await DataSource.query().preload('user')
    const migration = await Migration.findOrFail(params.id)
    return inertia.render('migrations/edit', { migration, dataSources })
  }

  async store({ request, response, auth }: HttpContext) {
    const name = request.input('name') as string
    if (name && typeof name === 'string') {
      const migration = await Migration.create({
        name,
        isActive: true,
        fetchConfigs: [],
        saveMappings: [],
        cronExpression: null,
        createdBy: auth.user?.id,
      })

      response.redirect(`/migrations/${migration.id}`)
    } else {
      return response.status(422).send({ error: 'Invalid migration name' })
    }
  }

  async update({ params, request, response, inertia }: HttpContext) {
    const id = Number(params.id)
    if (!Number.isFinite(id)) {
      return response.status(404).send({ error: 'Migration not found' })
    }

    // --- cronExpression validation ---
    const dayEnum = vine.enum(['mo', 'tu', 'we', 'th', 'fr', 'sa', 'su'])
    const cronIntervalSchema = vine.object({
      type: vine.enum(['interval']),
      count: vine.number(),
      units: vine.enum(['s', 'm', 'h']),
    })
    const cronIntervalTimeSchema = vine.object({
      type: vine.enum(['interval-time']),
      timeUnits: vine.number(),
      timeStart: vine.string(),
      timeEnd: vine.string(),
      days: vine.array(dayEnum).minLength(1),
    })
    const cronTimeSchema = vine.object({
      type: vine.enum(['time']),
      time: vine.string(),
      days: vine.array(dayEnum).minLength(1),
    })

    const cronExprSchema = vine
      .union([
        vine.union.if((val) => vine.helpers.isString(val), vine.string()),
        vine.union.if(
          (val) => vine.helpers.isObject(val) && (val as any)?.type === 'interval',
          cronIntervalSchema
        ),
        vine.union.if(
          (val) => vine.helpers.isObject(val) && (val as any)?.type === 'interval-time',
          cronIntervalTimeSchema
        ),
        vine.union.if(
          (val) => vine.helpers.isObject(val) && (val as any)?.type === 'time',
          cronTimeSchema
        ),
      ])
      .otherwise((_, field) => {
        field.report('Invalid cronExpression', 'invalid_cron_expression', field)
      })

    // Дискретный union по полю type через vine.group
    const fetchConfigSchema = this.makeFetchConfigSchema()

    const schema = vine.compile(
      vine.object({
        name: vine.string().trim().minLength(3).maxLength(64),
        cronExpression: vine.any().optional(),
        isActive: vine.boolean(),
        fetchConfigs: vine.array(fetchConfigSchema),
        saveMappings: vine.array(
          vine.object({
            datasetId: vine.number().withoutDecimals().positive(),
            source: vine.string(),
          })
        ),
        params: this.makeParamsSchema(),
      })
    )

    const migration = await Migration.find(id)
    if (!migration) {
      return response.status(404).send({ error: 'Migration not found' })
    }

    try {
      const body = request.all()
      const data = await schema.validate(body)

      // Дополнительная проверка cronExpression и явное присвоение, если поле присутствует
      const hasCron = Object.prototype.hasOwnProperty.call(body, 'cronExpression')
      const rawCron = hasCron ? body.cronExpression : undefined
      if (hasCron && rawCron !== null && rawCron !== undefined) {
        const cronSchema = vine.compile(
          vine.object({
            cronExpression: cronExprSchema,
          })
        )
        await cronSchema.validate({ cronExpression: rawCron })
      }

      // Явно присваиваем поля, чтобы избежать TS-конфликта union по fetchConfigs
      const { fetchConfigs, ...rest } = data
      migration.merge(rest as any)
      migration.fetchConfigs = fetchConfigs as any
      if (hasCron) {
        migration.cronExpression = rawCron ?? null
      }
      await migration.save()

      return response.redirect(`/migrations/${migration.id}`)
    } catch (error: any) {
      console.log(error)
      const fieldErrors = this.mapVineErrors(error)
      return inertia.render('migrations/edit', { migration, errors: fieldErrors }, { status: 422 })
    }
  }

  async destroy({ request, response }: HttpContext) {
    try {
      const { ids } = await this.validateDeleteIds(request)
      const uniqueIds = Array.from(new Set(ids))

      // Проверяем, какие записи существуют и принадлежат текущему пользователю
      const existing = await Migration.query().whereIn('id', uniqueIds)

      const existingIds = existing.map((r) => r.id)
      const nonExistingIds = uniqueIds.filter((id) => !existingIds.includes(id))

      if (nonExistingIds.length > 0) {
        return response
          .status(422)
          .send({ error: `Migrations with IDs ${nonExistingIds.join(', ')} do not exist` })
      }

      await Migration.query().whereIn('id', uniqueIds).delete()

      return response.status(200).send({ message: 'Migrations deleted successfully' })
    } catch (error) {
      return response.status(500).send({ error: 'Internal server error' })
    }
  }

  async fetchConfigTest({ request }: HttpContext) {
    const fetchConfigSchema = this.makeFetchConfigSchema()

    const schema = vine.compile(
      vine.object({
        fetchConfigs: vine.array(fetchConfigSchema),
        params: this.makeParamsSchema(),
      })
    )

    const body = request.all()
    const data = await schema.validate(body)
    const params = this.normalizeParams(data.params)
    const fetchConfigs = this.normalizeFetchConfigs(data.fetchConfigs)

    const paramsService = new ParamsService()
    const fetchConfigService = new FetchConfigService()

    const paramsSource = paramsService.getSource(params)
    const initialResults: FetchConfigResult[] = [{ dataType: 'params', data: paramsSource }]

    // Получаем первый результат конечного конфига через AsyncGenerator.next()
    const generator = fetchConfigService.execute(fetchConfigs, initialResults)
    const { value, done } = await generator.next()
    if (done) {
      return { error: 'Нет данных' }
    }
    return value
  }

  /**
   * Преобразует ошибки Vine в { field: message }.
   * Добавляет префикс "config." для вложенных полей конфигурации.
   */
  private mapVineErrors(error: any): Record<string, string> {
    const fieldErrors: Record<string, string> = {}
    if (error?.messages && Array.isArray(error.messages)) {
      for (const e of error.messages) {
        if (!e.field || !e.message) continue
        const fieldName = String(e.field)
        switch (fieldName) {
          case 'name':
            fieldErrors[fieldName] = 'Укажите корректное имя'
            break
          case 'isActive':
            fieldErrors[fieldName] = 'Укажите корректную активность'
            break
          case 'cronExpression':
            fieldErrors[fieldName] = 'Укажите корректное расписание'
            break
          default:
            fieldErrors[fieldName] = 'Укажите корректное значение'
            break
        }
      }
    }
    return fieldErrors
  }
  /**
   * Валидация массива идентификаторов для удаления
   */
  private async validateDeleteIds(request: HttpContext['request']): Promise<{ ids: number[] }> {
    const schema = vine.compile(
      vine.object({
        ids: vine.array(vine.number().withoutDecimals().positive()).minLength(1),
      })
    )

    return schema.validate(request.only(['ids']))
  }

  /**
   * Преобразует (и аффинирует типы) массива конфигов из валидатора
   * в строго типизированный `FetchConfig[]` (дискриминированный union).
   */
  private normalizeFetchConfigs(items: any[]): FetchConfig[] {
    return items.map((c) => {
      switch (c?.type) {
        case 'sql': {
          const cfg: SqlConfig = {
            type: 'sql',
            id: String(c.id),
            params: { sourceId: Number(c.params?.sourceId), query: String(c.params?.query) },
          }
          return cfg
        }
        case 'sql_builder': {
          const cfg: SqlBuilderConfig = {
            type: 'sql_builder',
            id: String(c.id),
            params: {
              sourceId: Number(c.params?.sourceId),
              table: String(c.params?.table),
              alias: c.params?.alias ? String(c.params.alias) : undefined,
              selects: Array.isArray(c.params?.selects) ? c.params.selects : undefined,
              orders: Array.isArray(c.params?.orders) ? c.params.orders : undefined,
              joins: Array.isArray(c.params?.joins) ? c.params.joins : undefined,
              where: c.params?.where,
              hawing: c.params?.hawing,
              group: Array.isArray(c.params?.group) ? c.params.group : undefined,
            },
          }
          return cfg
        }
        case 'merge': {
          const cfg: MergeConfig = {
            type: 'merge',
            id: String(c.id),
            params: {
              datasetLeftId: String(c.params?.datasetLeftId),
              datasetRightId: String(c.params?.datasetRightId),
              on: Array.isArray(c.params?.on) ? c.params.on : [],
            },
          }
          return cfg
        }
        case 'modification': {
          const cfg: ModificationConfig = {
            type: 'modification',
            id: String(c.id),
            params: {
              datasetId: String(c.params?.datasetId),
              newColumns: Array.isArray(c.params?.newColumns) ? c.params.newColumns : undefined,
              dropColumns: Array.isArray(c.params?.dropColumns) ? c.params.dropColumns : undefined,
              renameColumns:
                c.params?.renameColumns && typeof c.params.renameColumns === 'object'
                  ? c.params.renameColumns
                  : undefined,
            },
          }
          return cfg
        }
        default:
          throw new Error(`Unknown fetch config type: ${String(c?.type)}`)
      }
    })
  }

  /**
   * Нормализует элементы params из валидатора в строго типизированный массив `Param[]`.
   */
  private normalizeParams(items: any[]): Param[] {
    return (Array.isArray(items) ? items : []).map((p) => {
      const key = String(p?.key)
      switch (p?.type) {
        case 'string':
          return { key, type: 'string', value: p?.value as string }
        case 'number':
          return { key, type: 'number', value: p?.value as number }
        case 'boolean':
          return { key, type: 'boolean', value: p?.value as boolean }
        case 'date':
          return { key, type: 'date', value: p?.value as DateParamValue }
        default:
          throw new Error(`Unknown param type: ${String(p?.type)}`)
      }
    })
  }

  /**
   * Схема массива параметров, используемая в теле миграции
   */
  private makeParamsSchema() {
    // DateOp schema
    const dateOpSchema = vine.object({
      amount: vine.number(),
      unit: vine.enum(['second', 'minute', 'hour', 'day', 'week', 'month', 'quarter', 'year']),
    })

    // DateParamValue variants
    const dateAddSchema = vine.object({
      type: vine.enum(['add']),
      ops: vine.array(dateOpSchema),
    })
    const dateSubtractSchema = vine.object({
      type: vine.enum(['subtract']),
      ops: vine.array(dateOpSchema),
    })
    const dateStartOfSchema = vine.object({
      type: vine.enum(['startOf']),
      unit: vine.enum(['day', 'week', 'month', 'quarter', 'year']),
      position: vine.enum(['current', 'next', 'previous']),
    })
    const dateEndOfSchema = vine.object({
      type: vine.enum(['endOf']),
      unit: vine.enum(['day', 'week', 'month', 'quarter', 'year']),
      position: vine.enum(['current', 'next', 'previous']),
    })
    const dateExactSchema = vine.object({
      type: vine.enum(['exact']),
      date: vine.string(),
    })

    const dateParamValueSchema = vine.union([
      vine.union.if((val) => (val as any)?.type === 'add', dateAddSchema),
      vine.union.if((val) => (val as any)?.type === 'subtract', dateSubtractSchema),
      vine.union.if((val) => (val as any)?.type === 'startOf', dateStartOfSchema),
      vine.union.if((val) => (val as any)?.type === 'endOf', dateEndOfSchema),
      vine.union.if((val) => (val as any)?.type === 'exact', dateExactSchema),
    ])

    // Base param with discriminant
    const baseParamSchema = vine.object({
      key: vine.string().trim(),
      type: vine.enum(['string', 'number', 'boolean', 'date']),
    })

    // Discrete union by `type`
    const paramSchema = baseParamSchema.merge(
      vine.group([
        vine.group.if((data) => data.type === 'string', {
          value: vine.string(),
        }),
        vine.group.if((data) => data.type === 'number', {
          value: vine.number(),
        }),
        vine.group.if((data) => data.type === 'boolean', {
          value: vine.boolean(),
        }),
        vine.group.if((data) => data.type === 'date', {
          value: dateParamValueSchema,
        }),
      ])
    )

    return vine.array(paramSchema)
  }

  /**
   * Построение схемы fetchConfig как дискретного union по полю `type`.
   * Принимает заранее определённые схемы `params` для каждого типа конфигурации.
   */
  private makeFetchConfigSchema() {
    // --- Detailed schemas for fetchConfigs params ---
    const whereFieldSchema = vine.object({
      key: vine.string(),
      value: vine.any().optional(),
      values: vine.array(vine.any()).optional(),
      op: vine.enum(['=', '!=', '<>', '>', '>=', '<', '<=', 'in', 'nin']).optional(),
    })

    // Без рекурсии (vine.lazy отсутствует): допускаем поля и одноуровневые $and/$or,
    // а для глубокой вложенности принимаем произвольную структуру.
    const whereSchema = vine.object({
      fields: vine.array(whereFieldSchema).optional(),
      $and: vine.record(vine.any()).optional(),
      $or: vine.record(vine.any()).optional(),
    })

    const joinOnSchema = vine.object({
      tableColumn: vine.string(),
      aliasColumn: vine.string(),
      operator: vine.enum(['=', '!=', '<', '<=', '>', '>=']),
      cond: vine.enum(['and', 'or']).optional(),
    })

    const joinSchema = vine.object({
      table: vine.string(),
      alias: vine.string().optional(),
      type: vine.enum(['inner', 'left', 'right', 'full']),
      on: vine.array(joinOnSchema),
    })

    const mergeOnSchema = vine.object({
      tableColumn: vine.string(),
      aliasColumn: vine.string(),
      operator: vine.enum(['=', '!=', '<', '<=', '>', '>=']),
      cond: vine.enum(['and', 'or']).optional(),
    })

    const sqlBuilderParamsSchema = vine.object({
      sourceId: vine.number(),
      table: vine.string(),
      alias: vine.string().optional(),
      selects: vine.array(vine.string()).optional(),
      orders: vine.array(vine.record(vine.enum(['asc', 'desc']))).optional(),
      joins: vine.array(joinSchema).optional(),
      where: whereSchema.optional(),
      hawing: whereSchema.optional(),
      group: vine.array(vine.string()).optional(),
    })

    const sqlParamsSchema = vine.object({
      sourceId: vine.number(),
      query: vine.string(),
    })

    const mergeParamsSchema = vine.object({
      datasetLeftId: vine.string(),
      datasetRightId: vine.string(),
      on: vine.array(mergeOnSchema),
    })

    // ColumnValue recursive union (template | expression | literal | reference | function)
    const columnTemplateSchema = vine.object({
      type: vine.enum(['template']),
      value: vine.string(),
    })
    const columnExpressionSchema = vine.object({
      type: vine.enum(['expression']),
      value: vine.string(),
    })
    const columnLiteralSchema = vine.object({
      type: vine.enum(['literal']),
      value: vine.union([
        vine.union.if((v) => typeof v === 'string', vine.string()),
        vine.union.if((v) => typeof v === 'number', vine.number()),
        vine.union.if((v) => typeof v === 'boolean', vine.boolean()),
      ]),
    })
    const columnReferenceSchema = vine.object({
      type: vine.enum(['reference']),
      value: vine.string(),
    })

    // Non-recursive ColumnValue for function args (exclude nested function to avoid recursion)
    const simpleColumnValueSchema = vine.union([
      vine.union.if((val) => (val as any)?.type === 'template', columnTemplateSchema),
      vine.union.if((val) => (val as any)?.type === 'expression', columnExpressionSchema),
      vine.union.if((val) => (val as any)?.type === 'literal', columnLiteralSchema),
      vine.union.if((val) => (val as any)?.type === 'reference', columnReferenceSchema),
    ])

    const columnFunctionSchema = vine.object({
      type: vine.enum(['function']),
      name: vine.string(),
      args: vine.array(simpleColumnValueSchema),
    })

    const columnValueSchema = vine.union([
      vine.union.if((val) => (val as any)?.type === 'template', columnTemplateSchema),
      vine.union.if((val) => (val as any)?.type === 'expression', columnExpressionSchema),
      vine.union.if((val) => (val as any)?.type === 'literal', columnLiteralSchema),
      vine.union.if((val) => (val as any)?.type === 'reference', columnReferenceSchema),
      vine.union.if((val) => (val as any)?.type === 'function', columnFunctionSchema),
    ])

    const modificationParamsSchema = vine.object({
      datasetId: vine.string(),
      newColumns: vine.array(columnValueSchema).optional(),
      dropColumns: vine.array(vine.string()).optional(),
      renameColumns: vine.record(vine.string()).optional(),
    })

    return vine
      .object({
        id: vine.string(),
        type: vine.enum(['sql', 'sql_builder', 'merge', 'modification']),
      })
      .merge(
        vine.group([
          vine.group.if((data) => data.type === 'sql', {
            params: sqlParamsSchema,
          }),
          vine.group.if((data) => data.type === 'sql_builder', {
            params: sqlBuilderParamsSchema,
          }),
          vine.group.if((data) => data.type === 'merge', {
            params: mergeParamsSchema,
          }),
          vine.group.if((data) => data.type === 'modification', {
            params: modificationParamsSchema,
          }),
        ])
      )
  }
}

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
import MigrationRun from '#models/migration_run'
import MigrationRunnerService, { RunPayload } from '#services/migration_runner_service'
import logger from '@adonisjs/core/services/logger'

export default class MigrationsController {
  async index({ inertia, request }: HttpContext) {
    const page = Number(request.input('page') || 1)
    const perPage = Number(request.input('perPage') || 10)
    const migrations = await Migration.query()
      .orderBy('createdAt', 'desc')
      .orderBy('id', 'desc')
      .paginate(page, perPage)

    return inertia.render('migrations/home', {
      migrations,
    })
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

    const schema = vine.compile(
      vine.object({
        name: vine.string().trim().minLength(3).maxLength(64),
        cronExpression: vine.any().optional(),
        isActive: vine.boolean(),
        fetchConfigs: vine.array(this.makeFetchConfigSchema()),
        // Validate SaveMapping[] according to app/interfaces/save_mapping.ts
        saveMappings: vine.array(this.makeSaveMappingSchema()),
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
      // Опциональный редирект после удаления (для Inertia-визитов из страниц редактирования)
      const redirectTo = String(request.input('redirectTo') || '')
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

      // Если явно указали куда перейти — делаем редирект, чтобы Inertia выполнил визит
      if (redirectTo) return response.redirect(redirectTo)
      // По умолчанию — редиректим на список миграций, чтобы избежать показа JSON-ответа в браузере
      return response.redirect('/migrations')
    } catch (error) {
      return response.status(500).send({ error: 'Internal server error' })
    }
  }

  async fetchConfigTest({ request }: HttpContext) {
    try {
      const fetchConfigSchema = this.makeFetchConfigSchema()

      const schema = vine.compile(
        vine.object({
          fetchConfigs: vine.array(fetchConfigSchema),
          params: this.makeParamsSchema(),
          pages: vine.record(vine.number()).optional(),
        })
      )

      const body = request.all()
      const data = await schema.validate(body)
      const params = this.normalizeParams(data.params)
      const fetchConfigsBase = this.normalizeFetchConfigs(data.fetchConfigs)
      const fetchConfigs = this.applyPreviewPages(fetchConfigsBase, data.pages || {})

      const paramsService = new ParamsService()
      const fetchConfigService = new FetchConfigService()

      const paramsSource = paramsService.getSource(params)
      const initialResults: FetchConfigResult[] = [{ dataType: 'params', data: paramsSource }]
      if (fetchConfigs.length === 0) {
        return initialResults
      }

      // Получаем первый результат конечного конфига через AsyncGenerator.next()
      const generator = fetchConfigService.execute(fetchConfigs, initialResults)
      const { value, done } = await generator.next()
      if (done) {
        return { error: 'Нет данных' }
      }
      return value
    } catch (error: any) {
      return { error: error.message }
    }
  }

  async run({ request }: HttpContext) {
    const schema = vine.compile(
      vine.object({
        id: vine.number().positive(),
        fetchConfigs: vine.array(this.makeFetchConfigSchema()),
        saveMappings: vine.array(this.makeSaveMappingSchema()),
        params: this.makeParamsSchema(),
        channelId: vine.string().optional(),
      })
    )

    const body = request.all()
    const data = await schema.validate(body)
    const normalized: RunPayload = {
      id: Number(data.id),
      fetchConfigs: this.normalizeFetchConfigs(data.fetchConfigs),
      saveMappings: Array.isArray(data.saveMappings) ? data.saveMappings : [],
      params: this.normalizeParams(data.params),
      trigger: 'manual',
    }

    // Запускаем миграцию в фоне (с безопасной обработкой ошибок, чтобы приложение не падало)
    void (async () => {
      const runner = new MigrationRunnerService()
      try {
        await runner.run(normalized)
        logger.info(`Migration ${normalized.id} completed`)
      } catch (e: any) {
        // Логируем ошибку, но не пробрасываем её дальше — чтобы избежать фатального падения
        const msg = e?.message || String(e)
        logger.error(`Migration ${normalized.id} failed: ${msg}`)
      }
    })()

    // Быстрый ответ REST-запуска
    return { started: true, id: normalized.id }
  }

  /**
   * Запуск миграции по её ID, используя сохранённые конфиги
   * Удобно для быстрого запуска из списка без передачи всей конфигурации
   */
  async runById({ request, response }: HttpContext) {
    const rawId = request.input('id')
    const id = Number(rawId)
    if (!Number.isFinite(id) || id <= 0) {
      return response.status(422).send({ error: 'Invalid id' })
    }

    void (async () => {
      const runner = new MigrationRunnerService()
      try {
        await runner.runById(id, 'manual')
        logger.info(`Migration ${id} completed`)
      } catch (e: any) {
        const msg = e?.message || String(e)
        logger.error(`Migration ${id} failed: ${msg}`)
      }
    })()

    return response.ok({ started: true, id })
  }

  async stop({ request, response }: HttpContext) {
    const migrationId = String(request.input('migrationId') || '')
    const trigger = String(request.input('trigger') || 'manual')
    if (!migrationId) {
      response.status(400)
      return response.send({ error: 'Missing migrationId' })
    }

    const lastRun = await MigrationRun.query()
      .where('migrationId', migrationId)
      .where('status', 'running')
      .where('trigger', trigger)
      .orderBy('createdAt', 'desc')
      .first()

    if (!lastRun) {
      return response
        .status(404)
        .send({ error: `Migration not running with trigger ${trigger}`, migrationId })
    }

    await lastRun.merge({ status: 'canceled' })
    await lastRun.save()

    return response.ok({ stopped: true, migrationId, trigger })
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
  private normalizeFetchConfigs(items: unknown[]): FetchConfig[] {
    const list = Array.isArray(items) ? (items as any[]) : []
    return list.map((c: any) => {
      switch (c?.type as string) {
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
   * Применяет предпросмотрные номера страниц для sql/sql_builder, не изменяя сохранённый конфиг.
   */
  private applyPreviewPages(configs: FetchConfig[], pages: Record<string, number>): FetchConfig[] {
    return configs.map((cfg) => {
      const page = pages[cfg.id]
      if (!page || page < 1) return cfg
      if (cfg.type === 'sql' || cfg.type === 'sql_builder') {
        return { ...cfg, page: Number(page) } as any
      }
      return cfg
    })
  }

  /**
   * Нормализует элементы params из валидатора в строго типизированный массив `Param[]`.
   */
  private normalizeParams(items: unknown[]): Param[] {
    const list = Array.isArray(items) ? (items as any[]) : []
    return list.map((p: any) => {
      const key = String(p?.key)
      switch (p?.type as string) {
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
   * Построение схемы SaveMapping согласно app/interfaces/save_mapping.ts
   */
  private makeSaveMappingSchema() {
    const updateOnSchema = vine.object({
      tableColumn: vine.string().trim(),
      aliasColumn: vine.string().trim(),
      operator: vine.enum(['=', '!=', '<', '<=', '>', '>=']),
      cond: vine.enum(['and', 'or']).optional(),
    })

    return vine.object({
      id: vine.string().trim(),
      sourceId: vine.number().withoutDecimals().positive(),
      table: vine.string().trim(),
      savedMapping: vine.array(
        vine.object({
          tableColumn: vine.string().trim(),
          resultColumn: vine.string().trim(),
        })
      ),
      updateOn: vine.array(updateOnSchema),
    })
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

    // Поддержать как прежний формат значений, так и новый формат { name, value }
    const columnSpecSchema = vine.union([
      // Старый формат: просто ColumnValue
      vine.union.if((val) => (val as any)?.type === 'template', columnTemplateSchema),
      vine.union.if((val) => (val as any)?.type === 'expression', columnExpressionSchema),
      vine.union.if((val) => (val as any)?.type === 'literal', columnLiteralSchema),
      vine.union.if((val) => (val as any)?.type === 'reference', columnReferenceSchema),
      vine.union.if((val) => (val as any)?.type === 'function', columnFunctionSchema),
      // Новый формат: объект с именем и значением
      vine.union.if(
        (val) => vine.helpers.isObject(val) && 'value' in (val as any),
        vine.object({
          name: vine.string().optional(),
          value: columnValueSchema,
        })
      ),
    ])

    const modificationParamsSchema = vine.object({
      datasetId: vine.string(),
      newColumns: vine.array(columnSpecSchema).optional(),
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

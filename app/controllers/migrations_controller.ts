import DataSource from '#models/data_source'
import Migration from '#models/migration'
import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'

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
    const fetchConfigSchema = vine
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
        params: vine.array(
          vine.object({
            key: vine.string().trim(),
            type: vine.enum(['string', 'number', 'boolean', 'date']),
            // Значение может отсутствовать в payload (undefined не сериализуется в JSON)
            value: vine.any().optional(),
          })
        ),
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

  async storeFetchConfig({}: HttpContext) {
    // TODO: Add validation
  }

  async updateFetchConfig({}: HttpContext) {
    // TODO: Add validation
  }

  async destroyFetchConfig({}: HttpContext) {
    // TODO: Add validation
  }

  async updateSaveMapping({}: HttpContext) {
    // TODO: Add validation
  }

  async storeSaveMapping({}: HttpContext) {
    // TODO: Add validation
  }

  async destroySaveMapping({}: HttpContext) {
    // TODO: Add validation
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
}

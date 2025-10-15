import DataSource from '#models/data_source'
import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'

export default class DataSourcesController {
  /**
   * Display a list of resource
   */
  async index({ inertia }: HttpContext) {
    return inertia.render('sources/index', {
      dataSources: await DataSource.all(),
    })
  }

  async store({ request, auth, response }: HttpContext) {
    try {
      const { basePayload, configPayload } = await this.validateAndNormalize(request)

      // TODO: перед записью проверить подключение с источником данных
      // Если не получится подключиться выдать ошибку

      await DataSource.create({
        name: basePayload.name,
        type: basePayload.type,
        config: configPayload,
        userId: auth.user?.id,
      })

      return response.redirect('/sources')
    } catch (error: any) {
      const fieldErrors = this.mapVineErrors(error)
      return response.status(422).send({ errors: fieldErrors })
    }
  }

  /**
   * Валидирует базовые поля и конфиг по типу источника,
   * а также нормализует значения конфига (host/port).
   */
  private async validateAndNormalize(request: HttpContext['request']) {
    // Валидация базовых полей (name, type)
    const baseSchema = vine.compile(
      vine.object({
        name: vine.string().trim().minLength(3).maxLength(64),
        type: vine.enum(['mysql', 'postgres', 'sqlite']),
      })
    )

    // Схемы конфигурации для разных типов источников
    const sqlConfigSchema = vine.object({
      host: vine.string().trim().minLength(3).maxLength(64),
      port: vine.number().withoutDecimals().min(1).max(65535),
      database: vine.string().trim().minLength(1).maxLength(64),
      username: vine.string().trim().minLength(1).maxLength(64),
      password: vine.string().trim().minLength(1).maxLength(64),
    })
    const sqliteConfigSchema = vine.object({
      file: vine.string().trim().minLength(1),
    })

    // Валидируем базовые поля
    const basePayload = await baseSchema.validate(request.all())

    // Подготавливаем и нормализуем конфиг из запроса
    const rawConfig = (request.input('config') || {}) as Record<string, unknown>
    if (basePayload.type !== 'sqlite' && rawConfig.port !== undefined) {
      const num = Number(rawConfig.port)
      rawConfig.port = Number.isFinite(num) ? num : rawConfig.port
    }

    if (rawConfig.host === undefined) {
      rawConfig.host = 'localhost'
    }

    if (rawConfig.port === undefined) {
      if (basePayload.type === 'mysql') {
        rawConfig.port = 3306
      } else if (basePayload.type === 'postgres') {
        rawConfig.port = 5432
      }
    }

    // Валидируем конфиг по типу источника
    const compiledConfigSchema = vine.compile(
      basePayload.type === 'sqlite' ? sqliteConfigSchema : sqlConfigSchema
    )
    const configPayload = await compiledConfigSchema.validate(rawConfig)

    return { basePayload, configPayload }
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
        const prefixed = ['host', 'port', 'database', 'username', 'password', 'file'].includes(
          fieldName
        )
          ? `config.${fieldName}`
          : fieldName
        fieldErrors[prefixed] = String(e.message)
      }
    }
    return fieldErrors
  }
}

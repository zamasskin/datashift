import DataSource from '#models/data_source'
import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import path from 'node:path'
import { mkdir, unlink } from 'node:fs/promises'
import app from '@adonisjs/core/services/app'

export default class DataSourcesController {
  /**
   * Display a list of resource
   */
  async index({ inertia }: HttpContext) {
    const dataSources = await DataSource.query().preload('user')

    return inertia.render('sources/index', {
      dataSources,
    })
  }

  /**
   * Массовое удаление источников данных по массиву ID
   */
  async destroy({ request, auth, response }: HttpContext) {
    try {
      const { ids } = await this.validateDeleteIds(request)
      const uniqueIds = Array.from(new Set(ids))

      // Проверяем, какие записи существуют и принадлежат текущему пользователю
      const existing = await DataSource.query()
        .whereIn('id', uniqueIds)
        .andWhere('user_id', auth.user!.id)

      const existingIds = existing.map((r) => r.id)

      // Безопасно удаляем файлы SQLite, относящиеся к источникам
      const dataRoot = app.makePath('data')
      for (const ds of existing) {
        if (ds.type === 'sqlite') {
          const fileVal = ds.config?.file
          if (!fileVal || typeof fileVal !== 'string') continue

          const absFile = path.isAbsolute(fileVal) ? fileVal : app.makePath(fileVal)
          const rel = path.relative(dataRoot, absFile)
          const insideDataDir = rel && !rel.startsWith('..') && !path.isAbsolute(rel)

          if (insideDataDir) {
            const candidates = [absFile, `${absFile}-wal`, `${absFile}-shm`, `${absFile}-journal`]
            for (const p of candidates) {
              try {
                await unlink(p)
              } catch (err: any) {
                // Игнорируем отсутствие файла/директорий, остальные ошибки не блокируют процесс
                if (!err || (err.code !== 'ENOENT' && err.code !== 'EISDIR')) {
                  // Можно залогировать при необходимости
                }
              }
            }
          }
        }
      }

      await DataSource.query().whereIn('id', existingIds).delete()

      return response.redirect('/sources')
    } catch (error: any) {
      const fieldErrors = this.mapVineErrors(error)
      return response.status(422).send({ errors: fieldErrors })
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

  async store({ request, auth, response }: HttpContext) {
    try {
      const { basePayload, configPayload } = await this.validateAndNormalize(request)

      // Проверяем подключение к источнику данных до сохранения
      try {
        await this.checkConnection(basePayload.type, configPayload)
      } catch (connError) {
        const connErrors = this.mapConnectionErrors(connError, basePayload.type)
        return response.status(422).send({ errors: connErrors })
      }

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
    // Специальная нормализация пути для SQLite: сохраняем в папке "data/"
    if (basePayload.type === 'sqlite') {
      const fileStr = String(rawConfig.file || '').trim()
      if (fileStr) {
        if (fileStr.startsWith('./data/')) {
          rawConfig.file = fileStr.replace('./', '')
        } else if (!fileStr.startsWith('data/') && !fileStr.startsWith('/')) {
          rawConfig.file = `data/${fileStr}`
        }
      }
    }

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

  /**
   * Проверяет подключение к источнику данных по типу и конфигу.
   * Бросает исключение при ошибке подключения.
   */
  private async checkConnection(type: string, config: any): Promise<void> {
    if (type === 'sqlite') {
      const sqlite3Module = await import('sqlite3')
      const sqlite3 = sqlite3Module.default

      // Гарантируем наличие директории, где будет лежать файл БД
      const filePath = String(config.file)
      await mkdir(path.dirname(filePath), { recursive: true })

      await new Promise<void>((resolve, reject) => {
        const db = new sqlite3.Database(
          filePath,
          sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
          (err: Error | null) => {
            if (err) return reject(err)
            db.close((closeErr: Error | null) => {
              if (closeErr) return reject(closeErr)
              resolve()
            })
          }
        )
      })
      return
    }

    if (type === 'mysql') {
      const mysql = await import('mysql2/promise')
      const connection = await mysql.createConnection({
        host: String(config.host),
        port: Number(config.port),
        user: String(config.username),
        password: String(config.password),
        database: String(config.database),
        connectTimeout: 3000,
      })
      try {
        await connection.query('SELECT 1')
      } finally {
        await connection.end()
      }
      return
    }

    if (type === 'postgres') {
      const pgModule = await import('pg')
      const { Client } = pgModule as any
      const client = new Client({
        host: String(config.host),
        port: Number(config.port),
        user: String(config.username),
        password: String(config.password),
        database: String(config.database),
        connectionTimeoutMillis: 3000,
      })
      await client.connect()
      try {
        await client.query('SELECT 1')
      } finally {
        await client.end()
      }
      return
    }

    throw new Error('Unsupported data source type')
  }

  /**
   * Возвращает дружественные сообщения ошибок для проблем подключения.
   */
  private mapConnectionErrors(error: any, type: string): Record<string, string> {
    const msg = (error?.message && String(error.message)) || 'Не удалось подключиться'
    const code = String(error?.code || error?.errno || '')

    // Базовые сообщения по типам
    if (type === 'sqlite') {
      return {
        'config.file': 'Не удалось открыть файл SQLite. Проверьте путь и права доступа.',
      }
    }

    // Для SQL баз пытаемся дать подсказку
    if (code === 'ECONNREFUSED') {
      return { 'config.host': 'Подключение отклонено. Проверьте host/port и доступность сервера.' }
    }
    if (code === 'ENOTFOUND') {
      return { 'config.host': 'Хост не найден. Проверьте имя хоста.' }
    }
    if (code === 'ETIMEDOUT') {
      return { 'config.host': 'Таймаут подключения. Проверьте сеть и порт.' }
    }
    // MySQL: неверные учётные данные
    if (code === 'ER_ACCESS_DENIED_ERROR') {
      return { 'config.username': 'Неверные имя пользователя или пароль.' }
    }
    // Postgres: неверный пароль
    if (code === '28P01') {
      return { 'config.username': 'Неверные имя пользователя или пароль.' }
    }
    // Postgres: база не существует
    if (code === '3D000') {
      return { 'config.database': 'База данных не существует.' }
    }

    // По умолчанию — показать общий текст у поля host
    return { 'config.host': `Ошибка подключения: ${msg}` }
  }
}

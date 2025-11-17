import DataSource from '#models/data_source'
import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import path from 'node:path'
import { mkdir, unlink, rename as fsRename } from 'node:fs/promises'
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
  async destroy({ request, response, inertia }: HttpContext) {
    try {
      const { ids } = await this.validateDeleteIds(request)
      const uniqueIds = Array.from(new Set(ids))

      // Проверяем, какие записи существуют и принадлежат текущему пользователю
      const existing = await DataSource.query().whereIn('id', uniqueIds)

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
      const dataSources = await DataSource.query().preload('user')
      return inertia.render('sources/index', { dataSources, errors: fieldErrors }, { status: 422 })
    }
  }

  /**
   * Обновление источника данных
   */
  async update({ params, request, response, inertia }: HttpContext) {
    const id = Number(params.id)
    try {
      if (!Number.isFinite(id)) {
        return response.redirect('/sources')
      }

      const { basePayload, configPayload } = await this.validateAndNormalize(request)

      // Ищем запись ДО проверки подключения, чтобы при необходимости выполнить перенос файла
      const ds = await DataSource.query().where('id', id).first()

      if (!ds) {
        return response.redirect('/sources')
      }

      // Если это sqlite → sqlite и путь к файлу изменился, переносим файл и сайдкары
      if (ds.type === 'sqlite' && basePayload.type === 'sqlite') {
        const oldFileVal = ds.config?.file
        const newFileVal = (configPayload as any)?.file
        if (
          typeof oldFileVal === 'string' &&
          typeof newFileVal === 'string' &&
          oldFileVal !== newFileVal
        ) {
          const dataRoot = app.makePath('data')
          const absOld = path.isAbsolute(oldFileVal) ? oldFileVal : app.makePath(oldFileVal)
          const absNew = path.isAbsolute(newFileVal) ? newFileVal : app.makePath(newFileVal)

          const relOld = path.relative(dataRoot, absOld)
          const relNew = path.relative(dataRoot, absNew)
          const oldInside = relOld && !relOld.startsWith('..') && !path.isAbsolute(relOld)
          const newInside = relNew && !relNew.startsWith('..') && !path.isAbsolute(relNew)

          if (oldInside && newInside) {
            await mkdir(path.dirname(absNew), { recursive: true })

            // Подготовим список файлов к переносу: основной и возможные sidecar
            const fromFiles = [absOld, `${absOld}-wal`, `${absOld}-shm`, `${absOld}-journal`]
            const toFiles = [absNew, `${absNew}-wal`, `${absNew}-shm`, `${absNew}-journal`]

            for (const [i, src] of fromFiles.entries()) {
              const dst = toFiles[i]
              try {
                // Если целевой уже существует (напр., был создан при проверке), удалим его
                try {
                  await unlink(dst)
                } catch (e: any) {
                  // игнорируем ENOENT
                }
                await fsRename(src, dst)
              } catch (err: any) {
                // Если исходник отсутствует — это нормально для sidecar-файлов
                if (!err || err.code !== 'ENOENT') {
                  // Любые другие ошибки переноса считаем критичными и прерываем
                  {
                    const dataSources = await DataSource.query().preload('user')
                    return inertia.render(
                      'sources/index',
                      {
                        dataSources,
                        errors: {
                          'config.file':
                            'Не удалось переименовать файл SQLite. Проверьте права доступа.',
                        },
                        editId: id,
                      },
                      { status: 422 }
                    )
                  }
                }
              }
            }
          }
        }
      }

      // Проверяем подключение к источнику данных после возможного переноса
      try {
        await this.checkConnection(basePayload.type, configPayload)
      } catch (connError) {
        const connErrors = this.mapConnectionErrors(connError, basePayload.type)
        const dataSources = await DataSource.query().preload('user')
        return inertia.render(
          'sources/index',
          { dataSources, errors: connErrors, editId: id },
          { status: 422 }
        )
      }

      ds.merge({ name: basePayload.name, type: basePayload.type, config: configPayload })
      await ds.save()

      return response.redirect('/sources')
    } catch (error: any) {
      const fieldErrors = this.mapVineErrors(error)
      const dataSources = await DataSource.query().preload('user')
      return inertia.render(
        'sources/index',
        { dataSources, errors: fieldErrors, editId: id },
        { status: 422 }
      )
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

  async store({ request, auth, response, inertia }: HttpContext) {
    try {
      const { basePayload, configPayload } = await this.validateAndNormalize(request)

      // Проверяем подключение к источнику данных до сохранения
      try {
        await this.checkConnection(basePayload.type, configPayload)
      } catch (connError) {
        const connErrors = this.mapConnectionErrors(connError, basePayload.type)
        const dataSources = await DataSource.query().preload('user')
        return inertia.render(
          'sources/index',
          { dataSources, errors: connErrors, newOpen: true },
          { status: 422 }
        )
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
      const dataSources = await DataSource.query().preload('user')
      return inertia.render(
        'sources/index',
        { dataSources, errors: fieldErrors, newOpen: true },
        { status: 422 }
      )
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

import DataSource from '#models/data_source'
import { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import path from 'node:path'

export default class DatasetsController {
  async index({ inertia }: HttpContext) {
    const dataSources = await DataSource.query().preload('user')
    return inertia.render('datasets/index', {
      dataSources,
    })
  }

  /**
   * Выполнение (тест) SQL-запроса для выбранного источника данных.
   * Возвращает { rows, columns } или { error } при ошибке.
   */
  async testSql({ request, response }: HttpContext) {
    console.log('step 1')
    const payload: {
      dataSourceId: number
      sql: string
      params?: Array<{ key?: string; type: string; value: string }>
      limit?: number
      offset?: number
    } = {
      dataSourceId: Number(request.input('dataSourceId')),
      sql: String(request.input('sql') || ''),
      params: Array.isArray(request.input('params')) ? (request.input('params') as any) : [],
      limit: request.input('limit') as any,
      offset: request.input('offset') as any,
    }

    console.log('step 2')
    const ds = await DataSource.find(payload.dataSourceId)
    if (!ds) {
      return response.status(404).send({ error: 'Источник данных не найден' })
    }

    console.log('step 3')

    try {
      console.log('execute sql', payload.sql)
      const { rows, columns } = await this.executeSql(
        ds.type,
        ds.config,
        payload.sql,
        payload.params || [],
        typeof payload.limit === 'number' ? payload.limit : 5,
        typeof payload.offset === 'number' ? payload.offset : 5
      )
      return response.send({ rows, columns })
    } catch (e: any) {
      console.log('ERROR!!', e)
      const message = e?.message ? String(e.message) : String(e)
      return response.status(400).send({ error: message })
    }
  }

  private castParams(
    params: Array<{ key?: string; type: string; value: string }>,
    forDriver: 'sqlite' | 'mysql' | 'postgres'
  ) {
    const cast = (type: string, value: string) => {
      switch (type) {
        case 'number':
          return Number(value)
        case 'boolean':
          return value === 'true' || value === '1'
        case 'date':
        case 'datetime':
          // Передаём как Date для драйверов, которые поддерживают
          const d = new Date(value)
          return Number.isNaN(d.getTime()) ? value : d
        case 'json':
          try {
            return JSON.parse(value)
          } catch {
            return value
          }
        case 'string':
        default:
          return value
      }
    }

    // По умолчанию возвращаем позиционный массив значений
    const arr = params.map((p) => cast(p.type, p.value))

    // Для sqlite попробуем поддержать именованные плейсхолдеры, если они есть в SQL
    if (forDriver === 'sqlite') {
      const hasNamed = /[:@$][a-zA-Z_][a-zA-Z0-9_]*/.test((params as any)?.sql || '')
      // Примечание: выше не знаем SQL. Оставляем массив. Именованные плейсхолдеры можно будет
      // сформировать на основе ключей при необходимости, но здесь придерживаемся массивов.
      // Если понадобится объект: const obj = Object.fromEntries(params.map((p,i)=>[p.key||`p${i+1}`, cast(p.type,p.value)]))
      // return obj
    }

    return arr
  }

  private async executeSql(
    type: string,
    config: any,
    sql: string,
    params: Array<{ key?: string; type: string; value: string }>,
    limit?: number,
    offset?: number
  ): Promise<{ rows: Array<Record<string, any>>; columns?: string[] }> {
    if (!sql || !String(sql).trim()) {
      throw new Error('SQL не может быть пустым')
    }

    const normalizedSql = String(sql)
      .trim()
      .replace(/;+\s*$/, '')
    const lim = Math.max(0, Number(limit ?? 0))
    const off = Math.max(0, Number(offset ?? 0))
    const wrappedSql =
      lim > 0 || off > 0
        ? `SELECT * FROM (${normalizedSql}) AS sub ${lim > 0 ? `LIMIT ${lim}` : ''} ${
            off > 0 ? `OFFSET ${off}` : ''
          }`
            .replace(/\s{2,}/g, ' ')
            .trim()
        : normalizedSql

    if (type === 'sqlite') {
      const sqlite3Module = await import('sqlite3')
      const sqlite3 = sqlite3Module.default
      const fileVal = String(config?.file || '')
      const absFile = path.isAbsolute(fileVal) ? fileVal : app.makePath(fileVal)

      await new Promise<void>((resolve, reject) => {
        const db = new sqlite3.Database(
          absFile,
          sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
          (err) => {
            if (err) return reject(err)
            resolve()
          }
        )
        db.close()
      })

      const rows = await new Promise<Array<Record<string, any>>>((resolve, reject) => {
        const db = new sqlite3.Database(absFile, sqlite3.OPEN_READWRITE)
        const casted = this.castParams(params, 'sqlite')
        db.all(wrappedSql, casted as any, (err: any, res: any[]) => {
          if (err) {
            db.close()
            return reject(err)
          }
          db.close()
          resolve(res || [])
        })
      })
      const columns = (() => {
        const set = new Set<string>()
        rows.forEach((r) => Object.keys(r || {}).forEach((k) => set.add(k)))
        return Array.from(set)
      })()
      return { rows, columns }
    }

    if (type === 'mysql') {
      const mysql = await import('mysql2/promise')
      const connection = await mysql.createConnection({
        host: String(config?.host),
        port: Number(config?.port),
        user: String(config?.username),
        password: String(config?.password),
        database: String(config?.database),
        connectTimeout: 3000,
      })
      try {
        const casted = this.castParams(params, 'mysql')
        const [rows, fields] = await connection.execute(wrappedSql, casted as any)
        const columns = Array.isArray(fields)
          ? (fields as any[]).map((f: any) => f?.name).filter(Boolean)
          : undefined
        return { rows: (rows as any[]) || [], columns }
      } finally {
        await connection.end()
      }
    }

    if (type === 'postgres') {
      const pg = await import('pg')
      const client = new pg.Client({
        host: String(config?.host),
        port: Number(config?.port),
        user: String(config?.username),
        password: String(config?.password),
        database: String(config?.database),
        connectionTimeoutMillis: 3000,
      })
      await client.connect()
      try {
        const casted = this.castParams(params, 'postgres')
        const res = await client.query(wrappedSql, casted as any)
        const columns = Array.isArray(res?.fields)
          ? res.fields.map((f: any) => f?.name).filter(Boolean)
          : undefined
        return { rows: (res?.rows as any[]) || [], columns }
      } finally {
        await client.end()
      }
    }

    throw new Error(`Тип источника не поддерживается: ${type}`)
  }
}

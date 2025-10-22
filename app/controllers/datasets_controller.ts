import DataSource from '#models/data_source'
import { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import path from 'node:path'
import _ from 'lodash'
import mustache from 'mustache'

export interface SqlDataset {
  type: 'sql'
  value: string
  variables: string[]
  dataSourceId: number
}

interface MergeDataset {
  type: 'merge'
  rules: any[]
}

type DatasetItem = SqlDataset | MergeDataset
export type Dataset = DatasetItem & {
  name: string
  fields?: string[]
}

type TestDataset = {
  limit?: number
  offset?: number
  datasets: Dataset[]
}

export default class DatasetsController {
  async index({ inertia }: HttpContext) {
    const dataSources = await DataSource.query().preload('user')
    return inertia.render('datasets/index', {
      dataSources,
    })
  }

  async testDataset({ request, response }: HttpContext) {
    const payload = request.body() as TestDataset
    const datasets = payload.datasets

    let mustacheConfig: Record<string, any> = {}
    let fields: string[] = []

    // Подумать как исправить сбор полей
    const parseVariables = (variables: string[]) => {
      return variables.map((v) => {
        const trimmed = v.trim()
        if (trimmed.startsWith('{{') && trimmed.endsWith('}}')) {
          const key = trimmed.slice(2, -2)
          return _.get(mustacheConfig, key)
        }
        if (trimmed.includes('{{') && trimmed.includes('}}')) {
          return mustache.render(trimmed, mustacheConfig)
        }
        return trimmed
      })
    }

    try {
      for (const dataset of datasets) {
        if (dataset.type === 'sql') {
          mustacheConfig[dataset.name] = {}
          const ds = await DataSource.find(dataset.dataSourceId)
          if (!ds) {
            throw new Error('Источник данных не выбран')
          }

          const variables = parseVariables(dataset.variables || [])

          const { rows = [], columns = [] } = await this.executeSql(
            ds.type,
            ds.config,
            dataset.value,
            variables,
            payload?.limit || 500,
            payload?.offset || 0
          )

          for (const col of columns) {
            mustacheConfig[dataset.name][col] = []
            for (const row of rows) {
              mustacheConfig[dataset.name][col].push(row[col])
            }
          }

          fields = columns
        }
      }

      return response.send({ fields })
    } catch (e: any) {
      console.log('ERROR!!', e)
      const message = e?.message ? String(e.message) : String(e)
      return response.status(400).send({ error: message })
    }
  }

  /**
   * Выполнение (тест) SQL-запроса для выбранного источника данных.
   * Возвращает { rows, columns } или { error } при ошибке.
   */
  async testSql({ request, response }: HttpContext) {
    const payload: {
      dataSourceId: number
      sql: string
      variables?: string[]
      limit?: number
      offset?: number
    } = {
      dataSourceId: Number(request.input('dataSourceId')),
      sql: String(request.input('sql') || ''),
      variables: request.input('variables') as string[],
      limit: request.input('limit') as any,
      offset: request.input('offset') as any,
    }

    const ds = await DataSource.find(payload.dataSourceId)
    if (!ds) {
      return response.status(404).send({ error: 'Источник данных не найден' })
    }

    try {
      const { rows, columns } = await this.executeSql(
        ds.type,
        ds.config,
        payload.sql,
        payload.variables,
        typeof payload.limit === 'number' ? payload.limit : 500,
        typeof payload.offset === 'number' ? payload.offset : 0
      )

      return response.send({ rows, columns })
    } catch (e: any) {
      console.log('ERROR!!', e)
      const message = e?.message ? String(e.message) : String(e)
      return response.status(400).send({ error: message })
    }
  }

  private async executeSql(
    type: string,
    config: any,
    sql: string,
    variables?: string[],
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
        db.all(wrappedSql, variables, (err: any, res: any[]) => {
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
        const [rows, fields] = await connection.execute(wrappedSql, variables)
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
        const res = await client.query(wrappedSql, variables)
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

  /**
   * Возвращает список таблиц для указанного источника данных
   */
  async listTables({ request, response }: HttpContext) {
    const payload = {
      dataSourceId: Number(request.input('dataSourceId')),
      schema: String(request.input('schema') || ''),
    }

    const ds = await DataSource.find(payload.dataSourceId)
    if (!ds) {
      return response.status(404).send({ error: 'Источник данных не найден' })
    }

    try {
      if (ds.type === 'sqlite') {
        const sqlite3Module = await import('sqlite3')
        const sqlite3 = sqlite3Module.default
        const fileVal = String(ds.config?.file || '')
        const absFile = path.isAbsolute(fileVal) ? fileVal : app.makePath(fileVal)

        // Убедимся, что файл существует/доступен
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

        const rows = await new Promise<Array<{ name: string }>>((resolve, reject) => {
          const db = new sqlite3.Database(absFile, sqlite3.OPEN_READWRITE)
          db.all(
            "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
            [],
            (err: any, res: any[]) => {
              if (err) {
                db.close()
                return reject(err)
              }
              db.close()
              resolve(res || [])
            }
          )
        })
        const tables = rows.map((r) => r.name).filter(Boolean)
        return response.send({ tables })
      }

      if (ds.type === 'mysql') {
        const mysql = await import('mysql2/promise')
        const connection = await mysql.createConnection({
          host: String(ds.config?.host),
          port: Number(ds.config?.port),
          user: String(ds.config?.username),
          password: String(ds.config?.password),
          database: String(ds.config?.database),
          connectTimeout: 3000,
        })
        try {
          const [rows] = await connection.execute(
            'SELECT TABLE_NAME AS table_name FROM information_schema.tables WHERE table_schema = ? ORDER BY TABLE_NAME',
            [String(ds.config?.database)]
          )
          const tables = (rows as any[]).map((r) => r.table_name).filter(Boolean)
          return response.send({ tables })
        } finally {
          await connection.end()
        }
      }

      if (ds.type === 'postgres') {
        const pg = await import('pg')
        const client = new pg.Client({
          host: String(ds.config?.host),
          port: Number(ds.config?.port),
          user: String(ds.config?.username),
          password: String(ds.config?.password),
          database: String(ds.config?.database),
          connectionTimeoutMillis: 3000,
        })
        await client.connect()
        try {
          const schema = payload.schema || 'public'
          const res = await client.query(
            'SELECT table_name FROM information_schema.tables WHERE table_schema = $1 ORDER BY table_name',
            [schema]
          )
          const tables = (res.rows as any[]).map((r) => r.table_name).filter(Boolean)
          return response.send({ tables })
        } finally {
          await client.end()
        }
      }

      return response.status(400).send({ error: `Тип источника не поддерживается: ${ds.type}` })
    } catch (e: any) {
      const message = e?.message ? String(e.message) : String(e)
      return response.status(400).send({ error: message })
    }
  }

  /**
   * Возвращает список колонок для указанной таблицы/схемы и источника данных
   */
  async listColumns({ request, response }: HttpContext) {
    const payload = {
      dataSourceId: Number(request.input('dataSourceId')),
      table: String(request.input('table') || ''),
      schema: String(request.input('schema') || ''),
    }

    if (!payload.table) {
      return response.status(422).send({ error: 'Параметр table обязателен' })
    }

    const ds = await DataSource.find(payload.dataSourceId)
    if (!ds) {
      return response.status(404).send({ error: 'Источник данных не найден' })
    }

    try {
      if (ds.type === 'sqlite') {
        const sqlite3Module = await import('sqlite3')
        const sqlite3 = sqlite3Module.default
        const fileVal = String(ds.config?.file || '')
        const absFile = path.isAbsolute(fileVal) ? fileVal : app.makePath(fileVal)

        // Проверим доступность файла
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

        const escaped = payload.table.replace(/"/g, '""')
        const rows = await new Promise<Array<{ name: string }>>((resolve, reject) => {
          const db = new sqlite3.Database(absFile, sqlite3.OPEN_READWRITE)
          db.all(`PRAGMA table_info("${escaped}")`, [], (err: any, res: any[]) => {
            if (err) {
              db.close()
              return reject(err)
            }
            db.close()
            resolve(res || [])
          })
        })
        const columns = rows.map((r: any) => r.name).filter(Boolean)
        return response.send({ columns })
      }

      if (ds.type === 'mysql') {
        const mysql = await import('mysql2/promise')
        const connection = await mysql.createConnection({
          host: String(ds.config?.host),
          port: Number(ds.config?.port),
          user: String(ds.config?.username),
          password: String(ds.config?.password),
          database: String(ds.config?.database),
          connectTimeout: 3000,
        })
        try {
          const [rows] = await connection.execute(
            'SELECT COLUMN_NAME AS column_name FROM information_schema.columns WHERE table_schema = ? AND table_name = ? ORDER BY ORDINAL_POSITION',
            [String(ds.config?.database), payload.table]
          )
          const columns = (rows as any[]).map((r) => r.column_name).filter(Boolean)
          return response.send({ columns })
        } finally {
          await connection.end()
        }
      }

      if (ds.type === 'postgres') {
        const pg = await import('pg')
        const client = new pg.Client({
          host: String(ds.config?.host),
          port: Number(ds.config?.port),
          user: String(ds.config?.username),
          password: String(ds.config?.password),
          database: String(ds.config?.database),
          connectionTimeoutMillis: 3000,
        })
        await client.connect()
        try {
          const schema = payload.schema || 'public'
          const res = await client.query(
            'SELECT column_name FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2 ORDER BY ordinal_position',
            [schema, payload.table]
          )
          const columns = (res.rows as any[]).map((r) => r.column_name).filter(Boolean)
          return response.send({ columns })
        } finally {
          await client.end()
        }
      }

      return response.status(400).send({ error: `Тип источника не поддерживается: ${ds.type}` })
    } catch (e: any) {
      const message = e?.message ? String(e.message) : String(e)
      return response.status(400).send({ error: message })
    }
  }
}

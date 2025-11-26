// import type { HttpContext } from '@adonisjs/core/http'

import DataSource from '#models/data_source'
import app from '@adonisjs/core/services/app'
import { HttpContext } from '@adonisjs/core/http'
import path from 'node:path'

export default class SqlController {
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

      if (ds.type === 'clickhouse') {
        const chModule = await import('@clickhouse/client')
        const { createClient } = chModule as any
        const client = createClient({
          url: `http://${String(ds.config?.host)}:${Number(ds.config?.port)}`,
          username: String(ds.config?.username),
          password: String(ds.config?.password),
          database: String(ds.config?.database),
          request_timeout: 3000,
        })
        try {
          const result = await client.query({
            query: `SELECT name FROM system.tables WHERE database = '${String(ds.config?.database).replace(/'/g, "''")}' ORDER BY name`,
            format: 'JSONEachRow',
          })
          const json = await result.json()

          const tables = Array.isArray(json)
            ? (json as any[]).map((r) => r?.name).filter(Boolean)
            : []
          return response.send({ tables })
        } finally {
          await client.close()
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
      table: request.input('table') as string | string[] | undefined,
      schema: String(request.input('schema') || ''),
    }

    // Normalize tables to array
    const tables = Array.isArray(payload.table)
      ? payload.table
      : payload.table
        ? [payload.table]
        : []
    if (tables.length === 0) {
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

        const columnsMap: Record<string, string[]> = {}
        for (const table of tables) {
          const escaped = table.replace(/"/g, '""')
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
          columnsMap[table] = rows.map((r: any) => r.name).filter(Boolean)
        }
        return response.send({ columns: columnsMap })
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
          const columnsMap: Record<string, string[]> = {}
          for (const table of tables) {
            const [rows] = await connection.execute(
              'SELECT COLUMN_NAME AS column_name FROM information_schema.columns WHERE table_schema = ? AND table_name = ? ORDER BY ORDINAL_POSITION',
              [String(ds.config?.database), table]
            )
            columnsMap[table] = (rows as any[]).map((r) => r.column_name).filter(Boolean)
          }
          return response.send({ columns: columnsMap })
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
          const columnsMap: Record<string, string[]> = {}
          for (const table of tables) {
            const res = await client.query(
              'SELECT column_name FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2 ORDER BY ordinal_position',
              [schema, table]
            )
            columnsMap[table] = (res.rows as any[]).map((r) => r.column_name).filter(Boolean)
          }
          return response.send({ columns: columnsMap })
        } finally {
          await client.end()
        }
      }

      if (ds.type === 'clickhouse') {
        const chModule = await import('@clickhouse/client')
        const { createClient } = chModule as any
        const client = createClient({
          url: `http://${String(ds.config?.host)}:${Number(ds.config?.port)}`,
          username: String(ds.config?.username),
          password: String(ds.config?.password),
          database: String(ds.config?.database),
          request_timeout: 3000,
        })
        try {
          const columnsMap: Record<string, string[]> = {}
          for (const table of tables) {
            const tableEsc = String(table).replace(/"/g, '""').replace(/'/g, "''")
            const result = await client.query({
              query: `SELECT name FROM system.columns WHERE database = '${String(ds.config?.database).replace(/'/g, "''")}' AND table = '${tableEsc}' ORDER BY position`,
              format: 'JSONEachRow',
            })
            const json = await result.json()
            columnsMap[table] = Array.isArray(json?.data)
              ? (json.data as any[]).map((r) => r?.name).filter(Boolean)
              : []
          }
          return response.send({ columns: columnsMap })
        } finally {
          await client.close()
        }
      }
      return response.status(400).send({ error: `Тип источника не поддерживается: ${ds.type}` })
    } catch (e: any) {
      const message = e?.message ? String(e.message) : String(e)
      return response.status(400).send({ error: message })
    }
  }
}

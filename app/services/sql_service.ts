import path from 'node:path'
import app from '@adonisjs/core/services/app'

export type PlaceholderResult = {
  sql: string
  values: any[]
  placeholders: string[]
}

export default class SqlService {
  async countSql(type: string, config: any, sql: string, variables?: string[]): Promise<number> {
    if (!sql || !String(sql).trim()) {
      throw new Error('SQL не может быть пустым')
    }

    const normalizedSql = String(sql)
      .trim()
      .replace(/;+\s*$/, '')
    const countSql = `SELECT COUNT(*) AS count FROM (${normalizedSql}) AS sub`

    const { rows } = await this.executeSql(type, config, countSql, variables)
    const first = rows[0]
    const value = first?.count ?? (first ? Object.values(first)[0] : 0)
    return Number(value ?? 0)
  }

  async executeSql(
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

  getByPath(obj: Record<string, any>, keyPath: string): any {
    return keyPath.split('.').reduce((acc, key) => (acc === null ? undefined : acc[key]), obj)
  }

  replaceSqlPlaceholders(sql: string, sources: Record<string, any> = {}): PlaceholderResult {
    let inSingle = false
    let inDouble = false
    let i = 0
    const placeholders: string[] = []
    const values: any[] = []
    let out = ''

    while (i < sql.length) {
      const ch = sql[i]

      if (ch === "'" && !inDouble) {
        // учёт экранирования '' внутри одинарных кавычек
        if (inSingle && sql[i + 1] === "'") {
          out += "''"
          i += 2
          continue
        }
        inSingle = !inSingle
        out += ch
        i++
        continue
      }

      if (ch === '"' && !inSingle) {
        inDouble = !inDouble
        out += ch
        i++
        continue
      }

      if (ch === '{' && !inSingle && !inDouble) {
        const start = i + 1
        let j = start
        while (j < sql.length && sql[j] !== '}') j++
        if (j >= sql.length) {
          // незакрытая скобка — просто копируем символ
          out += ch
          i++
          continue
        }

        const name = sql.slice(start, j).trim()
        placeholders.push(name)
        values.push(this.getByPath(sources, name))
        out += '?'
        i = j + 1
        continue
      }

      out += ch
      i++
    }

    return { sql: out, values, placeholders }
  }
}

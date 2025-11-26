import path from 'node:path'
import app from '@adonisjs/core/services/app'
import { ArrayColumnsResult, FetchConfigResult, ParamsResult } from '#interfaces/fetchсonfigs'
import DataSource from '#models/data_source'

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
        // console.log('wrappedSql', wrappedSql, 'variables', variables)
        const [rows, fields] = await connection.query(wrappedSql, variables)
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

    if (type === 'clickhouse') {
      // Inline variables into SQL for ClickHouse (it doesn't support '?')
      const escapeLiteral = (val: any): string => {
        if (val === null || val === undefined) return 'NULL'
        if (typeof val === 'number') return Number.isFinite(val) ? String(val) : 'NULL'
        if (typeof val === 'boolean') return val ? 'true' : 'false'
        if (val instanceof Date) {
          const pad = (n: number) => String(n).padStart(2, '0')
          const d = val
          const s = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
          return `'${s}'`
        }
        if (Array.isArray(val)) return `[${val.map((v) => escapeLiteral(v)).join(', ')}]`
        const s = String(val)
        if (/^[-+]?\d+(?:\.\d+)?$/.test(s.trim())) return s.trim()
        return `'${s.replace(/'/g, "''")}'`
      }

      let sqlWithValues = wrappedSql
      if (Array.isArray(variables) && variables.length > 0) {
        let i = 0
        sqlWithValues = sqlWithValues.replace(/\?/g, () => {
          const v = variables![i++]
          return escapeLiteral(v)
        })
      }

      const chModule = await import('@clickhouse/client')
      const { createClient } = chModule as any
      const client = createClient({
        url: `http://${String(config?.host)}:${Number(config?.port)}`,
        username: String(config?.username),
        password: String(config?.password),
        database: String(config?.database),
        request_timeout: 3000,
      })
      try {
        const result = await client.query({ query: sqlWithValues, format: 'JSONEachRow' })
        const json = await result.json()
        console.log('sqlWithValues', sqlWithValues, json)
        const rows = Array.isArray(json) ? (json as any[]) : []
        const columns = Array.isArray(json?.meta)
          ? (json.meta as any[]).map((m: any) => m?.name).filter(Boolean)
          : undefined
        return { rows, columns }
      } finally {
        await client.close()
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

  getSource(resultList: FetchConfigResult[]) {
    const result: Record<string, any> = {}
    for (const resultItem of resultList) {
      switch (resultItem.dataType) {
        case 'params':
          result['params'] = this.getSourceFromParams(resultItem)
          break
        case 'array_columns':
          result[resultItem.datasetId] = this.getSourceFromArrayColumns(resultItem)
          break
      }
    }

    return result
  }

  getSourceFromParams(resultItem: ParamsResult) {
    return resultItem.data
  }

  getSourceFromArrayColumns(resultItem: ArrayColumnsResult) {
    const keys = new Set<string>()
    for (const row of resultItem.data) {
      for (const k of Object.keys(row)) keys.add(k)
    }

    const result: Record<string, any[]> = {}
    for (const k of keys) result[k] = []

    for (const row of resultItem.data) {
      for (const k of keys) {
        const hasKey = Object.prototype.hasOwnProperty.call(row, k)
        result[k].push(hasKey ? row[k] : undefined)
      }
    }

    return result
  }

  /**
   * Применяет одно правило SaveMapping к массиву строк результата.
   * Выполняет UPDATE по условию updateOn, при отсутствии совпадений — INSERT.
   * После успешного INSERT добавляет в строку поле `<mapping.id>.ID` для использования в последующих правилах.
   */
  async applySaveMappingToRows(mapping: any, rows: Record<string, any>[]): Promise<number> {
    if (!mapping || typeof mapping !== 'object') return 0
    const sourceId = Number(mapping.sourceId)
    const table = String(mapping.table || '')
    const savedMapping: Array<{ tableColumn: string; resultColumn: string }> = Array.isArray(
      mapping.savedMapping
    )
      ? mapping.savedMapping
      : []
    const updateOn: Array<{
      tableColumn: string
      aliasColumn: string
      operator: string
      cond?: 'and' | 'or'
    }> = Array.isArray(mapping.updateOn) ? mapping.updateOn : []

    if (!sourceId || !table || savedMapping.length === 0) return 0

    const ds = await DataSource.find(sourceId)
    if (!ds) {
      throw new Error(`DataSource not found: ${sourceId}`)
    }

    const type = String(ds.type)
    const config = ds.config

    let savedCount = 0
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

      const db = new sqlite3.Database(absFile, sqlite3.OPEN_READWRITE)
      try {
        for (const row of rows) {
          const { setSql, setValues } = this.buildSet(savedMapping, row)
          const { whereSql, whereValues } = this.buildWhere(updateOn, row)

          let affected = 0
          if (whereSql) {
            const updateSql = `UPDATE ${table} SET ${setSql} WHERE ${whereSql}`
            affected = await new Promise<number>((resolve, reject) => {
              db.run(updateSql, [...setValues, ...whereValues], function (err: any) {
                if (err) return reject(err)
                resolve(Number(this.changes || 0))
              })
            })
          }

          if (affected === 0) {
            const insertCols = savedMapping.map((m) => m.tableColumn).join(', ')
            const placeholders = savedMapping.map(() => '?').join(', ')
            const insertSql = `INSERT INTO ${table} (${insertCols}) VALUES (${placeholders})`
            const insertId: number = await new Promise<number>((resolve, reject) => {
              db.run(insertSql, setValues, function (err: any) {
                if (err) return reject(err)
                resolve(Number(this.lastID || 0))
              })
            })
            if (insertId) {
              row[`${mapping.id}.ID`] = insertId
            }
            savedCount++
          } else {
            savedCount++
          }
        }
      } finally {
        db.close()
      }
    } else if (type === 'mysql') {
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
        for (const row of rows) {
          const { setSql, setValues } = this.buildSet(savedMapping, row)
          const { whereSql, whereValues } = this.buildWhere(updateOn, row)

          let affected = 0
          if (whereSql) {
            const updateSql = `UPDATE ${table} SET ${setSql} WHERE ${whereSql}`
            const [res]: any = await connection.execute(updateSql, [...setValues, ...whereValues])
            affected = Number(res?.affectedRows || 0)
          }

          if (affected === 0) {
            const insertCols = savedMapping.map((m) => m.tableColumn).join(', ')
            const placeholders = savedMapping.map(() => '?').join(', ')
            const insertSql = `INSERT INTO ${table} (${insertCols}) VALUES (${placeholders})`
            const [res]: any = await connection.execute(insertSql, setValues)
            const insertId = Number(res?.insertId || 0)
            if (insertId) {
              row[`${mapping.id}.ID`] = insertId
            }
            savedCount++
          } else {
            savedCount++
          }
        }
      } finally {
        await connection.end()
      }
    } else if (type === 'postgres') {
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
        for (const row of rows) {
          const { setSql, setValues } = this.buildSet(savedMapping, row)
          const { whereSql, whereValues } = this.buildWhere(updateOn, row, 'pg')

          let affected = 0
          if (whereSql) {
            const updateSql = `UPDATE ${table} SET ${setSql} WHERE ${whereSql}`
            const res = await client.query(updateSql, [...setValues, ...whereValues])
            affected = Number(res?.rowCount || 0)
          }

          if (affected === 0) {
            const insertCols = savedMapping.map((m) => m.tableColumn).join(', ')
            const placeholders = savedMapping.map((_, i) => `$${i + 1}`).join(', ')
            const insertSql = `INSERT INTO ${table} (${insertCols}) VALUES (${placeholders})`
            await client.query(insertSql, setValues)
            savedCount++
          } else {
            savedCount++
          }
        }
      } finally {
        await client.end()
      }
    } else if (type === 'clickhouse') {
      const chModule = await import('@clickhouse/client')
      const { createClient } = chModule as any
      const client = createClient({
        url: `http://${String(config?.host)}:${Number(config?.port)}`,
        username: String(config?.username),
        password: String(config?.password),
        database: String(config?.database),
        request_timeout: 3000,
      })
      // Локальные помощники для экранирования и подстановки значений
      const escapeLiteral = (val: any): string => {
        if (val === null || val === undefined) return 'NULL'
        if (typeof val === 'number') return Number.isFinite(val) ? String(val) : 'NULL'
        if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE'
        if (val instanceof Date) {
          const pad = (n: number) => String(n).padStart(2, '0')
          const d = val
          const s = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
          return `'${s}'`
        }
        if (Array.isArray(val)) return val.map((v) => escapeLiteral(v)).join(', ')
        const s = String(val)
        if (/^[-+]?\d+(?:\.\d+)?$/.test(s.trim())) return s.trim()
        return `'${s.replace(/'/g, "''")}'`
      }
      const inline = (sqlStr: string, vals: any[]): string => {
        let i = 0
        return sqlStr.replace(/\?/g, () => escapeLiteral(vals[i++]))
      }
      try {
        for (const row of rows) {
          const { setSql, setValues } = this.buildSet(savedMapping, row)
          const { whereSql, whereValues } = this.buildWhere(updateOn, row)

          let matched = 0
          if (whereSql) {
            const whereCond = inline(whereSql, whereValues)
            const countSql = `SELECT COUNT(*) AS cnt FROM ${table} WHERE ${whereCond}`
            const res = await client.query({ query: countSql, format: 'JSONEachRow' })
            const json = await res.json()
            const cntRow = Array.isArray(json) ? (json as any[])[0] : undefined
            const cntVal = cntRow ? (cntRow.cnt ?? (Object.values(cntRow)[0] as any)) : 0
            matched = Number(cntVal || 0)
            if (matched > 0) {
              const setInlined = inline(setSql, setValues)
              const updateSql = `ALTER TABLE ${table} UPDATE ${setInlined} WHERE ${whereCond}`
              await client.command({ query: updateSql })
              savedCount++
              continue
            }
          }

          const insertCols = savedMapping.map((m) => m.tableColumn).join(', ')
          const insertVals = setValues.map((v) => escapeLiteral(v)).join(', ')
          const insertSql = `INSERT INTO ${table} (${insertCols}) VALUES (${insertVals})`
          await client.command({ query: insertSql })
          savedCount++
        }
      } finally {
        await client.close()
      }
    } else {
      throw new Error(`Тип источника не поддерживается для сохранения: ${type}`)
    }

    return savedCount
  }

  /**
   * Построение части SET для UPDATE/INSERT
   */
  private buildSet(
    savedMapping: Array<{ tableColumn: string; resultColumn: string }>,
    row: Record<string, any>
  ): { setSql: string; setValues: any[] } {
    const cols = savedMapping.map((m) => m.tableColumn)
    const vals = savedMapping.map((m) => row[m.resultColumn])
    const setSql = cols.map((c) => `${c} = ?`).join(', ')
    return { setSql, setValues: vals }
  }

  /**
   * Построение WHERE согласно updateOn. Для Postgres генерируем $n вместо ?.
   */
  private buildWhere(
    updateOn: Array<{
      tableColumn: string
      aliasColumn: string
      operator: string
      cond?: 'and' | 'or'
    }>,
    row: Record<string, any>,
    dialect: 'default' | 'pg' = 'default'
  ): { whereSql: string; whereValues: any[] } {
    if (!updateOn || updateOn.length === 0) return { whereSql: '', whereValues: [] }
    const parts: string[] = []
    const values: any[] = []
    updateOn.forEach((u, idx) => {
      const op = u.operator || '='
      const cond = idx > 0 && u.cond ? u.cond.toUpperCase() : idx > 0 ? 'AND' : ''
      const placeholder = dialect === 'pg' ? `$${values.length + 1}` : '?'
      parts.push(`${cond ? cond + ' ' : ''}${u.tableColumn} ${op} ${placeholder}`)
      values.push(row[u.aliasColumn])
    })
    const whereSql = parts.join(' ')
    return { whereSql, whereValues: values }
  }
}

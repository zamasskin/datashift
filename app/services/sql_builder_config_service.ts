import { FetchConfigResult } from '#interfaces/fetchсonfigs'
import { SqlBuilderConfigExecute } from '#interfaces/sql_builder_config'
import SqlConfigService from '#services/sql_config_service'

export default class SqlBuilderConfigService {
  constructor(private sqlConfigService = new SqlConfigService()) {}

  async *execute(
    config: SqlBuilderConfigExecute,
    resultList: FetchConfigResult[]
  ): AsyncGenerator<FetchConfigResult> {
    const p = config.params
    const sql = this.buildSql(config)
    // Делаем делегирование в SqlConfigService: он сам применит пагинацию и выполнит запрос
    const executeConfig = {
      type: 'sql' as const,
      id: config.id,
      params: { sourceId: p.sourceId, query: sql },
      page: config.page,
    }

    for await (const res of this.sqlConfigService.execute(executeConfig, resultList)) {
      yield res
    }
  }

  private buildSql(config: SqlBuilderConfigExecute) {
    const p = config.params
    const baseAlias = p.alias || p.table

    const selects = Array.isArray(p.selects) && p.selects.length > 0 ? p.selects.join(', ') : '*'

    const from = p.alias ? `${p.table} ${p.alias}` : p.table

    const joins =
      Array.isArray(p.joins) && p.joins.length > 0
        ? ' ' + p.joins.map((j) => this.buildJoin(baseAlias, j)).join(' ')
        : ''

    const where = p.where ? this.buildWhere(p.where) : ''

    const group =
      Array.isArray(p.group) && p.group.length > 0 ? ` GROUP BY ${p.group.join(', ')}` : ''

    // hawing (опечатка в интерфейсе) трактуем как HAVING
    const having = p.hawing ? this.buildWhere(p.hawing, 'HAVING') : ''

    const orders =
      Array.isArray(p.orders) && p.orders.length > 0
        ? ' ORDER BY ' +
          p.orders
            .flatMap((o) =>
              Object.entries(o).map(([col, dir]) => `${col} ${String(dir).toUpperCase()}`)
            )
            .join(', ')
        : ''

    return `SELECT ${selects} FROM ${from}${joins}${where}${group}${having}${orders}`.trim()
  }

  private buildJoin(
    baseAlias: string,
    j: {
      table: string
      alias?: string
      type: 'inner' | 'left' | 'right' | 'full'
      on: Array<{
        tableColumn: string
        aliasColumn: string
        operator: '=' | '!=' | '<' | '<=' | '>' | '>='
        cond?: 'and' | 'or'
      }>
    }
  ) {
    const joinAlias = j.alias || j.table
    const typeSql =
      j.type === 'inner'
        ? 'INNER'
        : j.type === 'left'
          ? 'LEFT'
          : j.type === 'right'
            ? 'RIGHT'
            : 'FULL'
    const on = j.on
      .map((cond, idx) => {
        const lhs = `${baseAlias}.${cond.tableColumn}`
        const rhs = `${joinAlias}.${cond.aliasColumn}`
        const op = cond.operator
        const logic = idx === 0 ? '' : ` ${String(cond.cond || 'and').toUpperCase()}`
        return `${logic} ${lhs} ${op} ${rhs}`.trim()
      })
      .join('')
    return `${typeSql} JOIN ${j.table} ${joinAlias} ON ${on}`
  }

  private buildWhere(
    where: {
      fields?: Array<{
        key: string
        value?: any
        values?: any[]
        op?: '=' | '!=' | '<>' | '>' | '>=' | '<' | '<=' | 'in' | 'nin'
      }>
      $and?: Record<string, any>
      $or?: Record<string, any>
    },
    keyword: 'WHERE' | 'HAVING' = 'WHERE'
  ) {
    const parts: string[] = []

    if (Array.isArray(where.fields)) {
      for (const f of where.fields) {
        const op = f.op || '='
        if (op === 'in' || op === 'nin') {
          const list = (f.values ?? []).map((v) => this.escapeLiteral(v)).join(', ')
          const inSql = op === 'in' ? 'IN' : 'NOT IN'
          parts.push(`${f.key} ${inSql} (${list})`)
        } else {
          parts.push(`${f.key} ${op} ${this.escapeLiteral(f.value)}`)
        }
      }
    }

    // Простейшая поддержка $and/$or как равенства: { col: value } => col = value
    const kvToExpr = (kv?: Record<string, any>) =>
      kv ? Object.entries(kv).map(([k, v]) => `${k} = ${this.escapeLiteral(v)}`) : []

    const ands = kvToExpr(where.$and)
    const ors = kvToExpr(where.$or)

    if (ands.length) parts.push(...ands)
    if (ors.length) {
      const orExpr = ors.join(' OR ')
      parts.push(`(${orExpr})`)
    }

    return parts.length ? ` ${keyword} ${parts.join(' AND ')}` : ''
  }

  private escapeLiteral(val: any): string {
    if (val === null || val === undefined) return 'NULL'
    if (typeof val === 'number') return Number.isFinite(val) ? String(val) : 'NULL'
    if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE'
    if (val instanceof Date) return `'${this.formatDate(val)}'`
    // массив значений для IN
    if (Array.isArray(val)) return val.map((v) => this.escapeLiteral(v)).join(', ')
    const s = String(val)
    // экранирование одинарных кавычек: ' -> ''
    const escaped = s.replace(/'/g, "''")
    return `'${escaped}'`
  }

  private formatDate(d: Date): string {
    // ISO без таймзоны: YYYY-MM-DD HH:mm:ss
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  }
}

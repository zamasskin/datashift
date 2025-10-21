import { BuildSqlDataset } from '~/interfaces/datasets'

export function buildQuery(payload: Omit<BuildSqlDataset, 'type'>): {
  query: string
  variables: string[]
} {
  const {
    table,
    columns = [],
    filters = [],
    groupBy = [],
    orderBy = [],
    having = [],
    joins = [],
    variables = [],
  } = payload

  const joinTypeMap: Record<'join' | 'leftJoin' | 'rightJoin' | 'innerJoin', string> = {
    join: 'JOIN',
    leftJoin: 'LEFT JOIN',
    rightJoin: 'RIGHT JOIN',
    innerJoin: 'INNER JOIN',
  }

  const escapeValue = (v: string) => {
    const isNumeric = /^-?\d+(\.\d+)?$/.test(v)
    return isNumeric ? v : `'${v.replace(/'/g, "''")}'`
  }

  const parts: string[] = []

  // SELECT
  parts.push(`SELECT ${columns.length ? columns.join(', ') : '*'}`)

  // FROM
  parts.push(`FROM ${table}`)

  // JOINs
  for (const j of joins) {
    const jt = joinTypeMap[j.type] || 'JOIN'
    const onClause =
      j.on
        .map((c, idx) =>
          idx === 0 ? `${c.left} = ${c.right}` : `${c.operator || 'AND'} ${c.left} = ${c.right}`
        )
        .join(' ') || '1=1'
    parts.push(`${jt} ${j.table} ON ${onClause}`)
  }

  // WHERE
  if (filters.length) {
    const where = filters
      .map((f) => `${f.column} ${f.operator} ${escapeValue(f.value)}`)
      .join(' AND ')
    parts.push(`WHERE ${where}`)
  }

  // GROUP BY
  if (groupBy.length) {
    parts.push(`GROUP BY ${groupBy.join(', ')}`)
  }

  // HAVING
  if (having.length) {
    const havingClause = having
      .map((h) => `${h.column} ${h.operator} ${escapeValue(h.value)}`)
      .join(' AND ')
    parts.push(`HAVING ${havingClause}`)
  }

  // ORDER BY
  if (orderBy.length) {
    const order = orderBy.map((o) => `${o.column} ${o.direction.toUpperCase()}`).join(', ')
    parts.push(`ORDER BY ${order}`)
  }

  const sql = parts.join(' ')
  return { query: sql, variables }
}

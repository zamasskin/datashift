export function jsonPrepare(value: any) {
  if (value === null || value === undefined) return null
  try {
    return typeof value === 'string' ? value : JSON.stringify(value)
  } catch {
    return value
  }
}

export function jsonConsume(value: any) {
  if (value === null || value === undefined) return null
  if (typeof value === 'string') {
    try {
      return JSON.parse(value)
    } catch {
      return value
    }
  }
  return value
}

/**
 * Удобный хелпер для декоратора @column, чтобы не дублировать prepare/consume
 */
export function jsonColumn() {
  return {
    prepare: jsonPrepare,
    consume: jsonConsume,
  }
}

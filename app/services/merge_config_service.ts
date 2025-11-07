import { FetchConfigResult } from '#interfaces/fetchсonfigs'
import { MergeConfig } from '#interfaces/merge_config'

export default class MergeConfigService {
  async *execute(
    config: MergeConfig,
    resultList: FetchConfigResult[]
  ): AsyncGenerator<FetchConfigResult> {
    const left = resultList.find(
      (r) => r.dataType === 'array_columns' && r.datasetId === config.params.datasetLeftId
    )
    const right = resultList.find(
      (r) => r.dataType === 'array_columns' && r.datasetId === config.params.datasetRightId
    )

    if (!left || left.dataType !== 'array_columns') {
      throw new Error(`Left dataset not found or invalid: ${config.params.datasetLeftId}`)
    }
    if (!right || right.dataType !== 'array_columns') {
      throw new Error(`Right dataset not found or invalid: ${config.params.datasetRightId}`)
    }

    const leftId = left.datasetId
    const rightId = right.datasetId
    const columns = [
      ...new Set([
        ...(left.meta?.columns || []).map((c) => `${leftId}.${c}`),
        ...(right.meta?.columns || []).map((c) => `${rightId}.${c}`),
      ]),
    ]

    const matches: Record<string, any>[] = []

    for (const lRow of left.data) {
      for (const rRow of right.data) {
        if (this.isMatch(lRow, rRow, config.params.on)) {
          const merged: Record<string, any> = {}
          for (const key of Object.keys(lRow)) {
            merged[`${leftId}.${key}`] = lRow[key]
          }
          for (const key of Object.keys(rRow)) {
            merged[`${rightId}.${key}`] = rRow[key]
          }
          matches.push(merged)
        }
      }
    }

    yield {
      datasetId: config.id,
      dataType: 'array_columns',
      data: matches,
      meta: {
        name: 'MergeBuilder',
        columns,
      },
    }
  }

  private isMatch(
    lRow: Record<string, any>,
    rRow: Record<string, any>,
    rules: {
      tableColumn: string
      aliasColumn: string
      operator: '=' | '!=' | '<' | '<=' | '>' | '>='
      cond?: 'and' | 'or'
    }[]
  ) {
    let result: boolean | null = null
    for (const [index, rule] of rules.entries()) {
      const lKey = this.resolveColumn(rule.tableColumn)
      const rKey = this.resolveColumn(rule.aliasColumn)
      const lVal = lRow[lKey]
      const rVal = rRow[rKey]
      const cmp = this.compare(lVal, rVal, rule.operator)

      if (index === 0) {
        result = cmp
      } else {
        result = (rule.cond || 'and') === 'and' ? Boolean(result) && cmp : Boolean(result) || cmp
      }
    }
    return Boolean(result)
  }

  private resolveColumn(ref: string) {
    const trimmed = ref.trim()
    if (!trimmed) return trimmed
    const parts = trimmed.split('.')
    if (parts.length >= 2) {
      return parts.slice(parts.length - 1)[0]
    }
    return trimmed
  }

  private compare(a: any, b: any, op: '=' | '!=' | '<' | '<=' | '>' | '>=') {
    switch (op) {
      case '=':
        return a === b
      case '!=':
        return a !== b
      case '<':
        return a < b
      case '<=':
        return a <= b
      case '>':
        return a > b
      case '>=':
        return a >= b
      default:
        return false
    }
  }
}

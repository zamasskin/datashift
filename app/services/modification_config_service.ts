import { FetchConfigResult } from '#interfaces/fetchсonfigs'
import { ModificationConfig } from '#interfaces/modification_config'

export default class ModificationConfigService {
  async *execute(
    config: ModificationConfig,
    resultList: FetchConfigResult[]
  ): AsyncGenerator<FetchConfigResult> {
    const params = config.params
    const base = resultList.find(
      (r) => r.dataType === 'array_columns' && r.datasetId === params.datasetId
    )

    if (!base || base.dataType !== 'array_columns') {
      throw new Error(`Dataset not found or invalid: ${params.datasetId}`)
    }

    const paramsData = this.getParams(resultList)

    // Clone base rows and columns
    const rows = base.data.map((row) => ({ ...row }))
    let columns = [...(base.meta?.columns || [])]

    // 1) Drop columns
    const drop = Array.isArray(params.dropColumns) ? params.dropColumns : []
    if (drop.length > 0) {
      columns = columns.filter((c) => !drop.includes(c))
      for (const row of rows) {
        for (const c of drop) delete row[c]
      }
    }

    // 2) Rename columns (oldName -> newName)
    const renameMap = params.renameColumns || {}
    const renames = Object.entries(renameMap).filter(([from, to]) => from && to && from !== to)
    if (renames.length > 0) {
      const renameDict = Object.fromEntries(renames)
      columns = columns.map((c) => renameDict[c] ?? c)
      for (const row of rows) {
        for (const [from, to] of renames) {
          if (Object.prototype.hasOwnProperty.call(row, from)) {
            row[to] = row[from]
            delete row[from]
          }
        }
      }
    }

    // 3) Add new columns
    const newCols = Array.isArray(params.newColumns) ? params.newColumns : []
    if (newCols.length > 0) {
      for (const [i, spec] of newCols.entries()) {
        const proposedName = this.proposeNewColumnName(spec, i)
        const name = this.uniqueName(proposedName, new Set(columns))

        for (const row of rows) {
          let value: any = null
          switch (spec?.type) {
            case 'reference': {
              const ref = String(spec?.value || '').trim()
              value = ref ? row[ref] : undefined
              break
            }
            case 'literal': {
              value = spec?.value
              break
            }
            case 'template': {
              const tpl = String(spec?.value || '')
              value = this.renderTemplate(tpl, row, paramsData)
              break
            }
            case 'expression': {
              const expr = String(spec?.value || '')
              value = this.evalExpression(expr, row, paramsData)
              break
            }
            default:
              value = null
          }
          row[name] = value
        }

        columns.push(name)
      }
    }

    yield {
      datasetId: config.id,
      dataType: 'array_columns',
      data: rows,
      meta: {
        name: 'Modification',
        columns,
      },
    }
  }

  private getParams(resultList: FetchConfigResult[]) {
    const paramsItem = [...resultList].reverse().find((r) => r.dataType === 'params') as
      | (FetchConfigResult & { dataType: 'params' })
      | undefined
    return paramsItem ? paramsItem.data || {} : {}
  }

  private proposeNewColumnName(spec: any, index: number) {
    switch (spec?.type) {
      case 'reference':
        return String(spec?.value || '').trim() || `ref_${index + 1}`
      case 'literal':
        return `literal_${index + 1}`
      case 'template':
        return `template_${index + 1}`
      case 'expression':
        return `expr_${index + 1}`
      default:
        return `new_${index + 1}`
    }
  }

  private uniqueName(base: string, existing: Set<string>) {
    let name = base || 'new_col'
    if (!existing.has(name)) return name
    let i = 2
    while (existing.has(`${name}_${i}`)) i++
    return `${name}_${i}`
  }

  private renderTemplate(template: string, row: Record<string, any>, params: Record<string, any>) {
    if (!template) return ''
    return template.replace(/\{\{\s*([a-zA-Z0-9_\.]+)\s*\}\}/g, (_, key: string) => {
      const k = String(key || '').trim()
      if (!k) return ''
      if (k.startsWith('params.')) {
        const pKey = k.slice('params.'.length)
        const v = params[pKey]
        return v === null || typeof v === 'undefined' ? '' : String(v)
      }
      const v = row[k]
      return v === null || typeof v === 'undefined' ? '' : String(v)
    })
  }

  private evalExpression(expr: string, row: Record<string, any>, params: Record<string, any>) {
    if (!expr) return null
    try {
      const column = row
      const fn = new Function('column', 'params', `'use strict'; return ((${expr}));`)
      return fn(column, params)
    } catch {
      return null
    }
  }
}

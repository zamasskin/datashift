import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import User from './user.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { jsonColumn } from '../helpers/json_column.js'

export default class Migration extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare isActive: boolean

  @column(jsonColumn())
  declare fetchConfigs: FetchConfig[]

  @column(jsonColumn())
  declare saveMappings: SaveMapping[]

  @column(jsonColumn())
  declare params: ParamItem[]

  @column(jsonColumn())
  declare cronExpression: CronConfig | null

  @column()
  declare createdBy: number

  @belongsTo(() => User, {
    foreignKey: 'createdBy',
  })
  declare user: BelongsTo<typeof User>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}

type SqlConfig = {
  type: 'sql'
  id: string
  params: { sourceId: number; query: string }
}

type WhereField = {
  key: string
  value?: any
  values?: any[]
  op?: '=' | '!=' | '<>' | '>' | '>=' | '<' | '<=' | 'in' | 'nin'
}
type WhereData = {
  fields?: WhereField[]
  $and?: Record<string, any>
  $or?: Record<string, any>
}

type JoinOn = {
  tableColumn: string
  aliasColumn: string
  operator: '=' | '!=' | '<' | '<=' | '>' | '>='
  cond?: 'and' | 'or'
}
type JoinItem = {
  table: string
  alias?: string
  type: 'inner' | 'left' | 'right' | 'full'
  on: JoinOn[]
}

type SqlBuilderConfig = {
  type: 'sql_builder'
  id: string
  params: {
    sourceId: number
    table: string
    alias?: string
    selects?: string[]
    orders?: Record<string, 'asc' | 'desc'>[]
    joins?: JoinItem[]
    where?: WhereData
    hawing?: WhereData
    group?: string[]
  }
}

type MergeOn = {
  tableColumn: string
  aliasColumn: string
  operator: '=' | '!=' | '<' | '<=' | '>' | '>='
  cond?: 'and' | 'or'
}

type MergeConfig = {
  type: 'merge'
  id: string
  params: {
    datasetLeftId: string
    datasetRightId: string
    on: MergeOn[]
  }
}

type ColumnTemplate = {
  type: 'template'
  value: string
}

type ColumnExpression = {
  type: 'expression'
  value: string
}

type ColumnLiteral = {
  type: 'literal'
  value: string | number | boolean
}

type ColumnReference = {
  type: 'reference'
  value: string // column name
}

type ColumnFunction = {
  type: 'function'
  name: string
  args: ColumnValue[]
}

type ColumnValue =
  | ColumnTemplate
  | ColumnExpression
  | ColumnLiteral
  | ColumnReference
  | ColumnFunction

// Modification dataset config (aligned with controller validation)
type ModificationConfig = {
  type: 'modification'
  id: string
  params: {
    datasetId: string
    newColumns?: ColumnValue[]
    dropColumns?: string[] // List of column names to remove
    renameColumns?: Record<string, string> // Map oldName -> newName
  }
}

type FetchConfig = SqlConfig | SqlBuilderConfig | MergeConfig | ModificationConfig
type SaveMapping = { datasetId: number; source: string }

type ParamItem = {
  key: string
  type: 'string' | 'number' | 'boolean' | 'date'
  value?: any
}

type CronDays = 'mo' | 'tu' | 'we' | 'th' | 'fr' | 'sa' | 'su'
type CronInterval = { type: 'interval'; count: number; units: 's' | 'm' | 'h' }
type CronIntervalTime = {
  type: 'interval-time'
  timeUnits: number
  timeStart: string
  timeEnd: string
  days: CronDays[]
}
type CronTime = { type: 'time'; time: string; days: CronDays[] }
type CronConfig = CronInterval | CronIntervalTime | CronTime

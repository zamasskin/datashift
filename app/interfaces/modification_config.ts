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
export type ModificationConfig = {
  type: 'modification'
  id: string
  params: {
    datasetId: string
    newColumns?: ColumnValue[]
    dropColumns?: string[] // List of column names to remove
    renameColumns?: Record<string, string> // Map oldName -> newName
  }
}

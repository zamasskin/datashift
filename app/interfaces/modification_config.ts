export type ColumnTemplate = {
  type: 'template'
  value: string
}

export type ColumnExpression = {
  type: 'expression'
  value: string
}

export type ColumnLiteral = {
  type: 'literal'
  value: string | number | boolean
}

export type ColumnReference = {
  type: 'reference'
  value: string // column name
}

export type ColumnFunction = {
  type: 'function'
  name: string
  args: ColumnValue[]
}

export type ColumnValue =
  | ColumnTemplate
  | ColumnExpression
  | ColumnLiteral
  | ColumnReference
  | ColumnFunction

export type NewColumnSpec = ColumnValue | { name?: string; value: ColumnValue }

// Modification dataset config (aligned with controller validation)
export type ModificationConfig = {
  type: 'modification'
  id: string
  params: {
    datasetId: string
    newColumns?: NewColumnSpec[]
    dropColumns?: string[] // List of column names to remove
    renameColumns?: Record<string, string> // Map oldName -> newName
  }
}

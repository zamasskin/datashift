export type DateOp = {
  amount: number
  unit: 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year'
}
export type DateParamValue =
  | { type: 'add'; ops: DateOp[] }
  | { type: 'subtract'; ops: DateOp[] }
  | {
      type: 'startOf'
      unit: 'day' | 'week' | 'month' | 'quarter' | 'year'
      position: 'current' | 'next' | 'previous'
    }
  | {
      type: 'endOf'
      unit: 'day' | 'week' | 'month' | 'quarter' | 'year'
      position: 'current' | 'next' | 'previous'
    }
  | { type: 'exact'; date: string }

export type ParamType = 'string' | 'number' | 'boolean' | 'date'

export type ParamItem = {
  key: string
  type: ParamType
  value?: string | number | boolean | DateParamValue
}

export type BooleanParam = {
  key: string
  type: 'boolean'
  value: boolean
}

export type DateParam = {
  key: string
  type: 'date'
  value: DateParamValue
}

export type StringParam = {
  key: string
  type: 'string'
  value: string
}

export type NumberParam = {
  key: string
  type: 'number'
  value: number
}

export type Param = StringParam | NumberParam | DateParam | BooleanParam

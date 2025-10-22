interface MergeData {
  newColumnName: string
  sourceColumn: string
  targetColumn: string
  operator?: 'AND' | 'OR'
  and?: MergeData[]
  or?: MergeData[]
}

interface MergeProps {
  isLoading: boolean
  error: string
}

export interface MergeDataset {
  type: 'merge'
  data: MergeData
  props: MergeProps
}

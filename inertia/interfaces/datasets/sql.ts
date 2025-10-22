interface SqlData {
  value: string
  variables: string[]
}

interface SqlProps {
  isEdit: boolean
  isLoading: boolean
  error: string
}

export interface SqlDataset {
  type: 'sql'
  data: SqlData
  props: SqlProps
}

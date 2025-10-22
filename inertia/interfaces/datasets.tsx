import { MergeDataset } from './datasets/merge'
import { SqlDataset } from './datasets/sql'

export type DatasetItem = SqlDataset | MergeDataset
export type Dataset = DatasetItem & {
  name: string
}

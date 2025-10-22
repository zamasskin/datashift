import { Dataset } from '~/interfaces/datasets'

export function buildParams(datasets: Dataset[]) {
  const params: string[] = []

  for (const dataset of datasets) {
    if (dataset.fields) {
      params.push(...dataset.fields.map((field) => `${dataset.name}.${field}`))
    }
  }

  return params
}

import { BooleanParam, DateParam, NumberParam, Param, StringParam } from '#interfaces/params'
import moment from 'moment'

export class ParamsService {
  getSource(paramsList: Param[]): Record<string, any> {
    const result: Record<string, any> = {}
    for (const paramsItem of paramsList) {
      switch (paramsItem.type) {
        case 'boolean':
        case 'string':
        case 'number':
          result[paramsItem.key] = this.getSourceFromLiteral(paramsItem)
          break
        case 'date':
          result[paramsItem.key] = this.getSourceFromDate(paramsItem)
      }
    }
    return result
  }

  getSourceFromLiteral(paramsItem: StringParam | NumberParam | BooleanParam) {
    return paramsItem.value
  }

  getSourceFromDate(paramsItem: DateParam) {
    const paramsValue = paramsItem.value
    const dateInstance = moment()

    switch (paramsValue.type) {
      case 'add':
        for (const opts of paramsValue.ops) {
          dateInstance.add(opts.amount, opts.unit)
        }
        break
      case 'subtract':
        for (const opts of paramsValue.ops) {
          dateInstance.subtract(opts.amount, opts.unit)
        }
        break
      case 'startOf':
        if (paramsValue.position === 'current') {
          dateInstance.startOf(paramsValue.unit)
        } else if (paramsValue.position === 'next') {
          dateInstance.startOf(paramsValue.unit).add(1, paramsValue.unit)
        } else if (paramsValue.position === 'previous') {
          dateInstance.startOf(paramsValue.unit).subtract(1, paramsValue.unit)
        }
        break
      case 'endOf':
        if (paramsValue.position === 'current') {
          dateInstance.endOf(paramsValue.unit)
        } else if (paramsValue.position === 'next') {
          dateInstance.endOf(paramsValue.unit).add(1, paramsValue.unit)
        } else if (paramsValue.position === 'previous') {
          dateInstance.endOf(paramsValue.unit).subtract(1, paramsValue.unit)
        }
        break
    }

    return dateInstance.toDate()
  }
}

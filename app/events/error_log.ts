import ErrorLog from '#models/error_log'
import { BaseEvent } from '@adonisjs/core/events'

export class ErrorLogChange extends BaseEvent {
  constructor(public errorLog: ErrorLog) {
    super()
  }
}

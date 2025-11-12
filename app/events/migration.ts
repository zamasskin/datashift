import type MigrationRun from '#models/migration_run'
import { BaseEvent } from '@adonisjs/core/events'

export class MigrationRunChange extends BaseEvent {
  constructor(public migrationRun: MigrationRun) {
    super()
  }
}

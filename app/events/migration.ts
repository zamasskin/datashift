import type MigrationRun from '#models/migration_run'
import { BaseEvent } from '@adonisjs/core/events'

export class MigrationChange extends BaseEvent {
  constructor(public migrationRun: MigrationRun) {
    super()
  }
}

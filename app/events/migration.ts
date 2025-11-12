import Migration from '#models/migration'
import type MigrationRun from '#models/migration_run'
import { BaseEvent } from '@adonisjs/core/events'

export class MigrationRunChange extends BaseEvent {
  constructor(public migrationRun: MigrationRun) {
    super()
  }
}

export class MigrationCreate extends BaseEvent {
  constructor(public migration: Migration) {
    super()
  }
}

export class MigrationUpdate extends BaseEvent {
  constructor(public migration: Migration) {
    super()
  }
}

export class MigrationRemove extends BaseEvent {
  constructor(public migration: Migration) {
    super()
  }
}

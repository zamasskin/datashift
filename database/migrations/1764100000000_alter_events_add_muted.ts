import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'events'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('muted').nullable().defaultTo(null)
    })

    // Backfill: если есть записи с type='mute' и value not null — перенесём
    try {
      await this.db.rawQuery(`UPDATE ${this.tableName} SET muted = value WHERE type = 'mute'`)
    } catch {}
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('muted')
    })
  }
}

import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    const hasFileId = await this.schema.hasColumn('users', 'file_id')
    if (!hasFileId) {
      this.schema.alterTable('users', (table) => {
        table
          .integer('file_id')
          .unsigned()
          .nullable()
          .references('id')
          .inTable('files')
          .onDelete('SET NULL')
      })
    }

    const hasUserId = await this.schema.hasColumn('files', 'user_id')
    if (hasUserId) {
      this.schema.alterTable('files', (table) => {
        table.dropForeign('user_id')
        table.dropColumn('user_id')
      })
    }
  }

  async down() {
    this.schema.alterTable('files', (table) => {
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
    })

    this.schema.alterTable('users', (table) => {
      table.dropColumn('file_id')
    })
  }
}

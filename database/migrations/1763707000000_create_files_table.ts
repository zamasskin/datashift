import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'files'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('user_id').unsigned().references('users.id').onDelete('CASCADE')

      table.string('original_name').notNullable()
      table.string('mime_type').notNullable()
      table.integer('size').notNullable()
      table.string('storage_key').notNullable()
      table.string('checksum').nullable()
      table.string('status').notNullable().defaultTo('uploaded')

      table.timestamp('created_at')
      table.timestamp('updated_at')

      table.index(['user_id'], 'files_user_id_idx')
      table.index(['status'], 'files_status_idx')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

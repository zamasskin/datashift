import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'error_user_states'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.integer('error_id').unsigned().references('errors.id').onDelete('CASCADE')

      table.integer('user_id').unsigned().references('users.id').onDelete('CASCADE')

      table.timestamp('read_at').nullable()
      table.timestamp('muted_until').nullable()
      table.boolean('muted').defaultTo(false)

      table.timestamp('created_at')
      table.timestamp('updated_at')

      table.unique(['error_id', 'user_id'])
      table.index(['user_id'], 'error_user_states_user_id_idx')
      table.index(['error_id'], 'error_user_states_error_id_idx')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

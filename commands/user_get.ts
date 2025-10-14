import { BaseCommand, args } from '@adonisjs/core/ace'

export default class UserGet extends BaseCommand {
  static commandName = 'user:get'
  static description = 'Get a user by email and print basic info'
  static options = { startApp: true }

  @args.string({ description: 'Email of the user', required: true })
  declare email: string

  async run() {
    const { default: User } = await import('#models/user')

    const user = await User.query().where('email', this.email).first()
    if (!user) {
      this.logger.error(`No user found for email: ${this.email}`)
      return
    }
    this.logger.success(
      `Found user: id=${user.id}, email=${user.email}, hash_len=${user.password.length}`
    )
    this.logger.info(user.password)
  }
}

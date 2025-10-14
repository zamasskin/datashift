import { BaseCommand, args, flags } from '@adonisjs/core/ace'

export default class UserDelete extends BaseCommand {
  static commandName = 'user:delete'
  static description = 'Delete a user from the database'
  static options = { startApp: true }

  @args.string({ description: 'Email of the user (if no id provided)', required: false })
  declare email?: string

  @flags.number({ description: 'User id', alias: 'i' })
  declare id?: number

  @flags.boolean({ description: 'Skip confirmation', alias: 'y' })
  declare yes?: boolean

  async run() {
    const { default: User } = await import('#models/user')

    let user: any = null

    if (this.id) {
      user = await User.query().where('id', this.id).first()
    } else if (this.email) {
      user = await User.query().where('email', this.email).first()
    } else {
      const inputEmail = await this.prompt.ask('Email')
      if (!inputEmail) {
        this.logger.error('Email is required (or use --id)')
        return
      }
      user = await User.query().where('email', inputEmail).first()
    }

    if (!user) {
      this.logger.error(
        this.id ? `No user found for id=${this.id}` : `No user found for email=${this.email}`
      )
      return
    }

    if (!this.yes) {
      const confirm = await this.prompt.confirm(`Delete user id=${user.id}, email=${user.email}?`)
      if (!confirm) {
        this.logger.info('Aborted')
        return
      }
    }

    await user.delete()
    this.logger.success(`Deleted user: id=${user.id}, email=${user.email}`)
  }
}

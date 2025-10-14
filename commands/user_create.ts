import { BaseCommand, flags, args } from '@adonisjs/core/ace'

export default class UserCreate extends BaseCommand {
  static commandName = 'user:create'
  static description = 'Create a new user in the database'
  static options = { startApp: true }

  @args.string({ description: 'Email of the user', required: false })
  declare email?: string

  @flags.string({ description: 'Full name', alias: 'n' })
  declare fullName?: string

  @flags.string({ description: 'Password', alias: 'p' })
  declare password?: string

  async run() {
    const { default: User } = await import('#models/user')
    const { default: Hash } = await import('@adonisjs/core/services/hash')

    const email = this.email ?? (await this.prompt.ask('Email'))
    const fullName =
      this.fullName ??
      (await this.prompt.ask('Full name (optional)', {
        default: '',
      }))
    const passwordInput = this.password ?? (await this.prompt.secure('Password'))

    if (!email) {
      this.logger.error('Email is required')
      return
    }
    if (!passwordInput) {
      this.logger.error('Password is required')
      return
    }

    // Check if user already exists
    const existing = await User.query().where('email', email).first()
    if (existing) {
      this.logger.error(`User with email ${email} already exists (id=${existing.id})`)
      return
    }

    const hashed = await Hash.use('scrypt').make(passwordInput)

    const user = await User.create({ email, fullName: fullName || null, password: hashed })
    this.logger.success(`User created: id=${user.id}, email=${user.email}`)
  }
}

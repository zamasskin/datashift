import { BaseCommand, args, flags } from '@adonisjs/core/ace'

export default class UserVerify extends BaseCommand {
  static commandName = 'user:verify'
  static description = 'Verify user credentials against the database'
  static options = { startApp: true }

  @args.string({ description: 'Email of the user', required: true })
  declare email: string

  @flags.string({ description: 'Password', alias: 'p' })
  declare password?: string

  async run() {
    const { default: User } = await import('#models/user')
    const { default: Hash } = await import('@adonisjs/core/services/hash')

    const password = this.password ?? (await this.prompt.secure('Password'))
    if (!password) {
      this.logger.error('Password is required')
      return
    }

    try {
      const user = await User.query().where('email', this.email).first()
      if (!user) {
        this.logger.error(`No user found for email: ${this.email}`)
        return
      }
      const hashed = user.password
      const ok = await Hash.use('scrypt').verify(hashed, password)
      const okTrimmedHash = await Hash.use('scrypt').verify(hashed.trim(), password)
      const okTrimmedBoth = await Hash.use('scrypt').verify(hashed.trim(), password.trim())
      this.logger.info(
        `lens: hash=${hashed.length}, hash.trim=${hashed.trim().length}, pw=${password.length}, pw.trim=${password.trim().length}`
      )
      if (ok || okTrimmedHash || okTrimmedBoth) {
        this.logger.success(
          `Password matches (ok=${ok}, okHashTrim=${okTrimmedHash}, okBothTrim=${okTrimmedBoth}) for id=${user.id}, email=${user.email}`
        )
      } else {
        this.logger.error('Password does not match (including trims)')
      }
    } catch (error) {
      this.logger.error(
        `Verification failed: ${(error && (error as Error).message) || 'Unknown error'}`
      )
    }
  }
}

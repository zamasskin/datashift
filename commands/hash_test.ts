import { BaseCommand, flags } from '@adonisjs/core/ace'

export default class HashTest extends BaseCommand {
  static commandName = 'hash:test'
  static description = 'Test hashing and verifying with scrypt'
  static options = { startApp: true }

  @flags.string({ description: 'Password', alias: 'p' })
  declare password?: string

  @flags.string({ description: 'Existing hash to verify', alias: 'h' })
  declare hash?: string

  async run() {
    const { default: Hash } = await import('@adonisjs/core/services/hash')
    const password = this.password ?? (await this.prompt.secure('Password'))
    if (!password) {
      this.logger.error('Password is required')
      return
    }
    if (this.hash) {
      const ok = await Hash.use('scrypt').verify(this.hash, password)
      this.logger[ok ? 'success' : 'error'](
        ok ? 'Verify OK (existing hash)' : 'Verify FAIL (existing hash)'
      )
    } else {
      const hashed = await Hash.use('scrypt').make(password)
      const ok = await Hash.use('scrypt').verify(hashed, password)
      this.logger.info(`hash=${hashed.slice(0, 30)}...`)
      this.logger[ok ? 'success' : 'error'](ok ? 'Verify OK' : 'Verify FAIL')
    }
  }
}

import i18nManager from '@adonisjs/i18n/services/main'
import type { HttpContext } from '@adonisjs/core/http'

export default class SettingsController {
  /**
   * Change locale and redirect back (full page reload).
   * Accepts either `code` query param or `code` in request body.
   */
  async changeLocale(ctx: HttpContext) {
    const code = (ctx.request.input('code') || ctx.request.qs().code || '').toString().trim()
    const supported = i18nManager.getSupportedLocaleFor([code]) || i18nManager.defaultLocale

    ctx.response.cookie('locale', supported, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 year
    })

    return ctx.response.redirect().back()
  }
}

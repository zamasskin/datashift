import { I18n } from '@adonisjs/i18n'
import i18nManager from '@adonisjs/i18n/services/main'
import type { NextFn } from '@adonisjs/core/types/http'
import { type HttpContext, RequestValidator } from '@adonisjs/core/http'

/**
 * The "DetectUserLocaleMiddleware" middleware uses i18n service to share
 * a request specific i18n object with the HTTP Context
 */
export default class DetectUserLocaleMiddleware {
  /**
   * Using i18n for validation messages. Applicable to only
   * "request.validateUsing" method calls
   */
  static {
    RequestValidator.messagesProvider = (ctx) => {
      return ctx.i18n.createMessagesProvider()
    }
  }

  /**
   * This method reads the user language from the "Accept-Language"
   * header and returns the best matching locale by checking it
   * against the supported locales.
   *
   * Feel free to use different mechanism for finding user language.
   */
  protected getRequestLocale(ctx: HttpContext) {
    const cookieLocale = ctx.request.cookie('locale') as string | undefined
    if (cookieLocale) {
      const supported = i18nManager.getSupportedLocaleFor([cookieLocale])
      if (supported) {
        return supported
      }
    }
    // Фолбэк: пробуем взять из заголовка Accept-Language
    const acceptLanguage = ctx.request.header('accept-language')
    if (acceptLanguage) {
      const langs = acceptLanguage
        .split(',')
        .map((p) => p.split(';')[0].trim())
        .filter(Boolean)

      const supported = i18nManager.getSupportedLocaleFor(langs)
      if (supported) {
        return supported
      }
    }

    // В крайнем случае — дефолтная локаль
    return i18nManager.defaultLocale
  }

  async handle(ctx: HttpContext, next: NextFn) {
    /**
     * Finding user language
     */
    const language = this.getRequestLocale(ctx)

    /**
     * Assigning i18n property to the HTTP context
     */
    ctx.i18n = i18nManager.locale(language || i18nManager.defaultLocale)

    /**
     * Binding I18n class to the request specific instance of it.
     * Doing so will allow IoC container to resolve an instance
     * of request specific i18n object when I18n class is
     * injected somewhere.
     */
    ctx.containerResolver.bindValue(I18n, ctx.i18n)

    /**
     * Sharing request specific instance of i18n with edge
     * templates.
     *
     * Remove the following block of code, if you are not using
     * edge templates.
     */
    if ('view' in ctx) {
      ctx.view.share({ i18n: ctx.i18n })
    }

    /**
     * Sharing translations and locale to inertia view
     */
    if ('inertia' in ctx) {
      // Проверяем, что контекст поддерживает Inertia
      ctx.inertia.share({
        locale: language,
        translations: i18nManager.getTranslationsFor(language),
      })
    }

    return next()
  }
}

/**
 * Notify TypeScript about i18n property
 */
declare module '@adonisjs/core/http' {
  export interface HttpContext {
    i18n: I18n
  }
}

import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'

export default class LoginController {
  async create(ctx: HttpContext) {
    const { inertia, request, i18n } = ctx
    const messages = {
      title: i18n.t('login.title'),
      welcome: i18n.t('login.welcome'),
      prompt: i18n.t('login.prompt'),
      email: i18n.t('login.email'),
      password: i18n.t('login.password'),
      submit: i18n.t('login.submit'),
      submitting: i18n.t('login.submitting'),
      termsText1: i18n.t('login.termsText1'),
      termsService: i18n.t('login.termsService'),
      termsText2: i18n.t('login.termsText2'),
      privacyPolicy: i18n.t('login.privacyPolicy'),
    }

    return inertia.render('login', {
      csrfToken: request.csrfToken,
      messages,
    })
  }

  async store(ctx: HttpContext) {
    const { request, auth, response, inertia, i18n } = ctx
    const email = request.input('email')
    const password = request.input('password')

    if (!email || !password) {
      const messages = {
        title: i18n.t('login.title'),
        welcome: i18n.t('login.welcome'),
        prompt: i18n.t('login.prompt'),
        email: i18n.t('login.email'),
        password: i18n.t('login.password'),
        submit: i18n.t('login.submit'),
        submitting: i18n.t('login.submitting'),
        termsText1: i18n.t('login.termsText1'),
        termsService: i18n.t('login.termsService'),
        termsText2: i18n.t('login.termsText2'),
        privacyPolicy: i18n.t('login.privacyPolicy'),
      }
      return inertia.render(
        'login',
        {
          csrfToken: request.csrfToken,
          errors: { login: i18n.t('login.errors.missingCredentials') },
          messages,
        },
        { status: 422 }
      )
    }

    try {
      const user = await User.verifyCredentials(email, password)
      await auth.use('web').login(user)
      return response.redirect('/')
    } catch (err) {
      const messages = {
        title: i18n.t('login.title'),
        welcome: i18n.t('login.welcome'),
        prompt: i18n.t('login.prompt'),
        email: i18n.t('login.email'),
        password: i18n.t('login.password'),
        submit: i18n.t('login.submit'),
        submitting: i18n.t('login.submitting'),
        termsText1: i18n.t('login.termsText1'),
        termsService: i18n.t('login.termsService'),
        termsText2: i18n.t('login.termsText2'),
        privacyPolicy: i18n.t('login.privacyPolicy'),
      }
      return inertia.render(
        'login',
        {
          csrfToken: request.csrfToken,
          errors: { login: i18n.t('login.errors.invalidCredentials') },
          messages,
        },
        { status: 422 }
      )
    }
  }
}

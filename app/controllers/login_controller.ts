import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'

export default class LoginController {
  async create(ctx: HttpContext) {
    const { inertia, request } = ctx
    return inertia.render('login', {
      csrfToken: request.csrfToken,
    })
  }

  async store(ctx: HttpContext) {
    const { request, auth, response, inertia, i18n } = ctx
    const email = request.input('email')
    const password = request.input('password')

    if (!email || !password) {
      return inertia.render(
        'login',
        {
          csrfToken: request.csrfToken,
          errors: { login: i18n.t('login.errors.missingCredentials') },
        },
        { status: 422 }
      )
    }

    try {
      const user = await User.verifyCredentials(email, password)
      await auth.use('web').login(user)
      return response.redirect('/')
    } catch (err) {
      return inertia.render(
        'login',
        {
          csrfToken: request.csrfToken,
          errors: { login: i18n.t('login.errors.invalidCredentials') },
        },
        { status: 422 }
      )
    }
  }
}

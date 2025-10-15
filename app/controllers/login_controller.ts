import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'

export default class LoginController {
  async create({ inertia, request }: HttpContext) {
    return inertia.render('login', {
      csrfToken: request.csrfToken,
    })
  }

  async store({ request, auth, response, inertia }: HttpContext) {
    const email = request.input('email')
    const password = request.input('password')

    if (!email || !password) {
      return inertia.render(
        'login',
        {
          csrfToken: request.csrfToken,
          errors: { login: 'Укажите e‑mail и пароль.' },
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
          errors: { login: 'Неверный e‑mail или пароль. Попробуйте снова.' },
        },
        { status: 422 }
      )
    }
  }
}

import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'

export default class LoginController {
  async create({ inertia }: HttpContext) {
    return inertia.render('login')
  }

  async store({ request, auth, response }: HttpContext) {
    const email = request.input('email')
    const password = request.input('password')

    if (!email || !password) {
      return response.redirect('/login')
    }

    try {
      const user = await User.verifyCredentials(email, password)
      await auth.use('web').login(user)
      return response.redirect('/')
    } catch {
      return response.redirect('/login')
    }
  }
}

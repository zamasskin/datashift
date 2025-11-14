import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import User from '#models/user'

export default class ProfileController {
  async edit({ inertia, auth }: HttpContext) {
    const user = auth.user as User | null
    if (!user) {
      return inertia.render('login')
    }
    return inertia.render('profile', {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
      },
    })
  }

  async update({ request, response, auth }: HttpContext) {
    const user = auth.user as User | null
    if (!user) {
      response.status(401)
      return response.send({ error: 'Unauthorized' })
    }

    const schema = vine.compile(
      vine.object({
        email: vine.string().email(),
        fullName: vine.string().trim().minLength(1).maxLength(128).optional(),
        avatarUrl: vine.string().url().maxLength(2048).optional().nullable(),
        password: vine.string().minLength(8).optional(),
      })
    )

    const payload = await schema.validate(request.all())

    // Обновляем поля профиля; пароль — отдельно, если передан
    user.email = payload.email
    if (typeof payload.fullName !== 'undefined') user.fullName = payload.fullName || null
    if (typeof payload.avatarUrl !== 'undefined') user.avatarUrl = payload.avatarUrl || null
    if (payload.password) user.password = payload.password
    await user.save()

    return response.redirect('/profile')
  }
}

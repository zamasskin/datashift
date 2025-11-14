import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import User from '#models/user'

function ensureAdmin(ctx: HttpContext): User | null {
  const current = ctx.auth.user as User | null
  if (!current) return null
  const role = (current.role || 'user').toLowerCase()
  if (role !== 'admin') return null
  return current
}

export default class UsersController {
  async settings({ inertia, auth, response }: HttpContext) {
    const admin = ensureAdmin({ auth } as any)
    if (!admin) {
      response.status(403)
      return response.redirect('/')
    }

    const users = await User.query().orderBy('id', 'asc')
    const payload = users.map((u) => ({
      id: u.id,
      email: u.email,
      fullName: u.fullName,
      role: u.role,
      createdAt: (u as any).createdAt?.toISO?.() || null,
    }))

    return inertia.render('admin/settings', { users: payload })
  }

  async store({ request, response, auth, inertia }: HttpContext) {
    const admin = ensureAdmin({ auth } as any)
    if (!admin) {
      response.status(403)
      return response.send({ error: 'Forbidden' })
    }

    try {
      const schema = vine.compile(
        vine.object({
          email: vine.string().email(),
          fullName: vine.string().trim().minLength(1).maxLength(128).optional(),
          password: vine.string().minLength(8),
          role: vine.enum(['user', 'admin']).optional(),
        })
      )

      const payload = await schema.validate(request.all())

      const existing = await User.findBy('email', payload.email)
      if (existing) {
        return inertia.render(
          'admin/settings',
          { errors: { email: 'Пользователь с таким email уже существует' } },
          { status: 422 }
        )
      }

      const u = new User()
      u.email = payload.email
      u.fullName = payload.fullName || null
      u.password = payload.password
      u.role = payload.role || 'user'
      await u.save()

      return response.redirect('/settings')
    } catch (error: any) {
      const fieldErrors = this.mapVineErrors(error)
      response.status(422)
      return inertia.render('admin/settings', { errors: fieldErrors })
    }
  }

  async update({ params, request, response, auth, inertia }: HttpContext) {
    const admin = ensureAdmin({ auth } as any)
    if (!admin) {
      response.status(403)
      return response.send({ error: 'Forbidden' })
    }

    try {
      const schema = vine.compile(
        vine.object({
          email: vine.string().email().optional(),
          fullName: vine.string().trim().minLength(1).maxLength(128).optional(),
          password: vine.string().minLength(8).optional(),
          role: vine.enum(['user', 'admin']).optional(),
        })
      )

      const payload = await schema.validate(request.all())
      const user = await User.findOrFail(Number(params.id))

      if (payload.email && payload.email !== user.email) {
        const exists = await User.findBy('email', payload.email)
        if (exists) {
          return inertia.render(
            'admin/settings',
            { errors: { email: 'Email уже занят' } },
            { status: 422 }
          )
        }
        user.email = payload.email
      }
      if (typeof payload.fullName !== 'undefined') user.fullName = payload.fullName || null
      if (typeof payload.role !== 'undefined') user.role = payload.role
      if (payload.password) user.password = payload.password

      await user.save()

      return response.redirect('/settings')
    } catch (error: any) {
      const fieldErrors = this.mapVineErrors(error)
      response.status(422)
      return inertia.render('admin/settings', { errors: fieldErrors })
    }
  }

  async destroy({ request, response, auth }: HttpContext) {
    const admin = ensureAdmin({ auth } as any)
    if (!admin) {
      response.status(403)
      return response.send({ error: 'Forbidden' })
    }
    const id = Number(request.input('id'))
    const redirectTo = String(request.input('redirectTo') || '')
    if (!id) {
      response.status(400)
      return response.send({ error: 'Missing id' })
    }
    const user = await User.find(id)
    if (!user) {
      response.status(404)
      return response.send({ error: 'User not found' })
    }
    await user.delete()
    if (redirectTo) {
      return response.redirect(redirectTo)
    }
    return response.redirect('/settings')
  }

  private mapVineErrors(error: any): Record<string, string> {
    if (!error || typeof error !== 'object') return { error: 'Validation failed' }
    const out: Record<string, string> = {}
    const messages = error.messages || error?.[0]?.messages || {}
    const errors = messages?.errors || []
    for (const e of errors) {
      if (e.field) out[e.field] = e.message || 'Invalid value'
    }
    if (!Object.keys(out).length) out.error = 'Validation failed'
    return out
  }
}

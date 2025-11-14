import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import User from '#models/user'
import File from '#models/file'
import app from '@adonisjs/core/services/app'
import fs from 'node:fs'

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
        role: user.role,
      },
    })
  }

  async update({ request, response, inertia, auth }: HttpContext) {
    const user = auth.user as User | null
    if (!user) {
      response.status(401)
      return response.send({ error: 'Unauthorized' })
    }
    try {
      const schema = vine.compile(
        vine.object({
          email: vine.string().email(),
          fullName: vine.string().trim().minLength(1).maxLength(128).optional(),
        })
      )

      const payload = await schema.validate(request.all())

      // Обновляем поля профиля
      user.email = payload.email
      if (typeof payload.fullName !== 'undefined') user.fullName = payload.fullName || null

      // Опциональная загрузка аватара вместе с основными полями
      const avatar = request.file('avatar', {
        size: '5mb',
        extnames: ['jpg', 'jpeg', 'png', 'webp'],
      })

      if (avatar) {
        if (!avatar.isValid) {
          const firstError = Array.isArray(avatar.errors) && avatar.errors[0]?.message
          const fieldErrors = {
            avatar: firstError || 'Недопустимый файл аватара',
          }
          return inertia.render(
            'profile',
            {
              user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
              },
              errors: fieldErrors,
            },
            { status: 422 }
          )
        }

        const dir = app.publicPath('uploads/avatars')
        await fs.promises.mkdir(dir, { recursive: true })

        const fileName = `${user.id}_${Date.now()}.${avatar.extname}`
        await avatar.move(dir, { name: fileName })

        const storageKey = `uploads/avatars/${fileName}`
        const f = new File()
        f.originalName = avatar.clientName || fileName
        f.mimeType = avatar.type || 'application/octet-stream'
        f.size = avatar.size
        f.storageKey = storageKey
        f.checksum = null
        f.status = 'uploaded'
        await f.save()
        user.fileId = f.id
      }

      await user.save()

      return response.redirect('/profile')
    } catch (error: any) {
      const fieldErrors = this.mapVineErrors(error)
      return inertia.render(
        'profile',
        {
          user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
          },
          errors: fieldErrors,
        },
        { status: 422 }
      )
    }
  }

  async changePassword({ request, response, auth }: HttpContext) {
    const user = auth.user as User | null
    if (!user) {
      response.status(401)
      return response.send({ error: 'Unauthorized' })
    }
    try {
      const schema = vine.compile(
        vine.object({
          password: vine.string().minLength(8),
          passwordConfirmation: vine.string(),
        })
      )

      const payload = await schema.validate(request.all())

      if (payload.password !== payload.passwordConfirmation) {
        const errors = { passwordConfirmation: 'Пароль и подтверждение не совпадают' }
        return response.status(422).send({ errors })
      }

      user.password = payload.password
      await user.save()

      return response.ok({ success: true })
    } catch (error: any) {
      const fieldErrors = this.mapVineErrors(error)
      return response.status(422).send({ errors: fieldErrors })
    }
  }

  async uploadAvatar({ request, response, auth }: HttpContext) {
    const user = auth.user as User | null
    if (!user) {
      response.status(401)
      return response.send({ error: 'Unauthorized' })
    }

    const avatar = request.file('avatar', {
      size: '5mb',
      extnames: ['jpg', 'jpeg', 'png', 'webp'],
    })

    if (!avatar) {
      response.status(400)
      return response.send({ error: 'No file provided' })
    }

    if (!avatar.isValid) {
      response.status(422)
      return response.send({ error: avatar.errors })
    }

    const dir = app.publicPath('uploads/avatars')
    await fs.promises.mkdir(dir, { recursive: true })

    const fileName = `${user.id}_${Date.now()}.${avatar.extname}`
    await avatar.move(dir, { name: fileName })

    const storageKey = `uploads/avatars/${fileName}`
    const f = new File()
    f.originalName = avatar.clientName || fileName
    f.mimeType = avatar.type || 'application/octet-stream'
    f.size = avatar.size
    f.storageKey = storageKey
    f.checksum = null
    f.status = 'uploaded'
    await f.save()
    user.fileId = f.id
    return response.redirect('/profile')
  }

  /**
   * Преобразует ошибки Vine в { field: message }
   */
  private mapVineErrors(error: any): Record<string, string> {
    const fieldErrors: Record<string, string> = {}
    if (error?.messages && Array.isArray(error.messages)) {
      for (const e of error.messages) {
        if (!e.field || !e.message) continue
        const fieldName = String(e.field)
        fieldErrors[fieldName] = String(e.message)
      }
    }
    return fieldErrors
  }
}

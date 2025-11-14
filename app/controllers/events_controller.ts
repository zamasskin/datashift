import type { HttpContext } from '@adonisjs/core/http'
import EventLog from '#models/event'

export default class EventsController {
  async mute({ request, auth, response }: HttpContext) {
    const id = Number(request.input('id'))
    if (!id || !auth.user) {
      return response.badRequest({ updated: 0 })
    }
    const updated = await EventLog.query()
      .where('id', id)
      .where('userId', auth.user.id)
      .update({ muted: true })

    return response.json({ updated })
  }
}

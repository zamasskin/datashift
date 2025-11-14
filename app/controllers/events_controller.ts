import type { HttpContext } from '@adonisjs/core/http'
import EventLog from '#models/event'
import { EventUpdate, EventsCleared } from '#events/event'

export default class EventsController {
  async mute({ request, auth, response }: HttpContext) {
    const id = Number(request.input('id'))
    if (!id || !auth.user) {
      return response.badRequest({ updated: 0 })
    }
    const event = await EventLog.query().where('id', id).where('userId', auth.user.id).first()
    if (!event) {
      return response.json({ updated: 0 })
    }
    event.muted = true
    await event.save()
    try {
      EventUpdate.dispatch(event)
    } catch {}
    return response.json({ updated: 1 })
  }

  async clear({ auth, response }: HttpContext) {
    if (!auth.user) {
      return response.badRequest({ updated: 0 })
    }
    const updated = await EventLog.query()
      .where('userId', auth.user.id)
      .where('muted', false)
      .update({ muted: true })
    const updatedCount = Array.isArray(updated) ? Number(updated[0] ?? 0) : Number(updated || 0)
    try {
      EventsCleared.dispatch(auth.user.id, updatedCount)
    } catch {}
    return response.json({ updated: updatedCount })
  }
}

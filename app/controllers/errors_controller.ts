import type { HttpContext } from '@adonisjs/core/http'
import ErrorLog from '#models/error_log'
import ErrorUserState from '#models/error_user_state'
import { DateTime } from 'luxon'

export default class ErrorsController {
  async index({ inertia, request }: HttpContext) {
    const severity = request.input('severity') as 'error' | 'warning' | 'info' | undefined
    const status = request.input('status') as 'open' | 'resolved' | undefined
    const page = Number(request.input('page') || 1)
    const perPage = Math.max(1, Math.min(Number(request.input('perPage') || 10), 200))

    const query = ErrorLog.query()
      .orderBy('occurredAt', 'desc')
      .orderBy('createdAt', 'desc')
      .select([
        'id',
        'severity',
        'message',
        'occurred_at',
        'status',
        'code',
        'migration_id',
        'migration_run_id',
      ])

    if (severity) query.where('severity', severity)
    if (status) query.where('status', status)

    const errors = await query.paginate(page, perPage)

    return inertia.render('errors/index', {
      errors,
      filters: { severity: severity || null, status: status || null },
    })
  }

  async show({ inertia, params, auth }: HttpContext) {
    const id = Number(params.id)
    const error = await ErrorLog.findOrFail(id)

    const userId = auth.user?.id
    const userState = userId
      ? await ErrorUserState.query().where('userId', userId).where('errorId', id).first()
      : null

    return inertia.render('errors/show', {
      error: {
        id: error.id,
        uuid: error.uuid,
        severity: error.severity,
        status: error.status,
        code: error.code,
        message: error.message,
        occurredAt: error.occurredAt?.toISO() ?? null,
        migrationId: error.migrationId,
        migrationRunId: error.migrationRunId,
        trigger: error.trigger,
        source: error.source,
        environment: error.environment,
        hostname: error.hostname,
        stack: error.stack,
        context: error.context || {},
      },
      state: {
        read: Boolean(userState?.readAt),
        muted: Boolean(userState?.muted),
      },
    })
  }

  async latest({ auth }: HttpContext) {
    const userId = auth.user?.id
    const latest = await ErrorLog.query()
      .orderBy('occurredAt', 'desc')
      .orderBy('createdAt', 'desc')
      .select([
        'id',
        'severity',
        'message',
        'occurred_at',
        'status',
        'code',
        'migration_id',
        'migration_run_id',
      ])
      .limit(5)

    const ids = latest.map((e) => e.id)
    const states = userId
      ? await ErrorUserState.query().where('userId', userId).whereIn('errorId', ids)
      : []
    const stateByErrorId = new Map(states.map((s) => [s.errorId, s]))

    return latest.map((e) => {
      const s = stateByErrorId.get(e.id)
      return {
        id: e.id,
        severity: e.severity,
        message: e.message,
        occurredAt: e.occurredAt?.toISO() ?? null,
        status: e.status,
        code: e.code,
        migrationId: e.migrationId,
        migrationRunId: e.migrationRunId,
        read: Boolean(s?.readAt),
        muted: Boolean(s?.muted),
      }
    })
  }

  async markRead({ auth, request }: HttpContext) {
    const userId = auth.user?.id
    const ids = (request.input('ids') as number[]) || []
    if (!userId || !Array.isArray(ids) || ids.length === 0) {
      return { updated: 0 }
    }
    let count = 0
    for (const errorId of ids) {
      const state = await ErrorUserState.query()
        .where('userId', userId)
        .where('errorId', errorId)
        .first()
      if (state) {
        state.readAt = DateTime.now()
        await state.save()
      } else {
        await ErrorUserState.create({ userId, errorId, readAt: DateTime.now(), muted: false })
      }
      count++
    }
    return { updated: count }
  }

  async mute({ auth, request }: HttpContext) {
    const userId = auth.user?.id
    const errorId = Number(request.input('id') || 0)
    const muted = Boolean(request.input('muted'))
    if (!userId || !errorId) return { updated: 0 }

    const state = await ErrorUserState.query()
      .where('userId', userId)
      .where('errorId', errorId)
      .first()
    if (state) {
      state.muted = muted
      await state.save()
    } else {
      await ErrorUserState.create({ userId, errorId, muted, readAt: null })
    }
    return { updated: 1 }
  }
}

import Migration from '#models/migration'
import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'

export default class MigrationsController {
  async index({ inertia }: HttpContext) {
    const migrations = await Migration.query().preload('user')
    return inertia.render('migrations', { migrations })
  }

  async edit({ inertia, params }: HttpContext) {
    const migration = await Migration.findOrFail(params.id)
    return inertia.render('migration_edit', { migration })
  }

  async store({ request, response, auth }: HttpContext) {
    const name = request.input('name') as string
    if (name && typeof name === 'string') {
      const migration = await Migration.create({
        name,
        isActive: true,
        fetchConfigs: [],
        saveMappings: [],
        cronExpression: null,
        createdBy: auth.user?.id,
      })

      response.redirect(`/migrations/${migration.id}`)
    } else {
      return response.status(422).send({ error: 'Invalid migration name' })
    }
  }

  async update({ params, request, response }: HttpContext) {
    const id = Number(params.id)
    if (!Number.isFinite(id)) {
      return response.status(404).send({ error: 'Migration not found' })
    }

    const schema = vine.compile(
      vine.object({
        name: vine.string().trim().minLength(3).maxLength(64),
        cronExpression: vine.string().optional(),
      })
    )

    try {
      const { name, cronExpression } = await schema.validate(
        request.only(['name', 'cronExpression'])
      )
      const migration = await Migration.find(id)
      if (!migration) {
        return response.status(404).send({ error: 'Migration not found' })
      }

      migration.merge({ name, cronExpression })
      await migration.save()

      return response.redirect(`/migrations/${migration.id}`)
    } catch (error: any) {
      const message = error?.message ? String(error.message) : 'Укажите корректное имя'
      return response.status(422).send({ errors: { name: message } })
    }
  }

  async storeFetchConfig({}: HttpContext) {
    // TODO: Add validation
  }

  async updateFetchConfig({}: HttpContext) {
    // TODO: Add validation
  }

  async destroyFetchConfig({}: HttpContext) {
    // TODO: Add validation
  }

  async updateSaveMapping({}: HttpContext) {
    // TODO: Add validation
  }

  async storeSaveMapping({}: HttpContext) {
    // TODO: Add validation
  }

  async destroySaveMapping({}: HttpContext) {
    // TODO: Add validation
  }

  async destroy({ request, response }: HttpContext) {
    try {
      const { ids } = await this.validateDeleteIds(request)
      const uniqueIds = Array.from(new Set(ids))

      // Проверяем, какие записи существуют и принадлежат текущему пользователю
      const existing = await Migration.query().whereIn('id', uniqueIds)

      const existingIds = existing.map((r) => r.id)
      const nonExistingIds = uniqueIds.filter((id) => !existingIds.includes(id))

      if (nonExistingIds.length > 0) {
        return response
          .status(422)
          .send({ error: `Migrations with IDs ${nonExistingIds.join(', ')} do not exist` })
      }

      await Migration.query().whereIn('id', uniqueIds).delete()

      return response.status(200).send({ message: 'Migrations deleted successfully' })
    } catch (error) {
      return response.status(500).send({ error: 'Internal server error' })
    }
  }

  /**
   * Валидация массива идентификаторов для удаления
   */
  private async validateDeleteIds(request: HttpContext['request']): Promise<{ ids: number[] }> {
    const schema = vine.compile(
      vine.object({
        ids: vine.array(vine.number().withoutDecimals().positive()).minLength(1),
      })
    )

    return schema.validate(request.only(['ids']))
  }
}

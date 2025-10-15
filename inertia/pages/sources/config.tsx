import * as z from 'zod'

export const types = [
  { title: 'MySQL', value: 'mysql' },
  { title: 'PostgreSQL', value: 'postgres' },
  { title: 'SQLite', value: 'sqlite' },
]

export const typesIcon: Record<string, string> = {
  mysql: '/icons/mysql.png',
  postgres: '/icons/postgresql.png',
  sqlite: '/icons/sqlite.png',
}

const sqlConfigSchema = z.object({
  host: z.string().min(3).max(64).optional(),
  port: z.number().int().min(1).max(65535).optional(),
  database: z.string().min(3).max(64),
  username: z.string().min(3).max(64),
  password: z.string().min(3).max(64),
})

const sqliteConfigSchema = z.object({
  file: z.string().min(1, 'Укажите путь к файлу БД'),
})

const typeUnion = z.discriminatedUnion('type', [
  z.object({ type: z.literal('mysql'), config: sqlConfigSchema }),
  z.object({ type: z.literal('postgres'), config: sqlConfigSchema }),
  z.object({ type: z.literal('sqlite'), config: sqliteConfigSchema }),
])

const rootSchema = z.object({
  name: z.string().min(3).max(64),
})

export const schemaInsert = rootSchema.and(typeUnion)
export const schemaUpdate = rootSchema.and(typeUnion).and(z.object({ id: z.number().int().min(1) }))

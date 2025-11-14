/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
const HomeController = () => import('#controllers/home_controller')
const ErrorsController = () => import('#controllers/errors_controller')
const StreamsController = () => import('#controllers/streams_controller')
const MigrationsController = () => import('#controllers/migrations_controller')
const LoginController = () => import('#controllers/login_controller')
const DataSourcesController = () => import('#controllers/data_sources_controller')
const DatasetsController = () => import('#controllers/datasets_controller')
const SqlController = () => import('#controllers/sql_controller')
const UsersController = () => import('#controllers/users_controller')
const SearchController = () => import('#controllers/search_controller')
const MetricsController = () => import('#controllers/metrics_controller')

// Login routes
router.get('/login', [LoginController, 'create']).middleware(middleware.guest())
router.post('/login', [LoginController, 'store'])

// Logout
router.post('/logout', async ({ auth, response }) => {
  await auth.use('web').logout()
  return response.redirect('/login')
})

router
  .group(() => {
    router.get('/', [HomeController, 'index'])
    // Unified REST search
    router.get('/search', [SearchController, 'index'])
    router.get('/metrics/dashboard', [MetricsController, 'dashboard'])

    // SSE
    router.get('/stream', [StreamsController, 'stream'])

    router.get('/migrations', [MigrationsController, 'index'])
    router.post('/migrations', [MigrationsController, 'store'])
    router.post('/migrations/stop', [MigrationsController, 'stop'])
    router.get('/migrations/:id', [MigrationsController, 'edit'])
    router.put('/migrations/:id', [MigrationsController, 'update'])
    router.delete('/migrations', [MigrationsController, 'destroy'])
    router.post('/migrations/fetch-config-test', [MigrationsController, 'fetchConfigTest'])
    router.post('/migrations/run', [MigrationsController, 'run'])

    // Data sources
    router.get('/sources', [DataSourcesController, 'index'])
    router.post('/sources', [DataSourcesController, 'store'])
    router.put('/sources/:id', [DataSourcesController, 'update'])
    router.delete('/sources', [DataSourcesController, 'destroy'])

    // Datasets
    router.get('/datasets', [DatasetsController, 'index'])
    router.post('/datasets/test-sql', [DatasetsController, 'testSql'])
    router.post('/datasets/test-dataset', [DatasetsController, 'testDataset'])

    // SQL
    router.post('/sql/tables', [SqlController, 'listTables'])
    router.post('/sql/columns', [SqlController, 'listColumns'])

    router.on('/tasks').renderInertia('tasks/index')

    // Settings & users management (without /admin prefix)
    router.get('/settings', [UsersController, 'settings'])
    router.post('/users', [UsersController, 'store'])
    router.put('/users/:id', [UsersController, 'update'])
    router.delete('/users', [UsersController, 'destroy'])
    router.on('/help').renderInertia('help/index')
    router.get('/errors', [ErrorsController, 'index'])
    router.get('/errors/:id', [ErrorsController, 'show'])
    router.get('/errors/latest', [ErrorsController, 'latest'])
    router.post('/errors/mark-read', [ErrorsController, 'markRead'])
    router.post('/errors/mute', [ErrorsController, 'mute'])

    // Profile
    const ProfileController = () => import('#controllers/profile_controller')
    router.get('/profile', [ProfileController, 'edit'])
    router.put('/profile', [ProfileController, 'update'])
    router.post('/profile/avatar', [ProfileController, 'uploadAvatar'])
  })
  .middleware(middleware.auth())

router.on('/example').renderInertia('example')

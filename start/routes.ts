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
const LoginController = () => import('#controllers/login_controller')
const DataSourcesController = () => import('#controllers/data_sources_controller')

// Login routes
router.get('/login', [LoginController, 'create']).middleware(middleware.guest())
router.post('/login', [LoginController, 'store'])

// Logout
router.post('/logout', async ({ auth, response }) => {
  await auth.use('web').logout()
  return response.redirect('/login')
})

// Home (protected)

router
  .group(() => {
    router.on('/').renderInertia('home')

    // Data sources
    router.get('/sources', [DataSourcesController, 'index'])
    router.post('/sources', [DataSourcesController, 'store'])

    router.on('/datasets').renderInertia('datasets/index')
    router.on('/migrations').renderInertia('migrations/index')
    router.on('/tasks').renderInertia('tasks/index')
    router.on('/settings').renderInertia('settings/index')
    router.on('/help').renderInertia('help/index')
  })
  .middleware(middleware.auth())

router.on('/example').renderInertia('example')

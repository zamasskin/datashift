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
    router.on('/sources').renderInertia('sources/list/page')
    router.on('/datasets').renderInertia('datasets/index')
    router.on('/migrations').renderInertia('migrations/index')
    router.on('/tasks').renderInertia('tasks/index')
  })
  .middleware(middleware.auth())

router.on('/example').renderInertia('example')

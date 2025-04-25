/**
 * plugins/index.ts
 *
 * Automatically included in `./src/main.ts`
 */

// Plugins
import vuetify from './vuetify'
import router from '../router'
import loginService from './loginService'
import i18n from './i18n'

// Types
import type { App } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

export function registerPlugins (app: App) {
  const pinia = createPinia()
  pinia.use(piniaPluginPersistedstate)
  app
    .use(pinia)
    .use(vuetify)
    .use(router)
    .use(i18n)

  // Register login service
  loginService(app)
}

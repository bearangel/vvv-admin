/**
 * plugins/index.ts
 *
 * Automatically included in `./src/main.ts`
 */

// Plugins
import vuetify from './vuetify'
import router from '../router'

// Types
import type { App } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

export function registerPlugins (app: App) {
  const pinia = createPinia()
  pinia.use(piniaPluginPersistedstate)
  app
    .use(vuetify)
    .use(router)
    .use(pinia)
}

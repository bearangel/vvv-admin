/**
 * plugins/loginService.ts
 *
 * Login service plugin
 */

// Import login services to ensure they are registered with the IoC container
import '@/services/login';

// Types
import type { App } from 'vue';

export function registerLoginService(app: App) {
  // Nothing to do here, services are registered via IoC container
  console.log('Login service plugin registered');
}

export default registerLoginService;

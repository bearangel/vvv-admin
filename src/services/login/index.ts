// Import all login service implementations
import './MockLoginService';
import './SupabaseLoginService';
import { LoginServiceProvider } from './LoginServiceProvider';
import { InversifyUtils } from '@/lib/inversify/inversifyUtils';

// Export the login service provider
export const loginServiceProvider = InversifyUtils.getBean(LoginServiceProvider);

// Export the login service interface and service identifier
export * from './ILoginService';

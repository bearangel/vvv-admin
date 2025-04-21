import { type ILoginService, LOGIN_SERVICE } from './ILoginService';
import { InversifyUtils } from '@/lib/inversify/inversifyUtils';
import { Singleton } from '@/lib/inversify/inversifyDecorators';

/**
 * 登录服务提供者
 * 根据环境变量选择使用哪个登录服务实现
 */
@Singleton()
export class LoginServiceProvider {
  private loginService: ILoginService;

  constructor() {
    // 从环境变量获取登录服务类型，默认为mock
    const loginServiceType = import.meta.env.VITE_SERVICE_TYPE || 'mock';

    try {
      // 根据服务类型获取对应的登录服务实现
      this.loginService = InversifyUtils.getNamedBean<ILoginService>(LOGIN_SERVICE, loginServiceType);
      console.log(`Using ${loginServiceType} login service`);
    } catch (error) {
      // 如果指定的服务类型不存在，回退到mock实现
      console.warn(`Login service type '${loginServiceType}' not found, falling back to 'mock'`);
      this.loginService = InversifyUtils.getNamedBean<ILoginService>(LOGIN_SERVICE, 'mock');
    }
  }

  /**
   * 获取登录服务实例
   * @returns 登录服务实例
   */
  getLoginService(): ILoginService {
    return this.loginService;
  }
}

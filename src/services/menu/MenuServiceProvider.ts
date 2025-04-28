import { type IMenuService, MENU_SERVICE } from './IMenuService';
import { InversifyUtils } from '@/lib/inversify/inversifyUtils';
import { Singleton } from '@/lib/inversify/inversifyDecorators';

/**
 * 菜单服务提供者
 * 根据环境变量选择使用哪个菜单服务实现
 */
@Singleton()
export class MenuServiceProvider {
  private menuService: IMenuService;

  constructor() {
    // 从环境变量获取服务类型，默认为mock
    const serviceType = import.meta.env.VITE_SERVICE_TYPE || 'mock';

    try {
      // 根据服务类型获取对应的菜单服务实现
      this.menuService = InversifyUtils.getNamedBean<IMenuService>(MENU_SERVICE, serviceType);
      console.log(`Using ${serviceType} menu service`);
    } catch (error) {
      // 如果指定的服务类型不存在，回退到mock实现
      console.warn(`Menu service type '${serviceType}' not found, falling back to 'mock'`);
      this.menuService = InversifyUtils.getNamedBean<IMenuService>(MENU_SERVICE, 'mock');
    }
  }

  /**
   * 获取菜单服务实例
   * @returns 菜单服务实例
   */
  getMenuService(): IMenuService {
    return this.menuService;
  }
}

// 导出菜单服务提供者实例
export const menuServiceProvider = new MenuServiceProvider();

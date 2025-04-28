import { type IMenuService, MENU_SERVICE } from './IMenuService';
import { Menu } from '@/models/menu';
import { NamedSingletonBean } from '@/lib/inversify/inversifyDecorators';
import { v4 as uuidv4 } from 'uuid';

/**
 * 模拟菜单服务实现
 * 提供基于内存的菜单管理功能，用于开发和测试
 */
@NamedSingletonBean(MENU_SERVICE, 'mock')
export class MockMenuService implements IMenuService {
  // 内存中存储的菜单数据，按租户ID分组
  private menusByTenant: Map<string, Map<string, Menu>> = new Map();

  constructor() {
    // 初始化一些示例菜单数据
    this.initSampleData();
  }

  /**
   * 获取所有菜单
   * @param tenantId 租户ID
   * @returns 菜单列表
   */
  async getAllMenus(tenantId: string): Promise<Menu[]> {
    const tenantMenus = this.menusByTenant.get(tenantId) || new Map();

    // 只返回顶级菜单（包含其子菜单）
    return Array.from(tenantMenus.values())
      .filter(menu => menu.parentId === null)
      .sort((a, b) => a.order - b.order);
  }

  /**
   * 获取菜单
   * @param tenantId 租户ID
   * @param menuId 菜单ID
   * @returns 菜单，如果不存在则返回null
   */
  async getMenu(tenantId: string, menuId: string): Promise<Menu | null> {
    const tenantMenus = this.menusByTenant.get(tenantId);
    if (!tenantMenus) {
      return null;
    }
    return tenantMenus.get(menuId) || null;
  }

  /**
   * 创建菜单
   * @param menu 菜单
   * @returns 创建的菜单
   */
  async createMenu(menu: Menu): Promise<Menu> {
    // 确保租户的菜单集合存在
    if (!this.menusByTenant.has(menu.tenantId)) {
      this.menusByTenant.set(menu.tenantId, new Map());
    }

    const tenantMenus = this.menusByTenant.get(menu.tenantId)!;

    // 如果是子菜单，确保父菜单存在
    if (menu.parentId) {
      const parentMenu = tenantMenus.get(menu.parentId);
      if (!parentMenu) {
        throw new Error(`父菜单不存在: ${menu.parentId}`);
      }

      // 确保父菜单不是子菜单（最多支持2级菜单）
      if (parentMenu.parentId !== null) {
        throw new Error('不支持超过2级的菜单');
      }
    }

    // 生成新的ID（如果没有提供）
    if (!menu.id) {
      menu = { ...menu, id: uuidv4() };
    }

    // 存储菜单
    tenantMenus.set(menu.id, menu);

    // 如果是子菜单，添加到父菜单的children中
    if (menu.parentId) {
      const parentMenu = tenantMenus.get(menu.parentId)!;
      parentMenu.addChild(menu);
    }

    return menu;
  }

  /**
   * 更新菜单
   * @param menu 菜单
   * @returns 更新后的菜单
   */
  async updateMenu(menu: Menu): Promise<Menu> {
    const tenantMenus = this.menusByTenant.get(menu.tenantId);
    if (!tenantMenus) {
      throw new Error(`租户不存在: ${menu.tenantId}`);
    }

    const existingMenu = tenantMenus.get(menu.id);
    if (!existingMenu) {
      throw new Error(`菜单不存在: ${menu.id}`);
    }

    // 不允许更改父菜单（为了简化实现）
    if (existingMenu.parentId !== menu.parentId) {
      throw new Error('不允许更改菜单的父级关系');
    }

    // 更新菜单
    tenantMenus.set(menu.id, menu);

    // 如果是子菜单，更新父菜单的children
    if (menu.parentId) {
      const parentMenu = tenantMenus.get(menu.parentId)!;
      parentMenu.removeChild(menu.id);
      parentMenu.addChild(menu);
    }

    return menu;
  }

  /**
   * 删除菜单
   * @param tenantId 租户ID
   * @param menuId 菜单ID
   * @returns 是否成功删除
   */
  async deleteMenu(tenantId: string, menuId: string): Promise<boolean> {
    const tenantMenus = this.menusByTenant.get(tenantId);
    if (!tenantMenus) {
      return false;
    }

    const menuToDelete = tenantMenus.get(menuId);
    if (!menuToDelete) {
      return false;
    }

    // 如果是父菜单，需要先删除所有子菜单
    if (menuToDelete.children.length > 0) {
      for (const child of [...menuToDelete.children]) {
        tenantMenus.delete(child.id);
      }
    }

    // 如果是子菜单，从父菜单的children中移除
    if (menuToDelete.parentId) {
      const parentMenu = tenantMenus.get(menuToDelete.parentId);
      if (parentMenu) {
        parentMenu.removeChild(menuId);
      }
    }

    // 删除菜单
    return tenantMenus.delete(menuId);
  }

  /**
   * 初始化示例数据
   */
  private initSampleData(): void {
    // 默认租户
    const tenantId = 'default';
    const tenantMenus = new Map<string, Menu>();

    // 创建一些示例菜单
    const dashboardMenu = new Menu(
      uuidv4(),
      tenantId,
      'dashboard',
      '仪表盘',
      'mdi-view-dashboard',
      '/dashboard',
      1,
      null,
      'menu.dashboard'
    );

    const userManagementMenu = new Menu(
      uuidv4(),
      tenantId,
      'user-management',
      '用户管理',
      'mdi-account-group',
      '/users',
      2,
      null,
      'menu.userManagement'
    );

    const userListMenu = new Menu(
      uuidv4(),
      tenantId,
      'user-list',
      '用户列表',
      'mdi-account-multiple',
      '/users/list',
      1,
      'user-management',
      'menu.userList'
    );

    const userRolesMenu = new Menu(
      uuidv4(),
      tenantId,
      'user-roles',
      '角色管理',
      'mdi-shield-account',
      '/users/roles',
      2,
      'user-management',
      'menu.userRoles'
    );

    const settingsMenu = new Menu(
      uuidv4(),
      tenantId,
      'settings',
      '系统设置',
      'mdi-cog',
      '/settings',
      3,
      null,
      'menu.settings'
    );

    const menuManagementMenu = new Menu(
      uuidv4(),
      tenantId,
      'menu-management',
      '菜单管理',
      'mdi-menu',
      '/menus',
      4,
      null,
      'menu.menuManagement'
    );

    // 添加到集合
    tenantMenus.set(dashboardMenu.id, dashboardMenu);
    tenantMenus.set(userManagementMenu.id, userManagementMenu);
    tenantMenus.set(userListMenu.id, userListMenu);
    tenantMenus.set(userRolesMenu.id, userRolesMenu);
    tenantMenus.set(settingsMenu.id, settingsMenu);
    tenantMenus.set(menuManagementMenu.id, menuManagementMenu);

    // 建立父子关系
    userManagementMenu.addChild(userListMenu);
    userManagementMenu.addChild(userRolesMenu);

    // 存储租户的菜单集合
    this.menusByTenant.set(tenantId, tenantMenus);
  }
}

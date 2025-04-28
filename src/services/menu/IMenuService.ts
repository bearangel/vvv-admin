/**
 * 菜单服务接口
 * 定义菜单管理相关的操作
 */
export interface IMenuService {
  /**
   * 获取所有菜单
   * @param tenantId 租户ID
   * @returns 菜单列表
   */
  getAllMenus(tenantId: string): Promise<import("@/models/menu").Menu[]>;

  /**
   * 获取菜单
   * @param tenantId 租户ID
   * @param menuId 菜单ID
   * @returns 菜单，如果不存在则返回null
   */
  getMenu(tenantId: string, menuId: string): Promise<import("@/models/menu").Menu | null>;

  /**
   * 创建菜单
   * @param menu 菜单
   * @returns 创建的菜单
   */
  createMenu(menu: import("@/models/menu").Menu): Promise<import("@/models/menu").Menu>;

  /**
   * 更新菜单
   * @param menu 菜单
   * @returns 更新后的菜单
   */
  updateMenu(menu: import("@/models/menu").Menu): Promise<import("@/models/menu").Menu>;

  /**
   * 删除菜单
   * @param tenantId 租户ID
   * @param menuId 菜单ID
   * @returns 是否成功删除
   */
  deleteMenu(tenantId: string, menuId: string): Promise<boolean>;
}

// 创建服务标识符
export const MENU_SERVICE = Symbol('MENU_SERVICE');

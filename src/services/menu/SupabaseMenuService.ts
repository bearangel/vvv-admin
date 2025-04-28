import { type IMenuService, MENU_SERVICE } from './IMenuService';
import { Menu } from '@/models/menu';
import { NamedSingletonBean } from '@/lib/inversify/inversifyDecorators';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Supabase菜单服务实现
 * 使用Supabase提供的数据库服务
 */
@NamedSingletonBean(MENU_SERVICE, 'supabase')
export class SupabaseMenuService implements IMenuService {
  private supabase: SupabaseClient;

  constructor() {
    // 从环境变量获取Supabase URL和Key
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and Key must be provided in environment variables');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * 设置当前租户ID到Supabase会话
   * @param tenantId 租户ID
   * @returns PostgreSQL RPC 调用结果
   */
  private setTenantId(tenantId: string) {
    return this.supabase.rpc('set_tenant_id', { tenant_id: tenantId });
  }

  /**
   * 获取所有菜单
   * @param tenantId 租户ID
   * @returns 菜单列表
   */
  async getAllMenus(tenantId: string): Promise<Menu[]> {
    try {
      // 设置当前租户ID
      await this.setTenantId(tenantId);

      // 获取所有菜单
      const { data: menuData, error } = await this.supabase
        .from('menus')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('order', { ascending: true });

      if (error) {
        console.error('获取菜单失败:', error);
        return [];
      }

      if (!menuData || menuData.length === 0) {
        return [];
      }

      // 将数据库记录转换为Menu对象
      const menuMap = new Map<string, Menu>();
      const topLevelMenus: Menu[] = [];

      // 首先创建所有Menu对象
      for (const record of menuData) {
        const menu = new Menu(
          record.gid,
          record.tenant_id,
          record.id,
          record.name,
          record.icon,
          record.path,
          record.order,
          record.parent_id,
          record.i18n_key,
          []
        );
        menuMap.set(menu.id, menu);
      }

      // 然后建立父子关系
      for (const menu of menuMap.values()) {
        if (menu.parentId === null) {
          topLevelMenus.push(menu);
        } else {
          const parentMenu = menuMap.get(menu.parentId);
          if (parentMenu) {
            parentMenu.addChild(menu);
          }
        }
      }

      return topLevelMenus;
    } catch (error) {
      console.error('获取菜单异常:', error);
      return [];
    }
  }

  /**
   * 获取菜单
   * @param tenantId 租户ID
   * @param menuId 菜单ID
   * @returns 菜单，如果不存在则返回null
   */
  async getMenu(tenantId: string, menuId: string): Promise<Menu | null> {
    try {
      // 设置当前租户ID
      await this.setTenantId(tenantId);

      // 获取指定菜单
      const { data: menuData, error } = await this.supabase
        .from('menus')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('id', menuId)
        .single();

      if (error || !menuData) {
        console.error('获取菜单失败:', error);
        return null;
      }

      // 创建Menu对象
      const menu = new Menu(
        menuData.gid,
        menuData.tenant_id,
        menuData.id,
        menuData.name,
        menuData.icon,
        menuData.path,
        menuData.order,
        menuData.parent_id,
        menuData.i18n_key,
        []
      );

      // 如果是父菜单，获取其子菜单
      if (menuData.parent_id === null) {
        const { data: childrenData, error: childrenError } = await this.supabase
          .from('menus')
          .select('*')
          .eq('tenant_id', tenantId)
          .eq('parent_id', menuId)
          .order('order', { ascending: true });

        if (!childrenError && childrenData) {
          for (const childData of childrenData) {
            const childMenu = new Menu(
              childData.gid,
              childData.tenant_id,
              childData.id,
              childData.name,
              childData.icon,
              childData.path,
              childData.order,
              childData.parent_id,
              childData.i18n_key,
              []
            );
            menu.addChild(childMenu);
          }
        }
      }

      return menu;
    } catch (error) {
      console.error('获取菜单异常:', error);
      return null;
    }
  }

  /**
   * 创建菜单
   * @param menu 菜单
   * @returns 创建的菜单
   */
  async createMenu(menu: Menu): Promise<Menu> {
    try {
      // 设置当前租户ID
      await this.setTenantId(menu.tenantId);

      // 如果是子菜单，确保父菜单存在且不是子菜单
      if (menu.parentId) {
        const parentMenu = await this.getMenu(menu.tenantId, menu.parentId);
        if (!parentMenu) {
          throw new Error(`父菜单不存在: ${menu.parentId}`);
        }
        if (parentMenu.parentId !== null) {
          throw new Error('不支持超过2级的菜单');
        }
      }

      // 生成新的ID和GID（如果没有提供）
      const menuId = menu.id || uuidv4();
      const menuGid = menu.gid || uuidv4();

      // 准备插入数据
      const menuData = {
        gid: menuGid,
        tenant_id: menu.tenantId,
        id: menuId,
        name: menu.name,
        icon: menu.icon,
        path: menu.path,
        order: menu.order,
        parent_id: menu.parentId,
        i18n_key: menu.i18nKey
      };

      // 插入菜单
      const { data, error } = await this.supabase
        .from('menus')
        .insert(menuData)
        .select()
        .single();

      if (error) {
        console.error('创建菜单失败:', error);
        throw new Error(`创建菜单失败: ${error.message}`);
      }

      // 返回创建的菜单
      return new Menu(
        data.gid,
        data.tenant_id,
        data.id,
        data.name,
        data.icon,
        data.path,
        data.order,
        data.parent_id,
        data.i18n_key,
        []
      );
    } catch (error) {
      console.error('创建菜单异常:', error);
      throw error;
    }
  }

  /**
   * 更新菜单
   * @param menu 菜单
   * @returns 更新后的菜单
   */
  async updateMenu(menu: Menu): Promise<Menu> {
    try {
      // 设置当前租户ID
      await this.setTenantId(menu.tenantId);

      // 检查菜单是否存在
      const existingMenu = await this.getMenu(menu.tenantId, menu.id);
      if (!existingMenu) {
        throw new Error(`菜单不存在: ${menu.id}`);
      }

      // 不允许更改父菜单（为了简化实现）
      if (existingMenu.parentId !== menu.parentId) {
        throw new Error('不允许更改菜单的父级关系');
      }

      // 准备更新数据
      const menuData = {
        name: menu.name,
        icon: menu.icon,
        path: menu.path,
        order: menu.order,
        i18n_key: menu.i18nKey
      };

      // 更新菜单
      const { data, error } = await this.supabase
        .from('menus')
        .update(menuData)
        .eq('tenant_id', menu.tenantId)
        .eq('id', menu.id)
        .select()
        .single();

      if (error) {
        console.error('更新菜单失败:', error);
        throw new Error(`更新菜单失败: ${error.message}`);
      }

      // 返回更新后的菜单
      return new Menu(
        data.gid,
        data.tenant_id,
        data.id,
        data.name,
        data.icon,
        data.path,
        data.order,
        data.parent_id,
        data.i18n_key,
        existingMenu.children
      );
    } catch (error) {
      console.error('更新菜单异常:', error);
      throw error;
    }
  }

  /**
   * 删除菜单
   * @param tenantId 租户ID
   * @param menuId 菜单ID
   * @returns 是否成功删除
   */
  async deleteMenu(tenantId: string, menuId: string): Promise<boolean> {
    try {
      // 设置当前租户ID
      await this.setTenantId(tenantId);

      // 检查菜单是否存在
      const menuToDelete = await this.getMenu(tenantId, menuId);
      if (!menuToDelete) {
        return false;
      }

      // 如果是父菜单，需要先删除所有子菜单
      if (menuToDelete.children.length > 0) {
        // 删除子菜单
        const { error: childrenError } = await this.supabase
          .from('menus')
          .delete()
          .eq('tenant_id', tenantId)
          .eq('parent_id', menuId);

        if (childrenError) {
          console.error('删除子菜单失败:', childrenError);
          return false;
        }
      }

      // 删除菜单
      const { error } = await this.supabase
        .from('menus')
        .delete()
        .eq('tenant_id', tenantId)
        .eq('id', menuId);

      if (error) {
        console.error('删除菜单失败:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('删除菜单异常:', error);
      return false;
    }
  }
}

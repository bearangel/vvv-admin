import { BaseModel } from './baseModel';

/**
 * 菜单项模型
 * 支持最多2级菜单
 */
export class Menu extends BaseModel {
  /**
   * 构造函数
   * @param gid 全局唯一标识符
   * @param tenantId 租户ID
   * @param id 菜单ID
   * @param name 菜单名称
   * @param icon 菜单图标
   * @param path 菜单路径
   * @param order 排序序号
   * @param parentId 父菜单ID，如果为null则为顶级菜单
   * @param i18nKey 国际化键名
   * @param children 子菜单列表
   */
  constructor(
    gid: string,
    tenantId: string,
    public id: string,
    public name: string,
    public icon: string,
    public path: string,
    public order: number,
    public parentId: string | null,
    public i18nKey: string,
    public children: Menu[] = []
  ) {
    super(gid, tenantId);
  }

  /**
   * 添加子菜单
   * @param child 子菜单
   */
  addChild(child: Menu): void {
    // 确保只支持最多2级菜单
    if (this.parentId !== null) {
      throw new Error('不支持超过2级的菜单');
    }
    this.children.push(child);
    // 按order排序
    this.children.sort((a, b) => a.order - b.order);
  }

  /**
   * 移除子菜单
   * @param childId 子菜单ID
   * @returns 是否成功移除
   */
  removeChild(childId: string): boolean {
    const initialLength = this.children.length;
    this.children = this.children.filter(child => child.id !== childId);
    return initialLength !== this.children.length;
  }

  /**
   * 获取子菜单
   * @param childId 子菜单ID
   * @returns 子菜单，如果不存在则返回null
   */
  getChild(childId: string): Menu | null {
    return this.children.find(child => child.id === childId) || null;
  }
}

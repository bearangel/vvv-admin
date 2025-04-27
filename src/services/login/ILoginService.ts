export interface ILoginService {
  /**
   * 使用用户名和密码登录
   * @param username 用户名
   * @param password 密码
   * @returns 登录上下文，如果登录失败则返回null
   */
  login(username: string, password: string): Promise<import("@/models/loginContext").LoginContext | null>;

  /**
   * 使用邮箱和密码登录
   * @param email 邮箱
   * @param password 密码
   * @returns 登录上下文，如果登录失败则返回null
   */
  loginWithEmail(email: string, password: string): Promise<import("@/models/loginContext").LoginContext | null>;

  /**
   * 修改用户密码
   * @param email 用户邮箱
   * @param currentPassword 当前密码
   * @param newPassword 新密码
   * @returns 是否成功修改密码
   */
  changePassword(email: string, currentPassword: string, newPassword: string): Promise<boolean>;
}

// 创建服务标识符
export const LOGIN_SERVICE = Symbol('LOGIN_SERVICE');

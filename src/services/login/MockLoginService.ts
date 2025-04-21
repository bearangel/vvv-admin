import { type ILoginService, LOGIN_SERVICE } from './ILoginService';
import { LoginContext, LoginUser } from '@/models/loginContext';
import { NamedSingletonBean } from '@/lib/inversify/inversifyDecorators';

/**
 * 模拟登录服务实现
 * 预设了几个用户账号，用于开发和测试
 */
@NamedSingletonBean(LOGIN_SERVICE, 'mock')
export class MockLoginService implements ILoginService {
  // 预设的用户列表
  private readonly users: Array<{ username: string; email: string; password: string; user: LoginUser }> = [
    {
      username: 'admin',
      email: 'admin@example.com',
      password: 'admin123',
      user: new LoginUser('1', 'Admin User', 'admin@example.com', '13800000000', 'https://randomuser.me/api/portraits/men/1.jpg')
    },
    {
      username: 'user',
      email: 'user@example.com',
      password: 'user123',
      user: new LoginUser('2', 'Normal User', 'user@example.com', '13800000001', 'https://randomuser.me/api/portraits/women/1.jpg')
    },
    {
      username: 'test',
      email: 'test@example.com',
      password: 'test123',
      user: new LoginUser('3', 'Test User', 'test@example.com', '13800000002', 'https://randomuser.me/api/portraits/men/2.jpg')
    }
  ];

  /**
   * 使用用户名和密码登录
   * @param username 用户名
   * @param password 密码
   * @returns 登录上下文，如果登录失败则返回null
   */
  async login(username: string, password: string): Promise<LoginContext | null> {
    // 查找匹配的用户
    const user = this.users.find(u => u.username === username && u.password === password);

    if (!user) {
      return null;
    }

    return this.createLoginContext(user.user);
  }

  /**
   * 使用邮箱和密码登录
   * @param email 邮箱
   * @param password 密码
   * @returns 登录上下文，如果登录失败则返回null
   */
  async loginWithEmail(email: string, password: string): Promise<LoginContext | null> {
    // 查找匹配的用户
    const user = this.users.find(u => u.email === email && u.password === password);

    if (!user) {
      return null;
    }

    return this.createLoginContext(user.user);
  }

  /**
   * 创建登录上下文
   * @param user 用户信息
   * @returns 登录上下文
   */
  private createLoginContext(user: LoginUser): LoginContext {
    // 生成一个模拟的访问令牌
    const accessToken = `mock_token_${user.userId}_${Date.now()}`;
    // 令牌类型
    const tokenType = 'Bearer';
    // 令牌有效期（1小时）
    const expiresIn = BigInt(3600);
    // 过期时间（当前时间 + 有效期）
    const expiresAt = BigInt(Math.floor(Date.now() / 1000) + Number(expiresIn));
    // 刷新令牌
    const refreshToken = `mock_refresh_${user.userId}_${Date.now()}`;

    return new LoginContext(
      accessToken,
      tokenType,
      expiresIn,
      expiresAt,
      refreshToken,
      user
    );
  }
}

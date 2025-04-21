import { type ILoginService, LOGIN_SERVICE } from './ILoginService';
import { LoginContext, LoginUser } from '@/models/loginContext';
import { NamedSingletonBean } from '@/lib/inversify/inversifyDecorators';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase登录服务实现
 * 使用Supabase提供的身份验证服务
 */
@NamedSingletonBean(LOGIN_SERVICE, 'supabase')
export class SupabaseLoginService implements ILoginService {
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
   * 使用用户名和密码登录
   * 注意：Supabase不直接支持用户名登录，此方法将尝试使用用户名作为邮箱登录
   * @param username 用户名
   * @param password 密码
   * @returns 登录上下文，如果登录失败则返回null
   */
  async login(username: string, password: string): Promise<LoginContext | null> {
    // 尝试使用用户名作为邮箱登录
    return this.loginWithEmail(username, password);
  }

  /**
   * 使用邮箱和密码登录
   * @param email 邮箱
   * @param password 密码
   * @returns 登录上下文，如果登录失败则返回null
   */
  async loginWithEmail(email: string, password: string): Promise<LoginContext | null> {
    try {
      // 使用Supabase进行邮箱密码登录
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error || !data.user || !data.session) {
        console.error('Supabase login error:', error);
        return null;
      }

      // 获取用户详细信息
      const { data: { user: userData }, error: userError } = await this.supabase.auth.getUser();

      if (userError || !userData) {
        console.error('Failed to fetch user data:', userError);
        return null;
      }

      // 创建LoginUser对象
      const loginUser = new LoginUser(
        userData.id,
        userData.user_metadata?.username || userData.email?.split('@')[0] || 'User',
        userData.email || '',
        userData.phone || '',
        userData.user_metadata?.avatar_url || ''
      );

      // 创建并返回LoginContext
      return new LoginContext(
        data.session.access_token,
        'Bearer',
        data.session.expires_in || 3600,
        Math.floor(new Date(data.session.expires_at || Date.now() + 3600000).getTime() / 1000),
        data.session.refresh_token || '',
        loginUser
      );
    } catch (error) {
      console.error('Supabase login exception:', error);
      return null;
    }
  }
}

export class LoginContext {
  constructor(
    // 访问令牌
    public readonly accessToken: string,
    // 令牌类型
    public readonly tokenType: string,
    // 访问令牌（AccessToken）的有效期，单位是秒。
    public readonly expiresIn: bigint,
    // Unix 时间戳, 表示访问令牌的绝对过期时间,
    public readonly expiresAt: bigint,
    // 用于在访问令牌过期后获取新的访问令牌的令牌。
    public readonly refreshToken: string,
    // 登录用户信息
    public readonly loginUser: LoginUser,
  ) {
  }
}

export class LoginUser {
  constructor(
    // 用户ID
    public readonly userId: string,
    // 用户名称
    public readonly userName: string,
    // 邮箱
    public readonly email: string,
    // 手机号码
    public readonly phoneNumber: string,
    // 头像
    public readonly avatar?: string
  ) {
  }
}

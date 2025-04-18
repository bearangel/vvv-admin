import { BaseModel } from "@/models/baseModel.ts";

export class User extends BaseModel{
  constructor(
    gid: string,
    tenantId: string,
    // 用户ID
    public userId: string,
    // 用户名称
    public userName: string,
    // 邮箱
    public email: string,
    // 手机号码
    public phoneNumber: string,
    // 头像
    public avatar?: string
  ) {
    super(gid, tenantId);
  }
}

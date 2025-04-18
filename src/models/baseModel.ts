export abstract class BaseModel {
  protected constructor(public gid: string, public tenantId: string) {
  }
}

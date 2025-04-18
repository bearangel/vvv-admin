# Inversify 工具库 (Inversify Utilities)

这个目录包含了用于简化 [InversifyJS](https://inversify.io/) 依赖注入框架使用的工具和装饰器。

## 文件说明 (Files)

### inversify.config.ts

创建并导出 Inversify 容器实例，这是依赖注入系统的核心组件。

Creates and exports the Inversify Container instance, which is the core component of the dependency injection system.

### inversifyDecorators.ts

提供了一系列装饰器，用于简化类与 Inversify 容器的注册过程：

Provides a set of decorators to simplify the process of registering classes with the Inversify container:

- `@Bean`: 将类注册为普通 Bean
- `@SingletonBean`: 将类注册为单例 Bean
- `@Singleton`: 将类注册为自身的单例实现
- `@NamedBean`: 将类注册为命名 Bean
- `@NamedSingletonBean`: 将类注册为命名的单例 Bean

### inversifyUtils.ts

提供了 `InversifyUtils` 工具类，包含用于在 Inversify 容器中注册和获取 Bean 的方法：

Provides the `InversifyUtils` utility class with methods for registering and retrieving beans from the Inversify container:

- 容器管理 (Container management)
  - `setContainer`: 设置要使用的容器
  - `getContainer`: 获取当前使用的容器

- Bean 注册 (Bean registration)
  - `registerNamedBean`: 注册命名 Bean
  - `registerSingletonBean`: 注册单例 Bean
  - `registerNamedSingletonBean`: 注册命名的单例 Bean
  - `registerSelf`: 注册类作为自身的实现
  - `registerSelfAsSingleton`: 注册类作为自身的单例实现

- Bean 获取 (Bean retrieval)
  - `getBean`: 获取 Bean 实例
  - `getNamedBean`: 获取命名的 Bean 实例

- 容器工具 (Container utilities)
  - `isBound`: 检查是否已绑定指定的服务标识符
  - `unbind`: 解绑指定的服务标识符

此外，还提供了 `createServiceIdentifier` 辅助函数，用于创建唯一的服务标识符。

Additionally, it provides a `createServiceIdentifier` helper function for creating unique service identifiers.

## 使用示例 (Usage Examples)

### 使用装饰器 (Using Decorators)

```typescript
import { Bean, Singleton, NamedBean } from './inversifyDecorators';
import { createServiceIdentifier } from './inversifyUtils';

// 定义服务接口和标识符
interface UserService {
  getUser(id: string): User;
}

const UserServiceId = createServiceIdentifier<UserService>('UserService');

// 注册为普通 Bean
@Bean(UserServiceId)
class UserServiceImpl implements UserService {
  getUser(id: string): User {
    // 实现...
  }
}

// 注册为单例
@Singleton()
class ConfigService {
  // 实现...
}

// 注册为命名 Bean
@NamedBean(UserServiceId, 'admin')
class AdminUserService implements UserService {
  getUser(id: string): User {
    // 实现...
  }
}
```

### 使用工具类 (Using Utilities)

```typescript
import { InversifyUtils } from './inversifyUtils';

// 获取 Bean
const userService = InversifyUtils.getBean<UserService>(UserServiceId);

// 获取命名 Bean
const adminService = InversifyUtils.getNamedBean<UserService>(UserServiceId, 'admin');

// 检查是否已绑定
if (InversifyUtils.isBound(UserServiceId)) {
  // 使用服务...
}
```
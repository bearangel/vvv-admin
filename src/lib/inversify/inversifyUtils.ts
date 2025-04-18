// beanUtils.ts
import { Container, type MetadataName, type Newable, type ServiceIdentifier } from "inversify";
import { container as appContainer } from "./inversify.config.ts";

/**
 * BeanUtils 类提供了一组工具方法，用于在 Inversify 容器中注册和获取 Bean
 */
export class InversifyUtils {
  private static container: Container = appContainer;

  /**
   * 设置要使用的容器
   * @param container Inversify 容器实例
   */
  public static setContainer(container: Container): void {
    InversifyUtils.container = container;
  }

  /**
   * 获取当前使用的容器
   * @returns 当前 Inversify 容器实例
   */
  public static getContainer(): Container {
    return InversifyUtils.container;
  }

  /**
   * 注册一个命名的 Bean
   * @param serviceIdentifier 服务标识符（通常是一个 Symbol 或类）
   * @param implementation 实现类
   * @param name Bean 的名称
   */
  public static registerNamedBean<T>(
    serviceIdentifier: ServiceIdentifier<T>,
    implementation: new (...args: any[]) => T,
    name: MetadataName
  ): void {
    InversifyUtils.container.bind<T>(serviceIdentifier).to(implementation).whenNamed(name);
  }

  /**
   * 注册一个单例 Bean
   * @param serviceIdentifier 服务标识符（通常是一个 Symbol 或类）
   * @param implementation 实现类
   */
  public static registerSingletonBean<T>(
    serviceIdentifier: ServiceIdentifier<T>,
    implementation: new (...args: any[]) => T
  ): void {
    InversifyUtils.container.bind<T>(serviceIdentifier).to(implementation).inSingletonScope();
  }

  /**
   * 注册一个命名的单例 Bean
   * @param serviceIdentifier 服务标识符（通常是一个 Symbol 或类）
   * @param implementation 实现类
   * @param name Bean 的名称
   */
  public static registerNamedSingletonBean<T>(
    serviceIdentifier: ServiceIdentifier<T>,
    implementation: new (...args: any[]) => T,
    name: MetadataName
  ): void {
    InversifyUtils.container.bind<T>(serviceIdentifier).to(implementation).inSingletonScope().whenNamed(name);
  }

  /**
   * 注册一个类作为自身的实现
   * @param constructor 要注册的类
   */
  public static registerSelf<T>(constructor: Newable<T>): void {
    InversifyUtils.container.bind<T>(constructor).toSelf();
  }

  /**
   * 注册一个类作为自身的单例实现
   * @param constructor 要注册的类
   */
  public static registerSelfAsSingleton<T>(constructor: Newable<T>): void {
    InversifyUtils.container.bind<T>(constructor).toSelf().inSingletonScope();
  }

  /**
   * 获取 Bean 实例
   * @param serviceIdentifier 服务标识符（通常是一个 Symbol 或类）
   * @returns Bean 实例
   */
  public static getBean<T>(serviceIdentifier: ServiceIdentifier<T>): T {
    return InversifyUtils.container.get<T>(serviceIdentifier);
  }

  /**
   * 获取命名的 Bean 实例
   * @param serviceIdentifier 服务标识符（通常是一个 Symbol 或类）
   * @param name Bean 的名称
   * @returns 命名的 Bean 实例
   */
  public static getNamedBean<T>(serviceIdentifier: ServiceIdentifier<T>, name: MetadataName): T {
    return InversifyUtils.container.get<T>(serviceIdentifier, {name});
  }

  /**
   * 检查是否已绑定指定的服务标识符
   * @param serviceIdentifier 服务标识符（通常是一个 Symbol 或类）
   * @returns 如果已绑定则返回 true，否则返回 false
   */
  public static isBound(serviceIdentifier: ServiceIdentifier<any>): boolean {
    return InversifyUtils.container.isBound(serviceIdentifier);
  }

  /**
   * 解绑指定的服务标识符
   * @param serviceIdentifier 服务标识符（通常是一个 Symbol 或类）
   */
  public static async unbind(serviceIdentifier: ServiceIdentifier<any>): Promise<void> {
    if (InversifyUtils.container.isBound(serviceIdentifier)) {
      await InversifyUtils.container.unbind(serviceIdentifier);
    }
  }
}

/**
 * 用于创建服务标识符的辅助函数
 * @param name 标识符名称
 * @returns 唯一的 Symbol 标识符
 */
export function createServiceIdentifier<T>(name: string): ServiceIdentifier<T> {
  return Symbol(name);
}

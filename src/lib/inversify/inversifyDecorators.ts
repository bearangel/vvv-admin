// beanDecorators.ts
import { type MetadataName, type ServiceIdentifier } from "inversify";
import { InversifyUtils } from "./inversifyUtils.ts";
import "reflect-metadata";

/**
 * 装饰器：将类注册为普通Bean
 * @param serviceIdentifier 服务标识符（通常是一个 Symbol 或类）
 * @returns 类装饰器
 */
export function Bean<T>(serviceIdentifier: ServiceIdentifier<T>) {
  return function(target: new (...args: any[]) => T) {
    InversifyUtils.registerSelf(target);
    return target;
  };
}

/**
 * 装饰器：将类注册为单例Bean
 * @param serviceIdentifier 服务标识符（通常是一个 Symbol 或类）
 * @returns 类装饰器
 */
export function SingletonBean<T>(serviceIdentifier: ServiceIdentifier<T>) {
  return function(target: new (...args: any[]) => T) {
    InversifyUtils.registerSingletonBean(serviceIdentifier, target);
    return target;
  };
}

/**
 * 装饰器：将类注册为自身的单例实现
 * @returns 类装饰器
 */
export function Singleton<T>() {
  return function(target: new (...args: any[]) => T) {
    InversifyUtils.registerSelfAsSingleton(target);
    return target;
  };
}

/**
 * 装饰器：将类注册为命名Bean
 * @param serviceIdentifier 服务标识符（通常是一个 Symbol 或类）
 * @param name Bean的名称
 * @returns 类装饰器
 */
export function NamedBean<T>(serviceIdentifier: ServiceIdentifier<T>, name: MetadataName) {
  return function(target: new (...args: any[]) => T) {
    InversifyUtils.registerNamedBean(serviceIdentifier, target, name);
    return target;
  };
}

/**
 * 装饰器：将类注册为命名的单例Bean
 * @param serviceIdentifier 服务标识符（通常是一个 Symbol 或类）
 * @param name Bean的名称
 * @returns 类装饰器
 */
export function NamedSingletonBean<T>(serviceIdentifier: ServiceIdentifier<T>, name: MetadataName) {
  return function(target: new (...args: any[]) => T) {
    InversifyUtils.registerNamedSingletonBean(serviceIdentifier, target, name);
    return target;
  };
}

// inversifyUtils.test.ts
import { beforeEach, describe, expect, it } from 'vitest';
import { createServiceIdentifier, InversifyUtils } from './inversifyUtils';
import { Container } from 'inversify';

describe('InversifyUtils', () => {
  // 声明容器和测试服务标识符
  let container: Container;
  const mockServiceIdentifier = Symbol('TestService');

  // 创建模拟实现类
  class MockImplementation {
  }

  // 每个测试用例前的初始化设置
  beforeEach(() => {
    container = new Container();
    InversifyUtils.setContainer(container);
  });

  // 测试设置容器是否正确
  it('应该正确设置容器', () => {
    const customContainer = new Container();
    InversifyUtils.setContainer(customContainer);
    expect(InversifyUtils.getContainer()).toBe(customContainer);
  });

  // 测试获取当前容器
  it('应该返回当前容器', () => {
    expect(InversifyUtils.getContainer()).toBe(container);
  });

  // 测试注册命名bean
  it('应该注册一个命名bean', () => {
    const beanName: string = 'testBean';
    InversifyUtils.registerNamedBean(mockServiceIdentifier, MockImplementation, beanName);
    const resolvedInstance = container.get(mockServiceIdentifier, {name: beanName});
    expect(resolvedInstance).toBeInstanceOf(MockImplementation);
  });

  // 测试注册单例bean
  it('应该注册一个单例bean', () => {
    InversifyUtils.registerSingletonBean(mockServiceIdentifier, MockImplementation);
    const instance1 = container.get(mockServiceIdentifier);
    const instance2 = container.get(mockServiceIdentifier);
    expect(instance1).toBe(instance2);
  });

  // 测试创建服务标识符是否生成唯一 Symbol
  it('应该创建一个唯一的 Symbol 标识符', () => {
    const identifier1 = createServiceIdentifier('TestService1');
    const identifier2 = createServiceIdentifier('TestService2');
    expect(typeof identifier1).toBe('symbol');
    expect(typeof identifier2).toBe('symbol');
    expect(identifier1).not.toBe(identifier2);
  });

  // 测试创建服务标识符的 Symbol 描述是否包含名称
  it('创建的 Symbol 标识符的描述应该包含提供的名称', () => {
    const serviceName = 'MyService';
    const identifier = createServiceIdentifier(serviceName);
    expect(identifier.toString()).toContain(serviceName);
  });

  // 测试注册命名单例bean
  it('应该注册一个命名单例bean', () => {
    const beanName = 'singletonBean';
    InversifyUtils.registerNamedSingletonBean(mockServiceIdentifier, MockImplementation, beanName);
    const instance1 = container.get(mockServiceIdentifier, {name: beanName});
    const instance2 = container.get(mockServiceIdentifier, {name: beanName});
    expect(instance1).toBe(instance2);
  });

  // 测试将类注册为自身
  it('应该将类注册为自身', () => {
    InversifyUtils.registerSelf(MockImplementation);
    const resolvedInstance = container.get(MockImplementation);
    expect(resolvedInstance).toBeInstanceOf(MockImplementation);
  });

  // 测试将类注册为单例自身
  it('应该将类注册为单例自身', () => {
    InversifyUtils.registerSelfAsSingleton(MockImplementation);
    const instance1 = container.get(MockImplementation);
    const instance2 = container.get(MockImplementation);
    expect(instance1).toBe(instance2);
  });

  // 测试获取bean实例
  it('应该获取一个bean实例', () => {
    container.bind(mockServiceIdentifier).to(MockImplementation);
    const resolvedInstance = InversifyUtils.getBean(mockServiceIdentifier);
    expect(resolvedInstance).toBeInstanceOf(MockImplementation);
  });

  // 测试获取命名bean实例
  it('应该获取一个命名bean实例', () => {
    const beanName = 'testBean';
    container.bind(mockServiceIdentifier).to(MockImplementation).whenNamed(beanName);
    const resolvedInstance = InversifyUtils.getNamedBean(mockServiceIdentifier, beanName);
    expect(resolvedInstance).toBeInstanceOf(MockImplementation);
  });

  // 测试验证服务标识符是否已绑定
  it('应该验证服务标识符是否已绑定', () => {
    expect(InversifyUtils.isBound(mockServiceIdentifier)).toBe(false);
    container.bind(mockServiceIdentifier).to(MockImplementation);
    expect(InversifyUtils.isBound(mockServiceIdentifier)).toBe(true);
  });

  // 测试解绑已绑定的服务标识符
  it('应该解绑已绑定的服务标识符', async () => {
    container.bind(mockServiceIdentifier).to(MockImplementation);
    expect(container.isBound(mockServiceIdentifier)).toBe(true);
    await InversifyUtils.unbind(mockServiceIdentifier);
    expect(container.isBound(mockServiceIdentifier)).toBe(false);
  });

  // 测试解绑未绑定的服务标识符不应抛出错误
  it('解绑未绑定的服务标识符时不应抛出错误', async () => {
    await expect(InversifyUtils.unbind(mockServiceIdentifier)).resolves.not.toThrow();
  });
});

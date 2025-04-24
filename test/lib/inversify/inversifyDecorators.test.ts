// inversifyDecorators.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Bean, SingletonBean, Singleton, NamedBean, NamedSingletonBean } from '../../../src/lib/inversify/inversifyDecorators';
import { InversifyUtils } from '../../../src/lib/inversify/inversifyUtils';
import { Container } from 'inversify';
import 'reflect-metadata';

describe('Inversify装饰器测试', () => {
  // 测试用的服务标识符
  const TestServiceIdentifier = Symbol('TestService');

  // 模拟容器
  let container: Container;

  // 在每个测试前重置容器和spy
  beforeEach(() => {
    container = new Container();
    InversifyUtils.setContainer(container);

    // 重置所有模拟函数
    vi.restoreAllMocks();
  });

  // 测试@Bean装饰器
  describe('@Bean装饰器', () => {
    it('应该正确注册普通Bean', () => {
      const registerSelfSpy = vi.spyOn(InversifyUtils, 'registerSelf');

      @Bean(TestServiceIdentifier)
      class TestClass {}

      expect(registerSelfSpy).toHaveBeenCalledWith(TestClass);
    });
  });

  // 测试@SingletonBean装饰器
  describe('@SingletonBean装饰器', () => {
    it('应该正确注册单例Bean', () => {
      const registerSingletonBeanSpy = vi.spyOn(InversifyUtils, 'registerSingletonBean');

      @SingletonBean(TestServiceIdentifier)
      class TestClass {}

      expect(registerSingletonBeanSpy).toHaveBeenCalledWith(TestServiceIdentifier, TestClass);
    });

    it('应该保持单例特性', () => {
      @SingletonBean(TestServiceIdentifier)
      class TestClass {}

      const instance1 = container.get(TestServiceIdentifier);
      const instance2 = container.get(TestServiceIdentifier);

      expect(instance1).toBe(instance2);
    });
  });

  // 测试@Singleton装饰器
  describe('@Singleton装饰器', () => {
    it('应该将类注册为单例', () => {
      const registerSelfAsSingletonSpy = vi.spyOn(InversifyUtils, 'registerSelfAsSingleton');

      @Singleton()
      class TestClass {}

      expect(registerSelfAsSingletonSpy).toHaveBeenCalledWith(TestClass);
    });

    it('应该维持类的单例性', () => {
      @Singleton()
      class TestClass {}

      const instance1 = container.get(TestClass);
      const instance2 = container.get(TestClass);

      expect(instance1).toBe(instance2);
    });
  });

  // 测试@NamedBean装饰器
  describe('@NamedBean装饰器', () => {
    it('应该正确注册命名Bean', () => {
      const registerNamedBeanSpy = vi.spyOn(InversifyUtils, 'registerNamedBean');
      const beanName = 'testBean';

      @NamedBean(TestServiceIdentifier, beanName)
      class TestClass {}

      expect(registerNamedBeanSpy).toHaveBeenCalledWith(TestServiceIdentifier, TestClass, beanName);
    });

    it('应该能通过名称获取Bean实例', () => {
      const beanName = 'testBean';

      @NamedBean(TestServiceIdentifier, beanName)
      class TestClass {}

      const instance = container.get(TestServiceIdentifier, { name: beanName });
      expect(instance).toBeInstanceOf(TestClass);
    });
  });

  // 测试@NamedSingletonBean装饰器
  describe('@NamedSingletonBean装饰器', () => {
    it('应该正确注册命名单例Bean', () => {
      const registerNamedSingletonBeanSpy = vi.spyOn(InversifyUtils, 'registerNamedSingletonBean');
      const beanName = 'testSingletonBean';

      @NamedSingletonBean(TestServiceIdentifier, beanName)
      class TestClass {}

      expect(registerNamedSingletonBeanSpy).toHaveBeenCalledWith(
        TestServiceIdentifier,
        TestClass,
        beanName
      );
    });

    it('应该维持命名单例Bean的单例性', () => {
      const beanName = 'testSingletonBean';

      @NamedSingletonBean(TestServiceIdentifier, beanName)
      class TestClass {}

      const instance1 = container.get(TestServiceIdentifier, { name: beanName });
      const instance2 = container.get(TestServiceIdentifier, { name: beanName });

      expect(instance1).toBe(instance2);
      expect(instance1).toBeInstanceOf(TestClass);
    });
  });

  // 测试错误处理
  describe('错误处理', () => {
    it('应该在获取未注册的Bean时抛出错误', () => {
      expect(() => container.get(TestServiceIdentifier)).toThrow();
    });

    it('应该在使用错误的名称获取命名Bean时抛出错误', () => {
      const beanName = 'correctName';

      @NamedBean(TestServiceIdentifier, beanName)
      class TestClass {}

      expect(() => container.get(TestServiceIdentifier, { name: 'wrongName' })).toThrow();
    });
  });
});

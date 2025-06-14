import IContainer from "../interfaces/container";

type Constructor<T> = new (...args: any[]) => T;

class Container implements IContainer {
  private dependencies = new Map<string, any>();
  private singletons = new Map<string, any>();

  register<T>(key: string, constructor: Constructor<T>, singleton = false) {
    this.dependencies.set(key, { constructor, singleton });
  }

  bind<T>(key: string, instance: T) {
    if (this.dependencies.has(key)) {
      throw new Error(`Dependency '${key}' is already registered`);
    }

    if (this.singletons.has(key)) {
      throw new Error(`Singleton '${key}' is already bound`);
    }

    this.dependencies.set(key, { constructor: () => instance, singleton: true });
    this.singletons.set(key, instance);
  }

  resolve<T>(key: string): T {
    const dep = this.dependencies.get(key);
    if (!dep) throw new Error(`Dependency '${key}' not found`);

    if (dep.singleton) {
      if (!this.singletons.has(key)) {
        const instance = new dep.constructor();
        this.singletons.set(key, instance);
      }
      return this.singletons.get(key);
    }

    return new dep.constructor();
  }

  delete(key: string): boolean {
    const removedSingleton = this.singletons.delete(key);
    const removedDependency = this.dependencies.delete(key);

    return removedSingleton || removedDependency;
  }

    has(key: string): boolean {
        return this.dependencies.has(key) || this.singletons.has(key);
    }
}

export const container = new Container();
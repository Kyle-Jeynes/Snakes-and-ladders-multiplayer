export default interface IContainer {
    register<T>(key: string, constructor: new (...args: any[]) => T, singleton?: boolean): void;
    resolve<T>(key: string): T;
    delete(key: string): boolean;
    bind<T>(key: string, instance: T): void;
    has(key: string): boolean;
};
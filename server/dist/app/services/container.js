"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.container = void 0;
class Container {
    dependencies = new Map();
    singletons = new Map();
    register(key, constructor, singleton = false) {
        this.dependencies.set(key, { constructor, singleton });
    }
    bind(key, instance) {
        this.singletons.set(key, instance);
    }
    resolve(key) {
        const dep = this.dependencies.get(key);
        if (!dep)
            throw new Error(`Dependency '${key}' not found`);
        if (dep.singleton) {
            if (!this.singletons.has(key)) {
                const instance = new dep.constructor();
                this.singletons.set(key, instance);
            }
            return this.singletons.get(key);
        }
        return new dep.constructor();
    }
    delete(key) {
        const removedSingleton = this.singletons.delete(key);
        const removedDependency = this.dependencies.delete(key);
        return removedSingleton || removedDependency;
    }
    has(key) {
        return this.dependencies.has(key) || this.singletons.has(key);
    }
}
exports.container = new Container();

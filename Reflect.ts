"use strict";

type ClassDecorator = (target: Function) => Function | void;
type ParameterDecorator = (target: Function, paramIndex: number) => Function | void;
type PropertyDecorator = (target: Object, propertyKey: PropertyKey, descriptor: PropertyDescriptor) => PropertyDescriptor | void;
type Decorator = ClassDecorator | ParameterDecorator | PropertyDecorator;

module Reflect {
    const weakMetadata = new WeakMap<any, Map<PropertyKey | number, Map<any, any>>>();
    const isMissing = (x: any) => x == null;
    const isFunction = (x: any) => typeof x === "function";
    const isArray = Array.isArray;
    const isObject = (x: any) => !isMissing(x) && (typeof x === "object" || isFunction(x));
    const isNumber = (x: any) => typeof x === "number";
    const isPropertyKey = (x: any) => typeof x === "string" || typeof x === "symbol";

    function decorateConstructor(decorators: ClassDecorator[], target: Function): Function {
        for (let i = decorators.length - 1; i >= 0; --i) {
            let decorator = decorators[i];
            let decorated = decorator(target);
            if (decorated != null) {
                target = Reflect.mergeMetadata(<Function>decorated, target);
            }
        }
        return target;
    }

    function decorateProperty(decorators: PropertyDecorator[], target: Object, propertyKey: PropertyKey): void {
        let descriptor = Reflect.getOwnPropertyDescriptor(target, propertyKey),
            enumerable: boolean,
            configurable: boolean,
            writable: boolean,
            value: any,
            get: Function,
            set: Function;

        if (descriptor) {
            ({ enumerable, configurable, writable, value, get, set } = descriptor);
        }
        else {
            enumerable = true;
            configurable = true;
            writable = true;
            descriptor = { enumerable, configurable, writable, value };
        }

        for (let i = decorators.length - 1; i >= 0; --i) {
            let decorator = decorators[i];
            let decorated = decorator(target, propertyKey, descriptor);
            descriptor = decorated != null ? <PropertyDescriptor>decorated : descriptor;
        }

        if (enumerable !== descriptor.enumerable ||
            configurable !== descriptor.configurable ||
            writable !== descriptor.writable ||
            value !== descriptor.value ||
            get !== descriptor.get ||
            set !== descriptor.set) {
            Reflect.defineProperty(target, propertyKey, descriptor);
        }
    }
    
    function decorateParameter(decorators: ParameterDecorator[], target: Function, paramIndex: number): void {
        for (let i = decorators.length - 1; i >= 0; --i) {
            let decorator = decorators[i];
            decorator(target, paramIndex);
        }
    }

     
    /**
      * Applies a set of decorators to a target object.
      * @param decorators An array of decorators.
      * @param target The target object.
      * @remarks Decorators are applied in reverse order.
      * @returns The result of applying the provided decorators.
      */
    export function decorate(decorators: ClassDecorator[], target: Function): Function;

    /**
      * Applies a set of decorators to a property of a target object.
      * @param decorators An array of decorators.
      * @param target The target object.
      * @param targetKey The property key to decorate.
      * @remarks Decorators are applied in reverse order.
      */
    export function decorate(decorators: PropertyDecorator[], target: Object, targetKey: PropertyKey): void;

    /**
      * Applies a set of decorators to a function parameter.
      * @param decorators An array of decorators.
      * @param target The target function.
      * @param targetIndex The index of the parameter to decorate.
      * @remarks Decorators are applied in reverse order.
      */
    export function decorate(decorators: ParameterDecorator[], target: Function, targetIndex: number): void;

    /**
      * Applies a set of decorators to a property of a target object.
      * @param decorators An array of decorators.
      * @param target The target object.
      * @param targetKey (Optional) The property key or parameter index to decorate.
      * @remarks Decorators are applied in reverse order.
      */
    export function decorate(decorators: Decorator[], target: Object, targetKey?: PropertyKey | number): any {
        if (!isArray(decorators)) throw new TypeError();
        if (!isObject(target)) throw new TypeError();

        if (isNumber(targetKey)) {
            return decorateParameter(<ParameterDecorator[]>decorators, <Function>target, <number>targetKey);
        }
        else if (isPropertyKey(targetKey)) {
            return decorateProperty(<PropertyDecorator[]>decorators, target, <PropertyKey>targetKey);
        }
        else if (isMissing(targetKey)) {
            return decorateConstructor(<ClassDecorator[]>decorators, <Function>target);
        }
        else {
            throw new TypeError();
        }
    }
    
    /**
      * A default metadata decorator that can be used on a class, class member, or parameter.
      * @example
      *
      *     // on class
      *     @Reflect.metadata(key, value)
      *     class MyClass {
      *
      *         // on member
      *         @Reflect.metadata(key, value)
      *         method1() { 
      *         }
      *
      *         // on parameter
      *         method2(@Reflect.metadata(key, value) x) {
      *         }
      *     }
      */
    export function metadata(metadataKey: any, metadataValue: any): Decorator {
        function decorator(target: Function): void;
        function decorator(target: Function, targetIndex: number): void;
        function decorator(target: Object, targetKey: PropertyKey): void;
        function decorator(target: Object, targetKey?: PropertyKey | number): void {
            Reflect.defineMetadata(metadataKey, metadataValue, target, targetKey);
        }
        return decorator;
    }
    
    /**
      * Define a unique metadata entry on the target.
      * @param metadataKey A key used to store and retrieve metadata.
      * @param metadataValue A value that contains attached metadata.
      * @param target The target object on which to define metadata.
      * @example
      * ```
      * // Component decorator factory as metadata-producing annotation.
      * function Component(options) {
      *     return (target) => { Reflect.defineMetadata(Component, options, target); }
      * }
      * ```      
      */
    export function defineMetadata(metadataKey: any, metadataValue: any, target: Object): void

    /**
      * Define a unique metadata entry on the target.
      * @param metadataKey A key used to store and retrieve metadata.
      * @param metadataValue A value that contains attached metadata.
      * @param target The target object on which to define metadata.
      * @param targetKey The property key for the target.
      * @example
      * ```
      * // Component decorator factory as metadata-producing annotation.
      * function Component(options) {
      *     return (target) => { Reflect.defineMetadata(Component, options, target); }
      * }
      * ```      
      */
    export function defineMetadata(metadataKey: any, metadataValue: any, target: Object, targetKey: PropertyKey): void

    /**
      * Define a unique metadata entry on the target.
      * @param metadataKey A key used to store and retrieve metadata.
      * @param metadataValue A value that contains attached metadata.
      * @param target The target object on which to define metadata.
      * @param targetIndex The parameter index of the target.
      * @example
      * ```
      * // Inject decorator factory as metadata-producing annotation.
      * function Inject(options) {
      *     return (target, paramIndex) => { Reflect.defineMetadata(Inject, options, target, paramIndex); }
      * }
      * ```      
      */
    export function defineMetadata(metadataKey: any, metadataValue: any, target: Object, targetIndex: number): void;

    /**
      * Define a unique metadata entry on the target.
      * @param metadataKey A key used to store and retrieve metadata.
      * @param metadataValue A value that contains attached metadata.
      * @param target The target object on which to define metadata.
      * @param targetKey (Optional) The property key or parameter index for the target.
      * @example
      * ```
      * // Component decorator factory as metadata-producing annotation.
      * function Component(options) {
      *     return (target) => { Reflect.defineMetadata(Component, options, target); }
      * }
      * ```      
      */
    export function defineMetadata(metadataKey: any, metadataValue: any, target: Object, targetKey?: PropertyKey | number): void {
        if (!isObject(target)) throw new TypeError();
        if (!isMissing(targetKey) && !isPropertyKey(targetKey) && !isNumber(targetKey)) throw new TypeError();

        let targetMetadata = weakMetadata.get(target);
        if (!targetMetadata) {
            targetMetadata = new Map<PropertyKey | number, Map<any, any>>();
            weakMetadata.set(target, targetMetadata);
        }

        let keyMetadata = targetMetadata.get(targetKey);
        if (!keyMetadata) {
          keyMetadata = new Map<any, any>();
          targetMetadata.set(targetKey, keyMetadata);
        }

        keyMetadata.set(metadataKey, metadata);
    }
    
    /**
      * Gets a value indicating whether the target object or its prototype chain has the provided metadata key defined.
      * @param metadataKey A key used to store and retrieve metadata.
      * @param target The target object on which the metadata is defined.
      * @returns `true` if the metadata key was defined on the target object or its prototype chain; otherwise, `false`.
      */
    export function hasMetadata(metadataKey: any, target: Object): boolean;

    /**
      * Gets a value indicating whether the target object or its prototype chain has the provided metadata key defined.
      * @param metadataKey A key used to store and retrieve metadata.
      * @param target The target object on which the metadata is defined.
      * @param targetKey The property key for the target.
      * @returns `true` if the metadata key was defined on the target object or its prototype chain; otherwise, `false`.
      */
    export function hasMetadata(metadataKey: any, target: Object, targetKey: PropertyKey): boolean;

    /**
      * Gets a value indicating whether the target object or its prototype chain has the provided metadata key defined.
      * @param metadataKey A key used to store and retrieve metadata.
      * @param target The target object on which the metadata is defined.
      * @param targetIndex The parameter index of the target.
      * @returns `true` if the metadata key was defined on the target object or its prototype chain; otherwise, `false`.
      */
    export function hasMetadata(metadataKey: any, target: Object, targetIndex: number): boolean;

    export function hasMetadata(metadataKey: any, target: Object, targetKey?: PropertyKey | number): boolean {
        if (!isObject(target)) throw new TypeError();
        if (!isMissing(targetKey) && !isPropertyKey(targetKey) && !isNumber(targetKey)) throw new TypeError();

        while (target) {
            if (Reflect.hasOwnMetadata(metadataKey, target, targetKey)) {
                return true;
            }
            target = Reflect.getPrototypeOf(target);
        }
        return false;
    }

    /**
      * Gets a value indicating whether the target object has the provided metadata key defined.
      * @param metadataKey A key used to store and retrieve metadata.
      * @param target The target object on which the metadata is defined.
      * @returns `true` if the metadata key was defined on the target object; otherwise, `false`.
      */
    export function hasOwnMetadata(metadataKey: any, target: Object): boolean;

    /**
      * Gets a value indicating whether the target object has the provided metadata key defined.
      * @param metadataKey A key used to store and retrieve metadata.
      * @param target The target object on which the metadata is defined.
      * @param targetKey The property key for the target.
      * @returns `true` if the metadata key was defined on the target object; otherwise, `false`.
      */
    export function hasOwnMetadata(metadataKey: any, target: Object, targetKey: PropertyKey): boolean;

    /**
      * Gets a value indicating whether the target object has the provided metadata key defined.
      * @param metadataKey A key used to store and retrieve metadata.
      * @param target The target object on which the metadata is defined.
      * @param targetIndex The parameter index of the target.
      * @returns `true` if the metadata key was defined on the target object; otherwise, `false`.
      */
    export function hasOwnMetadata(metadataKey: any, target: Object, targetIndex: number): boolean;

    export function hasOwnMetadata(metadataKey: any, target: Object, targetKey?: PropertyKey | number): boolean {
        if (!isObject(target)) throw new TypeError();
        if (!isMissing(targetKey) && !isPropertyKey(targetKey) && !isNumber(targetKey)) throw new TypeError();

        let targetMetadata = weakMetadata.get(target);
        if (targetMetadata) {
            let keyMetadata = targetMetadata.get(targetKey);
            if (keyMetadata) {
                return keyMetadata.has(metadataKey);
            }
        }
        return false;
    }

    /**
      * Gets the metadata value for the provided metadata key on the target object or its prototype chain.
      * @param metadataKey A key used to store and retrieve metadata.
      * @param target The target object on which the metadata is defined.
      * @returns The metadata value for the metadata key if found; otherwise, `undefined`.
      * @example
      * ```
      * let metadata = Reflect.getMetadata(target, Component);
      * ```
      */
    export function getMetadata(metadataKey: any, target: Object): any;

    /**
      * Gets the metadata value for the provided metadata key on the target object or its prototype chain.
      * @param metadataKey A key used to store and retrieve metadata.
      * @param target The target object on which the metadata is defined.
      * @param targetKey The property key for the target.
      * @returns The metadata value for the metadata key if found; otherwise, `undefined`.
      * @example
      * ```
      * let metadata = Reflect.getMetadata(target, Component);
      * ```
      */
    export function getMetadata(metadataKey: any, target: Object, targetKey: PropertyKey): any;

    /**
      * Gets the metadata value for the provided metadata key on the target object or its prototype chain.
      * @param metadataKey A key used to store and retrieve metadata.
      * @param target The target object on which the metadata is defined.
      * @param targetIndex The parameter index of the target.
      * @returns The metadata value for the metadata key if found; otherwise, `undefined`.
      * @example
      * ```
      * let metadata = Reflect.getMetadata(target, Component);
      * ```
      */
    export function getMetadata(metadataKey: any, target: Object, targetIndex: number): any;

    export function getMetadata(metadataKey: any, target: Object, targetKey?: PropertyKey | number): any {
        if (!isObject(target)) throw new TypeError();
        if (!isMissing(targetKey) && !isPropertyKey(targetKey) && !isNumber(targetKey)) throw new TypeError();

        while (target) {
            if (Reflect.hasOwnMetadata(metadataKey, target, targetKey)) {
                return Reflect.getOwnMetadata(metadataKey, target, targetKey);
            }
            target = Reflect.getPrototypeOf(target);
        }
        return undefined;
    }

    /**
      * Gets the metadata value for the provided metadata key on the target object.
      * @param metadataKey A key used to store and retrieve metadata.
      * @param target The target object on which the metadata is defined.
      * @returns The metadata value for the metadata key if found; otherwise, `undefined`.
      * @example
      * ```
      * let metadata = Reflect.getOwnMetadata(target, Component);
      * ```
      */
    export function getOwnMetadata(metadataKey: any, target: Object): any;

    /**
      * Gets the metadata value for the provided metadata key on the target object.
      * @param metadataKey A key used to store and retrieve metadata.
      * @param target The target object on which the metadata is defined.
      * @param targetKey The property key for the target.
      * @returns The metadata value for the metadata key if found; otherwise, `undefined`.
      * @example
      * ```
      * let metadata = Reflect.getOwnMetadata(target, Component);
      * ```
      */
    export function getOwnMetadata(metadataKey: any, target: Object, targetKey: PropertyKey): any;

    /**
      * Gets the metadata value for the provided metadata key on the target object.
      * @param metadataKey A key used to store and retrieve metadata.
      * @param target The target object on which the metadata is defined.
      * @param targetIndex The parameter index of the target.
      * @returns The metadata value for the metadata key if found; otherwise, `undefined`.
      * @example
      * ```
      * let metadata = Reflect.getOwnMetadata(target, Component);
      * ```
      */
    export function getOwnMetadata(metadataKey: any, target: Object, targetIndex: number): any;

    export function getOwnMetadata(metadataKey: any, target: Object, targetKey?: PropertyKey | number): any {
        if (!isObject(target)) throw new TypeError();
        if (!isMissing(targetKey) && !isPropertyKey(targetKey) && !isNumber(targetKey)) throw new TypeError();

        let targetMetadata = weakMetadata.get(target);
        if (targetMetadata) {
            let keyMetadata = targetMetadata.get(targetKey);
            if (keyMetadata) {
                return keyMetadata.get(metadataKey);
            }
        }
        return undefined;
    }

    /**
      * Gets the metadata keys defined on the target object or its prototype chain.
      * @param target The target object on which the metadata is defined.
      * @returns An array of unique metadata keys.
      */
    export function getMetadataKeys(target: Object): any[];

    /**
      * Gets the metadata keys defined on the target object or its prototype chain.
      * @param target The target object on which the metadata is defined.
      * @param targetKey The property key for the target.
      * @returns An array of unique metadata keys.
      */
    export function getMetadataKeys(target: Object, targetKey: PropertyKey): any[];

    /**
      * Gets the metadata keys defined on the target object or its prototype chain.
      * @param target The target object on which the metadata is defined.
      * @param targetIndex The parameter index of the target.
      * @returns An array of unique metadata keys.
      */
    export function getMetadataKeys(target: Object, targetIndex: number): any[];

    export function getMetadataKeys(target: Object, targetKey?: PropertyKey | number): any[] {
        if (!isObject(target)) throw new TypeError();
        if (!isMissing(targetKey) && !isPropertyKey(targetKey) && !isNumber(targetKey)) throw new TypeError();

        let keySet = new Set<any>();
        let keys: any[] = [];
        while (target) {
            for (let key of Reflect.getOwnMetadataKeys(target, targetKey)) {
                if (!keySet.has(key)) {
                    keySet.add(key);
                    keys.push(key);
                }
            }
            target = Reflect.getPrototypeOf(target);
        }
        return keys;
    }

    /**
      * Gets the unique metadata keys defined on the target object.
      * @param target The target object on which the metadata is defined.
      * @returns An array of unique metadata keys.
      */
    export function getOwnMetadataKeys(target: Object): any[];

    /**
      * Gets the unique metadata keys defined on the target object.
      * @param target The target object on which the metadata is defined.
      * @param targetKey The property key for the target.
      * @returns An array of unique metadata keys.
      */
    export function getOwnMetadataKeys(target: Object, targetKey: PropertyKey): any[];

    /**
      * Gets the unique metadata keys defined on the target object.
      * @param target The target object on which the metadata is defined.
      * @param targetIndex The parameter index of the target.
      * @returns An array of unique metadata keys.
      */
    export function getOwnMetadataKeys(target: Object, targetIndex: number): any[];

    export function getOwnMetadataKeys(target: Object, targetKey?: PropertyKey | number): any[] {
        if (!isObject(target)) throw new TypeError();
        if (!isMissing(targetKey) && !isPropertyKey(targetKey) && !isNumber(targetKey)) throw new TypeError();

        let result: any[] = [];
        let targetMetadata = weakMetadata.get(target);
        if (targetMetadata) {
            let keyMetadata = targetMetadata.get(targetKey);
            if (keyMetadata) {
                keyMetadata.forEach((_, key) => result.push(key));
            }
        }
        return result;
    }

    /**
      * Deletes the metadata entry from the target object with the provided key.
      * @param metadataKey A key used to store and retrieve metadata.
      * @param target The target object on which the metadata is defined.
      * @returns `true` if the metadata entry was found and deleted; otherwise, false.
      */
    export function deleteMetadata(metadataKey: any, target: Object): boolean;

    /**
      * Deletes the metadata entry from the target object with the provided key.
      * @param metadataKey A key used to store and retrieve metadata.
      * @param target The target object on which the metadata is defined.
      * @param targetKey The property key for the target.
      * @returns `true` if the metadata entry was found and deleted; otherwise, false.
      */
    export function deleteMetadata(metadataKey: any, target: Object, targetKey: PropertyKey): boolean;

    /**
      * Deletes the metadata entry from the target object with the provided key.
      * @param metadataKey A key used to store and retrieve metadata.
      * @param target The target object on which the metadata is defined.
      * @param targetIndex The parameter index of the target.
      * @returns `true` if the metadata entry was found and deleted; otherwise, false.
      */
    export function deleteMetadata(metadataKey: any, target: Object, targetIndex: number): boolean;

    export function deleteMetadata(metadataKey: any, target: Object, targetKey?: PropertyKey | number): boolean {
        if (!isObject(target)) throw new TypeError();
        if (!isMissing(targetKey) && !isPropertyKey(targetKey) && !isNumber(targetKey)) throw new TypeError();

        let targetMetadata = weakMetadata.get(target);
        if (targetMetadata) {
            let keyMetadata = targetMetadata.get(targetKey);
            if (keyMetadata) {
                if (keyMetadata.delete(metadataKey)) {
                    if (keyMetadata.size === 0) {
                        targetMetadata.delete(targetKey);
                        if (targetMetadata.size === 0) {
                            weakMetadata.delete(target);
                        }
                    }
                    return true;
                }
            }
        }
        return false;
    }

    /**
      * Merges unique metadata from a source Object into a target Object, returning the target.
      * @param target The target object.
      * @param source The source object.
      * @returns The target object.
      */
    export function mergeMetadata<T extends Object>(target: T, source: Object): T {
        if (!isObject(target)) throw new TypeError();
        if (!isObject(source)) throw new TypeError();
        
        if (source === target) {
            return target;
        }

        let sourceMetadata = weakMetadata.get(source);
        if (!sourceMetadata) {
            return target;
        }

        let targetMetadata = weakMetadata.get(target);
        if (!targetMetadata) {
            targetMetadata = new Map<PropertyKey | number, Map<any, any>>();
            weakMetadata.set(target, targetMetadata);
        }

        sourceMetadata.forEach((sourceKeyMetadata, key) => {
            let targetKeyMetadata = targetMetadata.get(key);
            if (!targetKeyMetadata) {
                targetKeyMetadata = new Map<any, any>();
                targetMetadata.set(key, targetKeyMetadata);
            }
            sourceKeyMetadata.forEach((metadataValue, metadataKey) => {
                if (!targetKeyMetadata.has(metadataKey)) {
                    targetKeyMetadata.set(metadataKey, metadataValue);
                }
            });
        });

        return target;
    }
}
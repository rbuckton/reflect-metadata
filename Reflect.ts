/*! *****************************************************************************
Copyright (C) Microsoft. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use 
this file except in compliance with the License. You may obtain a copy of the 
License at http://www.apache.org/licenses/LICENSE-2.0 

Unless required by applicable law or agreed to in writing, software 
distributed under the License is distributed on an "AS IS" BASIS, 
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. 

See the License for the specific language governing permissions and 
limitations under the License. 
***************************************************************************** */
"use strict";

type ClassDecorator = (target: Function) => Function | void;
type ParameterDecorator = (target: Function, paramIndex: number) => Function | void;
type PropertyDecorator = (target: Object, propertyKey: string | symbol, descriptor?: PropertyDescriptor) => PropertyDescriptor | void;
type Decorator = ClassDecorator | ParameterDecorator | PropertyDecorator;

module Reflect {
    // naive Map shim
    const _Map: MapConstructor = typeof Map === "function" ? Map : (function () {
        let cacheSentinel = {};
        function Map() {
            this._keys = [];
            this._values = [];
            this._cache = cacheSentinel;
        }
        Map.prototype = {
            get size() { 
                return this._keys.length; 
            },
            has(key: any): boolean {
                if (key === this._cache) {
                    return true;
                }
                if (this._find(key) >= 0) {
                    this._cache = key;
                    return true;
                }
                return false;
            },
            get(key: any): any {
                let index = this._find(key);
                if (index > 0) {
                    this._cache = key;
                    return this._values[index];
                }
                return undefined;
            },
            set(key: any, value: any): Map<any, any> {
                this.delete(key);
                this._keys.push(key);
                this._values.push(value);
                this._cache = key;
                return this;
            },
            delete(key: any): boolean {
                let index = this._find(key);
                if (index) {
                    this._keys.splice(index, 1);
                    this._values.splice(index, 1);
                    this._cache = cacheSentinel;
                    return true;
                }
                return false;
            },
            clear(): void {
                this._keys.length = 0;
                this._values.length = 0;
                this._cache = cacheSentinel;
            },
            forEach(callback: (value: any, key: any, map: Map<any, any>) => void, thisArg?: any): void {
                let size = this.size;
                for (let i = 0; i < size; ++i) {
                    let key = this._keys[i];
                    let value = this._values[i];
                    this._cache = key;
                    callback.call(this, value, key, this);
                }
            },
            _find(key: any): number {
                for (let i = 0; i < this._keys.length; ++i) {
                    if (this._keys[i] === key) {
                        return i;
                    }
                }
                return -1;
            }
        };
        return <any>Map;
    })();

    // naive Set shim
    const _Set: SetConstructor = typeof Set === "function" ? Set : (function() {
        const cacheSentinel = {};
        function Set() {
            this._values = [];
            this._cache = cacheSentinel;
        }
        Set.prototype = {
            get size() { 
                return this._values.length; 
            },
            has(value: any): boolean {
                if (value === this._cache) {
                    return true;
                }
                if (this._find(value) >= 0) {
                    this._cache = value;
                    return true;
                }
                return false;
            },
            add(value: any): Set<any> {
                if (this._find(value) < 0) {
                    this._values.push(value);
                }
                this._cache = value;
                return this;
            },
            delete(value: any): boolean {
                let index = this._find(value);
                if (index >= 0) {
                    this._values.splice(index, 1);
                    this._cache = cacheSentinel;
                    return true;
                }
                return false;
            },
            clear(): void {
                this._values.length = 0;
                this._cache = cacheSentinel;
            },
            forEach(callback: (value: any, key: any, set: Set<any>) => void, thisArg?: any): void {
                for (let i = 0; i < this._values.length; ++i) {
                    let value = this._values[i];
                    this._cache = value;
                    callback.call(thisArg, value, value, this);
                }
            },
            _find(value: any): number {
                for (let i = 0; i < this._values.length; ++i) {
                    if (this._values[i] === value) {
                        return i;
                    }
                }
                return -1;
            }
        };
        return <any>Set;
    })();

    // naive WeakMap shim
    const _WeakMap: WeakMapConstructor = typeof WeakMap === "function" ? WeakMap : (function () {
        let hasOwn = Object.prototype.hasOwnProperty;
        let keys: { [key: string]: boolean; } = {};
        let desc = { configurable: true, enumerable: false, writable: true };
        function WeakMap() {
            this.clear();
        }
        WeakMap.prototype = {
            has(target: Object): boolean {
                return hasOwn.call(target, this._key);
            },
            get(target: Object): any {
                if (hasOwn.call(target, this._key)) {
                    return (<any>target)[this._key];
                }
                return undefined;
            },
            set(target: Object, value: any): WeakMap<any, any> {
                if (!hasOwn.call(target, this._key)) {
                    Object.defineProperty(target, this._key, desc)
                }
                (<any>target)[this._key] = value;
                return this;
            },
            delete(target: Object): boolean {
                if (hasOwn.call(target, this._key)) {
                    return delete (<any>target)[this._key];
                }
                return false;
            },
            clear(): void {
                // NOTE: not a real clear, just makes the previous data unreachable
                let key: string;
                do key = "@@WeakMap@" + Math.random().toString(16).substr(2);
                while (!hasOwn.call(keys, key));
                keys[key] = true;
                this._key = key;
            }
        }
        return <any>WeakMap;
    })();

    const weakMetadata = new _WeakMap<Object, Map<string | symbol | number, Map<any, any>>>();
    const isMissing = (x: any) => x == null;
    const isNumber = (x: any) => typeof x === "number";
    const isPropertyKey = (x: any) => typeof x === "string" || typeof x === "symbol";
    const isFunction = (x: any) => typeof x === "function";
    const isObject = (x: any) => typeof x === "object" ? x !== null : typeof x === "function"
    const isArray = Array.isArray;
    const getOwnPropertyDescriptorCore: (target: Object, propertyKey: string | symbol) => PropertyDescriptor = (<any>Reflect).getOwnPropertyDescriptor || Object.getOwnPropertyDescriptor;
    const definePropertyCore: (target: Object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => void = (<any>Reflect).defineProperty || Object.defineProperty;
    const getPrototypeOfCore: (target: Object) => Object = (<any>Reflect).getPrototypeOf || Object.getPrototypeOf;

    /**
      * Applies a set of decorators to a target object.
      * @param decorators An array of decorators.
      * @param target The target object.
      * @returns The result of applying the provided decorators.
      * @remarks Decorators are applied in reverse order of their positions in the array.
      * @example
      *
      *     class C { }
      *
      *     // constructor
      *     C = Reflect.decorate(decoratorsArray, C);
      *
      */
    export function decorate(decorators: ClassDecorator[], target: Function): Function;

    /**
      * Applies a set of decorators to a property of a target object.
      * @param decorators An array of decorators.
      * @param target The target object.
      * @param targetKey The property key to decorate.
      * @remarks Decorators are applied in reverse order.
      * @example
      *
      *     class C {
      *         // property declarations are not part of ES6, though they are valid in TypeScript:
      *         // static staticProperty;      
      *         // property;
      *    
      *         static staticMethod() { }
      *         method() { }
      *     }
      *
      *     // property (on constructor)
      *     Reflect.decorate(decoratorsArray, C, "staticProperty");
      *
      *     // property (on prototype)
      *     Reflect.decorate(decoratorsArray, C.prototype, "property");
      *
      *     // method (on constructor)
      *     Reflect.decorate(decoratorsArray, C, "staticMethod");
      *
      *     // method (on prototype)
      *     Reflect.decorate(decoratorsArray, C.prototype, "method");
      *
      */
    export function decorate(decorators: PropertyDecorator[], target: Object, targetKey: string | symbol): void;

    /**
      * Applies a set of decorators to a function parameter.
      * @param decorators An array of decorators.
      * @param target The target function.
      * @param targetIndex The index of the parameter to decorate.
      * @remarks Decorators are applied in reverse order.
      * @example
      *
      *     class C {
      *         constructor(p) { }
      *         static staticMethod(p) { }
      *         method(p) { } 
      *     }
      *
      *     // parameter (on constructor)
      *     Reflect.decorate(decoratorsArray, C, 0);
      *
      *     // parameter (on method of constructor)
      *     Reflect.decorate(decoratorsArray, C.staticMethod, 0);
      *
      *     // parameter (on method of prototype)
      *     Reflect.decorate(decoratorsArray, C.prototype.method, 0);
      *
      */
    export function decorate(decorators: ParameterDecorator[], target: Function, targetIndex: number): void;

    /**
      * Applies a set of decorators to a property of a target object.
      * @param decorators An array of decorators.
      * @param target The target object.
      * @param targetKeyOrIndex (Optional) The property key or parameter index to decorate.
      * @remarks Decorators are applied in reverse order.
      * @example
      *
      *     class C {
      *         // property declarations are not part of ES6, though they are valid in TypeScript:
      *         // static staticProperty;      
      *         // property;
      *
      *         constructor(p) { }
      *         static staticMethod(p) { }
      *         method(p) { } 
      *     }
      *
      *     // constructor
      *     C = Reflect.decorate(decoratorsArray, C);
      *
      *     // property (on constructor)
      *     Reflect.decorate(decoratorsArray, C, "staticProperty");
      *
      *     // property (on prototype)
      *     Reflect.decorate(decoratorsArray, C.prototype, "property");
      *
      *     // method (on constructor)
      *     Reflect.decorate(decoratorsArray, C, "staticMethod");
      *
      *     // method (on prototype)
      *     Reflect.decorate(decoratorsArray, C.prototype, "method");
      *
      *     // parameter (on constructor)
      *     Reflect.decorate(decoratorsArray, C, 0);
      *
      *     // parameter (on method of constructor)
      *     Reflect.decorate(decoratorsArray, C.staticMethod, 0);
      *
      *     // parameter (on method of prototype)
      *     Reflect.decorate(decoratorsArray, C.prototype.method, 0);
      *
      */
    export function decorate(decorators: Decorator[], target: Object, targetKeyOrIndex?: string | symbol | number): any {
        if (!isArray(decorators)) {
            throw new TypeError();
        }
        if (!isObject(target)) {
            throw new TypeError();
        }
        if (isNumber(targetKeyOrIndex) && !isFunction(target)) {
            throw new TypeError();
        }
        targetKeyOrIndex = toTargetKeyOrIndex(targetKeyOrIndex);
        return decorateCore(decorators, target, targetKeyOrIndex);
    }

    /**
      * A default metadata decorator factory that can be used on a class, class member, or parameter.
      * @param metadataKey The key for the metadata entry.
      * @param metadataValue The value for the metadata entry.
      * @returns A decorator function.
      * @remarks 
      * If `metadataKey` is already defined for the target and target key, the 
      * metadataValue for that key will be overwritten.
      * @example
      *
      *     // constructor
      *     @Reflect.metadata(key, value)
      *     class C {
      *     }
      *
      *     // property (on constructor, TypeScript only)
      *     class C {
      *         @Reflect.metadata(key, value)
      *         static staticProperty;
      *     }
      *
      *     // property (on prototype, TypeScript only)
      *     class C {
      *         @Reflect.metadata(key, value)
      *         property;
      *     }
      *
      *     // method (on constructor)
      *     class C {
      *         @Reflect.metadata(key, value)
      *         static staticMethod() { }
      *     }
      *
      *     // method (on prototype)
      *     class C {
      *         @Reflect.metadata(key, value)
      *         method() { }
      *     }
      *
      *     // parameter (on constructor)
      *     class C {
      *         constructor(
      *             @Reflect.metadata(key, value) x) { 
      *         }
      *     }
      *
      *     // parameter (on method of constructor)
      *     class C {
      *         static staticMethod(
      *             @Reflect.metadata(key, value) x) { 
      *         }
      *     }
      *
      *     // parameter (on method of prototype)
      *     class C {
      *         method(
      *             @Reflect.metadata(key, value) x) { 
      *         }
      *     }
      *
      */
    export function metadata(metadataKey: any, metadataValue: any): Decorator {
        function decorator(target: Function): void;
        function decorator(target: Function, targetIndex: number): void;
        function decorator(target: Object, targetKey: string | symbol): void;
        function decorator(target: Object, targetKeyOrIndex?: string | symbol | number): void {
            if (!isObject(target)) {
                throw new TypeError();
            }
            if (isNumber(targetKeyOrIndex) && !isFunction(target)) {
                throw new TypeError();
            }
            targetKeyOrIndex = toTargetKeyOrIndex(targetKeyOrIndex);
            return defineMetadataCore(metadataKey, metadataValue, target, targetKeyOrIndex);
        }
        return decorator;
    }
    
    /**
      * Define a unique metadata entry on the target.
      * @param metadataKey A key used to store and retrieve metadata.
      * @param metadataValue A value that contains attached metadata.
      * @param target The target object on which to define metadata.
      * @example
      *
      *     class C {
      *     }
      *
      *     // constructor
      *     Reflect.defineMetadata("custom:annotation", options, C);
      *
      *     // decorator factory as metadata-producing annotation.
      *     function MyAnnotation(options): ClassDecorator {
      *         return target => Reflect.defineMetadata("custom:annotation", options, target);
      *     }
      *
      */
    export function defineMetadata(metadataKey: any, metadataValue: any, target: Object): void;

    /**
      * Define a unique metadata entry on the target.
      * @param metadataKey A key used to store and retrieve metadata.
      * @param metadataValue A value that contains attached metadata.
      * @param target The target object on which to define metadata.
      * @param targetKey The property key for the target.
      * @example
      *
      *     class C {
      *         // property declarations are not part of ES6, though they are valid in TypeScript:
      *         // static staticProperty;      
      *         // property;
      *
      *         static staticMethod(p) { }
      *         method(p) { } 
      *     }
      *
      *     // property (on constructor)
      *     Reflect.defineMetadata("custom:annotation", Number, C, "staticProperty");
      *
      *     // property (on prototype)
      *     Reflect.defineMetadata("custom:annotation", Number, C.prototype, "property");
      *
      *     // method (on constructor)
      *     Reflect.defineMetadata("custom:annotation", Number, C, "staticMethod");
      *
      *     // method (on prototype)
      *     Reflect.defineMetadata("custom:annotation", Number, C.prototype, "method");
      *
      *     // decorator factory as metadata-producing annotation.
      *     function MyAnnotation(options): PropertyDecorator {
      *         return (target, key) => Reflect.defineMetadata("custom:annotation", options, target, key);
      *     }
      *
      */
    export function defineMetadata(metadataKey: any, metadataValue: any, target: Object, targetKey: string | symbol): void;

    /**
      * Define a unique metadata entry on the target.
      * @param metadataKey A key used to store and retrieve metadata.
      * @param metadataValue A value that contains attached metadata.
      * @param target The target object on which to define metadata.
      * @param targetIndex The parameter index of the target.
      * @example
      *
      *     class C {
      *         constructor(p) { }
      *         static staticMethod(p) { }
      *         method(p) { } 
      *     }
      *
      *     // parameter (on constructor)
      *     Reflect.defineMetadata("custom:annotation", Number, C, 0);
      *
      *     // parameter (on method of constructor)
      *     Reflect.defineMetadata("custom:annotation", Number, C.staticMethod, 0);
      *
      *     // parameter (on method of prototype)
      *     Reflect.defineMetadata("custom:annotation", Number, C.prototype.method, 0);
      *
      *     // decorator factory as metadata-producing annotation.
      *     function MyAnnotation(options): ParameterDecorator {
      *         return (target, index) => Reflect.defineMetadata("custom:annotation", options, target, index);
      *     }
      *
      */
    export function defineMetadata(metadataKey: any, metadataValue: any, target: Object, targetIndex: number): void;

    /**
      * Define a unique metadata entry on the target.
      * @param metadataKey A key used to store and retrieve metadata.
      * @param metadataValue A value that contains attached metadata.
      * @param target The target object on which to define metadata.
      * @param targetKeyOrIndex (Optional) The property key or parameter index for the target.
      * @example
      *
      *     class C {
      *         // property declarations are not part of ES6, though they are valid in TypeScript:
      *         // static staticProperty;      
      *         // property;
      *
      *         constructor(p) { }
      *         static staticMethod(p) { }
      *         method(p) { } 
      *     }
      *
      *     // constructor
      *     Reflect.defineMetadata("custom:annotation", options, C);
      *
      *     // property (on constructor)
      *     Reflect.defineMetadata("custom:annotation", options, C, "staticProperty");
      *
      *     // property (on prototype)
      *     Reflect.defineMetadata("custom:annotation", options, C.prototype, "property");
      *
      *     // method (on constructor)
      *     Reflect.defineMetadata("custom:annotation", options, C, "staticMethod");
      *
      *     // method (on prototype)
      *     Reflect.defineMetadata("custom:annotation", options, C.prototype, "method");
      *
      *     // parameter (on constructor)
      *     Reflect.defineMetadata("custom:annotation", options, C, 0);
      *
      *     // parameter (on method of constructor)
      *     Reflect.defineMetadata("custom:annotation", options, C.staticMethod, 0);
      *
      *     // parameter (on method of prototype)
      *     Reflect.defineMetadata("custom:annotation", options, C.prototype.method, 0);
      *
      *     // decorator factory as metadata-producing annotation.
      *     function MyAnnotation(options): Decorator {
      *         return (target, keyOrIndex?) => Reflect.defineMetadata("custom:annotation", options, target, keyOrIndex);
      *     }
      *
      */
    export function defineMetadata(metadataKey: any, metadataValue: any, target: Object, targetKeyOrIndex?: string | symbol | number): void {
        if (!isObject(target)) {
            throw new TypeError();
        }
        if (isNumber(targetKeyOrIndex) && !isFunction(target)) {
            throw new TypeError();
        }
        targetKeyOrIndex = toTargetKeyOrIndex(targetKeyOrIndex);
        return defineMetadataCore(metadataKey, metadataValue, target, targetKeyOrIndex);
    }
    
    /**
      * Gets a value indicating whether the target object or its prototype chain has the provided metadata key defined.
      * @param metadataKey A key used to store and retrieve metadata.
      * @param target The target object on which the metadata is defined.
      * @returns `true` if the metadata key was defined on the target object or its prototype chain; otherwise, `false`.
      * @example
      *
      *     class C {
      *     }
      *
      *     // constructor
      *     result = Reflect.hasMetadata("custom:annotation", C);
      *
      */
    export function hasMetadata(metadataKey: any, target: Object): boolean;

    /**
      * Gets a value indicating whether the target object or its prototype chain has the provided metadata key defined.
      * @param metadataKey A key used to store and retrieve metadata.
      * @param target The target object on which the metadata is defined.
      * @param targetKey The property key for the target.
      * @returns `true` if the metadata key was defined on the target object or its prototype chain; otherwise, `false`.
      * @example
      *
      *     class C {
      *         // property declarations are not part of ES6, though they are valid in TypeScript:
      *         // static staticProperty;      
      *         // property;
      *
      *         static staticMethod(p) { }
      *         method(p) { } 
      *     }
      *
      *     // property (on constructor)
      *     result = Reflect.hasMetadata("custom:annotation", C, "staticProperty");
      *
      *     // property (on prototype)
      *     result = Reflect.hasMetadata("custom:annotation", C.prototype, "property");
      *
      *     // method (on constructor)
      *     result = Reflect.hasMetadata("custom:annotation", C, "staticMethod");
      *
      *     // method (on prototype)
      *     result = Reflect.hasMetadata("custom:annotation", C.prototype, "method");
      *
      */
    export function hasMetadata(metadataKey: any, target: Object, targetKey: string | symbol): boolean;

    /**
      * Gets a value indicating whether the target object or its prototype chain has the provided metadata key defined.
      * @param metadataKey A key used to store and retrieve metadata.
      * @param target The target object on which the metadata is defined.
      * @param targetIndex The parameter index of the target.
      * @returns `true` if the metadata key was defined on the target object or its prototype chain; otherwise, `false`.
      * @example
      *
      *     class C {
      *         constructor(p) { }
      *         static staticMethod(p) { }
      *         method(p) { } 
      *     }
      *
      *     // parameter (on constructor)
      *     result = Reflect.hasMetadata("custom:annotation", C, 0);
      *
      *     // parameter (on method of constructor)
      *     result = Reflect.hasMetadata("custom:annotation", C.staticMethod, 0);
      *
      *     // parameter (on method of prototype)
      *     result = Reflect.hasMetadata("custom:annotation", C.prototype.method, 0);
      *
      */
    export function hasMetadata(metadataKey: any, target: Object, targetIndex: number): boolean;

    /**
      * Gets a value indicating whether the target object or its prototype chain has the provided metadata key defined.
      * @param metadataKey A key used to store and retrieve metadata.
      * @param target The target object on which the metadata is defined.
      * @param targetKeyOrIndex (Optional) The property key or parameter index of the target.
      * @returns `true` if the metadata key was defined on the target object or its prototype chain; otherwise, `false`.
      * @example
      *
      *     class C {
      *         // property declarations are not part of ES6, though they are valid in TypeScript:
      *         // static staticProperty;      
      *         // property;
      *
      *         constructor(p) { }
      *         static staticMethod(p) { }
      *         method(p) { } 
      *     }
      *
      *     // constructor
      *     result = Reflect.hasMetadata("custom:annotation", C);
      *
      *     // property (on constructor)
      *     result = Reflect.hasMetadata("custom:annotation", C, "staticProperty");
      *
      *     // property (on prototype)
      *     result = Reflect.hasMetadata("custom:annotation", C.prototype, "property");
      *
      *     // method (on constructor)
      *     result = Reflect.hasMetadata("custom:annotation", C, "staticMethod");
      *
      *     // method (on prototype)
      *     result = Reflect.hasMetadata("custom:annotation", C.prototype, "method");
      *
      *     // parameter (on constructor)
      *     result = Reflect.hasMetadata("custom:annotation", C, 0);
      *
      *     // parameter (on method of constructor)
      *     result = Reflect.hasMetadata("custom:annotation", C.staticMethod, 0);
      *
      *     // parameter (on method of prototype)
      *     result = Reflect.hasMetadata("custom:annotation", C.prototype.method, 0);
      *
      */
    export function hasMetadata(metadataKey: any, target: Object, targetKeyOrIndex?: string | symbol | number): boolean {
        if (!isObject(target)) {
            throw new TypeError();
        }
        if (isNumber(targetKeyOrIndex) && !isFunction(target)) {
            throw new TypeError();
        }
        targetKeyOrIndex = toTargetKeyOrIndex(targetKeyOrIndex);
        return hasMetadataCore(metadataKey, target, targetKeyOrIndex);
    }

    /**
      * Gets a value indicating whether the target object has the provided metadata key defined.
      * @param metadataKey A key used to store and retrieve metadata.
      * @param target The target object on which the metadata is defined.
      * @returns `true` if the metadata key was defined on the target object; otherwise, `false`.
      * @example
      *
      *     class C {
      *     }
      *
      *     // constructor
      *     result = Reflect.hasOwnMetadata("custom:annotation", C);
      *
      */
    export function hasOwnMetadata(metadataKey: any, target: Object): boolean;

    /**
      * Gets a value indicating whether the target object has the provided metadata key defined.
      * @param metadataKey A key used to store and retrieve metadata.
      * @param target The target object on which the metadata is defined.
      * @param targetKey The property key for the target.
      * @returns `true` if the metadata key was defined on the target object; otherwise, `false`.
      * @example
      *
      *     class C {
      *         // property declarations are not part of ES6, though they are valid in TypeScript:
      *         // static staticProperty;      
      *         // property;
      *
      *         static staticMethod(p) { }
      *         method(p) { } 
      *     }
      *
      *     // property (on constructor)
      *     result = Reflect.hasOwnMetadata("custom:annotation", C, "staticProperty");
      *
      *     // property (on prototype)
      *     result = Reflect.hasOwnMetadata("custom:annotation", C.prototype, "property");
      *
      *     // method (on constructor)
      *     result = Reflect.hasOwnMetadata("custom:annotation", C, "staticMethod");
      *
      *     // method (on prototype)
      *     result = Reflect.hasOwnMetadata("custom:annotation", C.prototype, "method");
      *
      */
    export function hasOwnMetadata(metadataKey: any, target: Object, targetKey: string | symbol): boolean;

    /**
      * Gets a value indicating whether the target object has the provided metadata key defined.
      * @param metadataKey A key used to store and retrieve metadata.
      * @param target The target object on which the metadata is defined.
      * @param targetIndex The parameter index of the target.
      * @returns `true` if the metadata key was defined on the target object; otherwise, `false`.
      * @example
      *
      *     class C {
      *         constructor(p) { }
      *         static staticMethod(p) { }
      *         method(p) { } 
      *     }
      *
      *     // parameter (on constructor)
      *     result = Reflect.hasOwnMetadata("custom:annotation", C, 0);
      *
      *     // parameter (on method of constructor)
      *     result = Reflect.hasOwnMetadata("custom:annotation", C.staticMethod, 0);
      *
      *     // parameter (on method of prototype)
      *     result = Reflect.hasOwnMetadata("custom:annotation", C.prototype.method, 0);
      *
      */
    export function hasOwnMetadata(metadataKey: any, target: Object, targetIndex: number): boolean;

    /**
      * Gets a value indicating whether the target object has the provided metadata key defined.
      * @param metadataKey A key used to store and retrieve metadata.
      * @param target The target object on which the metadata is defined.
      * @param targetKeyOrIndex (Optional) The property key or parameter index of the target.
      * @returns `true` if the metadata key was defined on the target object; otherwise, `false`.
      * @example
      *
      *     class C {
      *         // property declarations are not part of ES6, though they are valid in TypeScript:
      *         // static staticProperty;      
      *         // property;
      *
      *         constructor(p) { }
      *         static staticMethod(p) { }
      *         method(p) { } 
      *     }
      *
      *     // constructor
      *     result = Reflect.hasOwnMetadata("custom:annotation", C);
      *
      *     // property (on constructor)
      *     result = Reflect.hasOwnMetadata("custom:annotation", C, "staticProperty");
      *
      *     // property (on prototype)
      *     result = Reflect.hasOwnMetadata("custom:annotation", C.prototype, "property");
      *
      *     // method (on constructor)
      *     result = Reflect.hasOwnMetadata("custom:annotation", C, "staticMethod");
      *
      *     // method (on prototype)
      *     result = Reflect.hasOwnMetadata("custom:annotation", C.prototype, "method");
      *
      *     // parameter (on constructor)
      *     result = Reflect.hasOwnMetadata("custom:annotation", C, 0);
      *
      *     // parameter (on method of constructor)
      *     result = Reflect.hasOwnMetadata("custom:annotation", C.staticMethod, 0);
      *
      *     // parameter (on method of prototype)
      *     result = Reflect.hasOwnMetadata("custom:annotation", C.prototype.method, 0);
      *
      */
    export function hasOwnMetadata(metadataKey: any, target: Object, targetKeyOrIndex?: string | symbol | number): boolean {
        if (!isObject(target)) {
            throw new TypeError();
        }
        if (isNumber(targetKeyOrIndex) && !isFunction(target)) {
            throw new TypeError();
        }
        targetKeyOrIndex = toTargetKeyOrIndex(targetKeyOrIndex);
        return hasOwnMetadataCore(metadataKey, target, targetKeyOrIndex);
    }

    /**
      * Gets the metadata value for the provided metadata key on the target object or its prototype chain.
      * @param metadataKey A key used to store and retrieve metadata.
      * @param target The target object on which the metadata is defined.
      * @returns The metadata value for the metadata key if found; otherwise, `undefined`.
      * @example
      *
      *     class C {
      *     }
      *
      *     // constructor
      *     result = Reflect.getMetadata("custom:annotation", C);
      *
      */
    export function getMetadata(metadataKey: any, target: Object): any;

    /**
      * Gets the metadata value for the provided metadata key on the target object or its prototype chain.
      * @param metadataKey A key used to store and retrieve metadata.
      * @param target The target object on which the metadata is defined.
      * @param targetKey The property key for the target.
      * @returns The metadata value for the metadata key if found; otherwise, `undefined`.
      * @example
      *
      *     class C {
      *         // property declarations are not part of ES6, though they are valid in TypeScript:
      *         // static staticProperty;      
      *         // property;
      *
      *         static staticMethod(p) { }
      *         method(p) { } 
      *     }
      *
      *     // property (on constructor)
      *     result = Reflect.getMetadata("custom:annotation", C, "staticProperty");
      *
      *     // property (on prototype)
      *     result = Reflect.getMetadata("custom:annotation", C.prototype, "property");
      *
      *     // method (on constructor)
      *     result = Reflect.getMetadata("custom:annotation", C, "staticMethod");
      *
      *     // method (on prototype)
      *     result = Reflect.getMetadata("custom:annotation", C.prototype, "method");
      *
      */
    export function getMetadata(metadataKey: any, target: Object, targetKey: string | symbol): any;

    /**
      * Gets the metadata value for the provided metadata key on the target object or its prototype chain.
      * @param metadataKey A key used to store and retrieve metadata.
      * @param target The target object on which the metadata is defined.
      * @param targetIndex The parameter index of the target.
      * @returns The metadata value for the metadata key if found; otherwise, `undefined`.
      * @example
      *
      *     class C {
      *         constructor(p) { }
      *         static staticMethod(p) { }
      *         method(p) { } 
      *     }
      *
      *     // parameter (on constructor)
      *     result = Reflect.getMetadata("custom:annotation", C, 0);
      *
      *     // parameter (on method of constructor)
      *     result = Reflect.getMetadata("custom:annotation", C.staticMethod, 0);
      *
      *     // parameter (on method of prototype)
      *     result = Reflect.getMetadata("custom:annotation", C.prototype.method, 0);
      *
      */
    export function getMetadata(metadataKey: any, target: Object, targetIndex: number): any;

    /**
      * Gets the metadata value for the provided metadata key on the target object or its prototype chain.
      * @param metadataKey A key used to store and retrieve metadata.
      * @param target The target object on which the metadata is defined.
      * @param targetKeyOrIndex (Optional) The property key or parameter index for the target.
      * @returns The metadata value for the metadata key if found; otherwise, `undefined`.
      * @example
      *
      *     class C {
      *         // property declarations are not part of ES6, though they are valid in TypeScript:
      *         // static staticProperty;      
      *         // property;
      *
      *         constructor(p) { }
      *         static staticMethod(p) { }
      *         method(p) { } 
      *     }
      *
      *     // constructor
      *     result = Reflect.getMetadata("custom:annotation", C);
      *
      *     // property (on constructor)
      *     result = Reflect.getMetadata("custom:annotation", C, "staticProperty");
      *
      *     // property (on prototype)
      *     result = Reflect.getMetadata("custom:annotation", C.prototype, "property");
      *
      *     // method (on constructor)
      *     result = Reflect.getMetadata("custom:annotation", C, "staticMethod");
      *
      *     // method (on prototype)
      *     result = Reflect.getMetadata("custom:annotation", C.prototype, "method");
      *
      *     // parameter (on constructor)
      *     result = Reflect.getMetadata("custom:annotation", C, 0);
      *
      *     // parameter (on method of constructor)
      *     result = Reflect.getMetadata("custom:annotation", C.staticMethod, 0);
      *
      *     // parameter (on method of prototype)
      *     result = Reflect.getMetadata("custom:annotation", C.prototype.method, 0);
      *
      */
    export function getMetadata(metadataKey: any, target: Object, targetKeyOrIndex?: string | symbol | number): any {
        if (!isObject(target)) {
            throw new TypeError();
        }
        if (isNumber(targetKeyOrIndex) && !isFunction(target)) {
            throw new TypeError();
        }
        targetKeyOrIndex = toTargetKeyOrIndex(targetKeyOrIndex);
        return getMetadataCore(metadataKey, target, targetKeyOrIndex);
    }

    /**
      * Gets the metadata value for the provided metadata key on the target object.
      * @param metadataKey A key used to store and retrieve metadata.
      * @param target The target object on which the metadata is defined.
      * @returns The metadata value for the metadata key if found; otherwise, `undefined`.
      * @example
      *
      *     class C {
      *     }
      *
      *     // constructor
      *     result = Reflect.getOwnMetadata("custom:annotation", C);
      *
      */
    export function getOwnMetadata(metadataKey: any, target: Object): any;

    /**
      * Gets the metadata value for the provided metadata key on the target object.
      * @param metadataKey A key used to store and retrieve metadata.
      * @param target The target object on which the metadata is defined.
      * @param targetKey The property key for the target.
      * @returns The metadata value for the metadata key if found; otherwise, `undefined`.
      * @example
      *
      *     class C {
      *         // property declarations are not part of ES6, though they are valid in TypeScript:
      *         // static staticProperty;      
      *         // property;
      *
      *         static staticMethod(p) { }
      *         method(p) { } 
      *     }
      *
      *     // property (on constructor)
      *     result = Reflect.getOwnMetadata("custom:annotation", C, "staticProperty");
      *
      *     // property (on prototype)
      *     result = Reflect.getOwnMetadata("custom:annotation", C.prototype, "property");
      *
      *     // method (on constructor)
      *     result = Reflect.getOwnMetadata("custom:annotation", C, "staticMethod");
      *
      *     // method (on prototype)
      *     result = Reflect.getOwnMetadata("custom:annotation", C.prototype, "method");
      *
      */
    export function getOwnMetadata(metadataKey: any, target: Object, targetKey: string | symbol): any;

    /**
      * Gets the metadata value for the provided metadata key on the target object.
      * @param metadataKey A key used to store and retrieve metadata.
      * @param target The target object on which the metadata is defined.
      * @param targetIndex The parameter index of the target.
      * @returns The metadata value for the metadata key if found; otherwise, `undefined`.
      * @example
      *
      *     class C {
      *         constructor(p) { }
      *         static staticMethod(p) { }
      *         method(p) { } 
      *     }
      *
      *     // parameter (on constructor)
      *     result = Reflect.getOwnMetadata("custom:annotation", C, 0);
      *
      *     // parameter (on method of constructor)
      *     result = Reflect.getOwnMetadata("custom:annotation", C.staticMethod, 0);
      *
      *     // parameter (on method of prototype)
      *     result = Reflect.getOwnMetadata("custom:annotation", C.prototype.method, 0);
      *
      */
    export function getOwnMetadata(metadataKey: any, target: Object, targetIndex: number): any;

    /**
      * Gets the metadata value for the provided metadata key on the target object.
      * @param metadataKey A key used to store and retrieve metadata.
      * @param target The target object on which the metadata is defined.
      * @param targetKeyOrIndex (Optional) The property key or parameter index for the target.
      * @returns The metadata value for the metadata key if found; otherwise, `undefined`.
      * @example
      *
      *     class C {
      *         // property declarations are not part of ES6, though they are valid in TypeScript:
      *         // static staticProperty;      
      *         // property;
      *
      *         constructor(p) { }
      *         static staticMethod(p) { }
      *         method(p) { } 
      *     }
      *
      *     // constructor
      *     result = Reflect.getOwnMetadata("custom:annotation", C);
      *
      *     // property (on constructor)
      *     result = Reflect.getOwnMetadata("custom:annotation", C, "staticProperty");
      *
      *     // property (on prototype)
      *     result = Reflect.getOwnMetadata("custom:annotation", C.prototype, "property");
      *
      *     // method (on constructor)
      *     result = Reflect.getOwnMetadata("custom:annotation", C, "staticMethod");
      *
      *     // method (on prototype)
      *     result = Reflect.getOwnMetadata("custom:annotation", C.prototype, "method");
      *
      *     // parameter (on constructor)
      *     result = Reflect.getOwnMetadata("custom:annotation", C, 0);
      *
      *     // parameter (on method of constructor)
      *     result = Reflect.getOwnMetadata("custom:annotation", C.staticMethod, 0);
      *
      *     // parameter (on method of prototype)
      *     result = Reflect.getOwnMetadata("custom:annotation", C.prototype.method, 0);
      *
      */
    export function getOwnMetadata(metadataKey: any, target: Object, targetKeyOrIndex?: string | symbol | number): any {
        if (!isObject(target)) {
            throw new TypeError();
        }
        if (isNumber(targetKeyOrIndex) && !isFunction(target)) {
            throw new TypeError();
        }
        targetKeyOrIndex = toTargetKeyOrIndex(targetKeyOrIndex);
        return getOwnMetadataCore(metadataKey, target, targetKeyOrIndex);
    }

    /**
      * Gets the metadata keys defined on the target object or its prototype chain.
      * @param target The target object on which the metadata is defined.
      * @returns An array of unique metadata keys.
      * @example
      *
      *     class C {
      *     }
      *
      *     // constructor
      *     result = Reflect.getMetadataKeys(C);
      *
      */
    export function getMetadataKeys(target: Object): any[];

    /**
      * Gets the metadata keys defined on the target object or its prototype chain.
      * @param target The target object on which the metadata is defined.
      * @param targetKey The property key for the target.
      * @returns An array of unique metadata keys.
      * @example
      *
      *     class C {
      *         // property declarations are not part of ES6, though they are valid in TypeScript:
      *         // static staticProperty;      
      *         // property;
      *
      *         static staticMethod(p) { }
      *         method(p) { } 
      *     }
      *
      *     // property (on constructor)
      *     result = Reflect.getMetadataKeys(C, "staticProperty");
      *
      *     // property (on prototype)
      *     result = Reflect.getMetadataKeys(C.prototype, "property");
      *
      *     // method (on constructor)
      *     result = Reflect.getMetadataKeys(C, "staticMethod");
      *
      *     // method (on prototype)
      *     result = Reflect.getMetadataKeys(C.prototype, "method");
      *
      */
    export function getMetadataKeys(target: Object, targetKey: string | symbol): any[];

    /**
      * Gets the metadata keys defined on the target object or its prototype chain.
      * @param target The target object on which the metadata is defined.
      * @param targetIndex The parameter index of the target.
      * @returns An array of unique metadata keys.
      * @example
      *
      *     class C {
      *         constructor(p) { }
      *         static staticMethod(p) { }
      *         method(p) { } 
      *     }
      *
      *     // parameter (on constructor)
      *     result = Reflect.getMetadataKeys(C, 0);
      *
      *     // parameter (on method of constructor)
      *     result = Reflect.getMetadataKeys(C.staticMethod, 0);
      *
      *     // parameter (on method of prototype)
      *     result = Reflect.getMetadataKeys(C.prototype.method, 0);
      *
      */
    export function getMetadataKeys(target: Object, targetIndex: number): any[];

    /**
      * Gets the metadata keys defined on the target object or its prototype chain.
      * @param target The target object on which the metadata is defined.
      * @param targetKeyOrIndex (Optional) The property key or parameter index of the target.
      * @returns An array of unique metadata keys.
      * @example
      *
      *     class C {
      *         // property declarations are not part of ES6, though they are valid in TypeScript:
      *         // static staticProperty;      
      *         // property;
      *
      *         constructor(p) { }
      *         static staticMethod(p) { }
      *         method(p) { } 
      *     }
      *
      *     // constructor
      *     result = Reflect.getMetadataKeys(C);
      *
      *     // property (on constructor)
      *     result = Reflect.getMetadataKeys(C, "staticProperty");
      *
      *     // property (on prototype)
      *     result = Reflect.getMetadataKeys(C.prototype, "property");
      *
      *     // method (on constructor)
      *     result = Reflect.getMetadataKeys(C, "staticMethod");
      *
      *     // method (on prototype)
      *     result = Reflect.getMetadataKeys(C.prototype, "method");
      *
      *     // parameter (on constructor)
      *     result = Reflect.getMetadataKeys(C, 0);
      *
      *     // parameter (on method of constructor)
      *     result = Reflect.getMetadataKeys(C.staticMethod, 0);
      *
      *     // parameter (on method of prototype)
      *     result = Reflect.getMetadataKeys(C.prototype.method, 0);
      *
      */
    export function getMetadataKeys(target: Object, targetKeyOrIndex?: string | symbol | number): any[] {
        if (!isObject(target)) {
            throw new TypeError();
        }
        if (isNumber(targetKeyOrIndex) && !isFunction(target)) {
            throw new TypeError();
        }
        targetKeyOrIndex = toTargetKeyOrIndex(targetKeyOrIndex);
        return getMetadataKeysCore(target, targetKeyOrIndex);
    }

    /**
      * Gets the unique metadata keys defined on the target object.
      * @param target The target object on which the metadata is defined.
      * @returns An array of unique metadata keys.
      * @example
      *
      *     class C {
      *     }
      *
      *     // constructor
      *     result = Reflect.getOwnMetadataKeys(C);
      *
      */
    export function getOwnMetadataKeys(target: Object): any[];

    /**
      * Gets the unique metadata keys defined on the target object.
      * @param target The target object on which the metadata is defined.
      * @param targetKey The property key for the target.
      * @returns An array of unique metadata keys.
      * @example
      *
      *     class C {
      *         // property declarations are not part of ES6, though they are valid in TypeScript:
      *         // static staticProperty;      
      *         // property;
      *
      *         static staticMethod(p) { }
      *         method(p) { } 
      *     }
      *
      *     // property (on constructor)
      *     result = Reflect.getOwnMetadataKeys(C, "staticProperty");
      *
      *     // property (on prototype)
      *     result = Reflect.getOwnMetadataKeys(C.prototype, "property");
      *
      *     // method (on constructor)
      *     result = Reflect.getOwnMetadataKeys(C, "staticMethod");
      *
      *     // method (on prototype)
      *     result = Reflect.getOwnMetadataKeys(C.prototype, "method");
      *
      */
    export function getOwnMetadataKeys(target: Object, targetKey: string | symbol): any[];

    /**
      * Gets the unique metadata keys defined on the target object.
      * @param target The target object on which the metadata is defined.
      * @param targetIndex The parameter index of the target.
      * @returns An array of unique metadata keys.
      * @example
      *
      *     class C {
      *         constructor(p) { }
      *         static staticMethod(p) { }
      *         method(p) { } 
      *     }
      *
      *     // parameter (on constructor)
      *     result = Reflect.getOwnMetadataKeys(C, 0);
      *
      *     // parameter (on method of constructor)
      *     result = Reflect.getOwnMetadataKeys(C.staticMethod, 0);
      *
      *     // parameter (on method of prototype)
      *     result = Reflect.getOwnMetadataKeys(C.prototype.method, 0);
      *
      */
    export function getOwnMetadataKeys(target: Object, targetIndex: number): any[];

    /**
      * Gets the unique metadata keys defined on the target object.
      * @param target The target object on which the metadata is defined.
      * @param targetKeyOrIndex (Optional) The property key or parameter index of the target.
      * @returns An array of unique metadata keys.
      * @example
      *
      *     class C {
      *         // property declarations are not part of ES6, though they are valid in TypeScript:
      *         // static staticProperty;      
      *         // property;
      *
      *         constructor(p) { }
      *         static staticMethod(p) { }
      *         method(p) { } 
      *     }
      *
      *     // constructor
      *     result = Reflect.getOwnMetadataKeys(C);
      *
      *     // property (on constructor)
      *     result = Reflect.getOwnMetadataKeys(C, "staticProperty");
      *
      *     // property (on prototype)
      *     result = Reflect.getOwnMetadataKeys(C.prototype, "property");
      *
      *     // method (on constructor)
      *     result = Reflect.getOwnMetadataKeys(C, "staticMethod");
      *
      *     // method (on prototype)
      *     result = Reflect.getOwnMetadataKeys(C.prototype, "method");
      *
      *     // parameter (on constructor)
      *     result = Reflect.getOwnMetadataKeys(C, 0);
      *
      *     // parameter (on method of constructor)
      *     result = Reflect.getOwnMetadataKeys(C.staticMethod, 0);
      *
      *     // parameter (on method of prototype)
      *     result = Reflect.getOwnMetadataKeys(C.prototype.method, 0);
      *
      */
    export function getOwnMetadataKeys(target: Object, targetKeyOrIndex?: string | symbol | number): any[] {
        if (!isObject(target)) {
            throw new TypeError();
        }
        if (isNumber(targetKeyOrIndex) && !isFunction(target)) {
            throw new TypeError();
        }
        targetKeyOrIndex = toTargetKeyOrIndex(targetKeyOrIndex);
        return getOwnMetadataKeysCore(target, targetKeyOrIndex);
    }

    /**
      * Deletes the metadata entry from the target object with the provided key.
      * @param metadataKey A key used to store and retrieve metadata.
      * @param target The target object on which the metadata is defined.
      * @returns `true` if the metadata entry was found and deleted; otherwise, false.
      * @example
      *
      *     class C {
      *     }
      *
      *     // constructor
      *     result = Reflect.deleteMetadata("custom:annotation", C);
      *
      */
    export function deleteMetadata(metadataKey: any, target: Object): boolean;

    /**
      * Deletes the metadata entry from the target object with the provided key.
      * @param metadataKey A key used to store and retrieve metadata.
      * @param target The target object on which the metadata is defined.
      * @param targetKey The property key for the target.
      * @returns `true` if the metadata entry was found and deleted; otherwise, false.
      * @example
      *
      *     class C {
      *         // property declarations are not part of ES6, though they are valid in TypeScript:
      *         // static staticProperty;      
      *         // property;
      *
      *         static staticMethod(p) { }
      *         method(p) { } 
      *     }
      *
      *     // property (on constructor)
      *     result = Reflect.deleteMetadata("custom:annotation", C, "staticProperty");
      *
      *     // property (on prototype)
      *     result = Reflect.deleteMetadata("custom:annotation", C.prototype, "property");
      *
      *     // method (on constructor)
      *     result = Reflect.deleteMetadata("custom:annotation", C, "staticMethod");
      *
      *     // method (on prototype)
      *     result = Reflect.deleteMetadata("custom:annotation", C.prototype, "method");
      *
      */
    export function deleteMetadata(metadataKey: any, target: Object, targetKey: string | symbol): boolean;

    /**
      * Deletes the metadata entry from the target object with the provided key.
      * @param metadataKey A key used to store and retrieve metadata.
      * @param target The target object on which the metadata is defined.
      * @param targetIndex The parameter index of the target.
      * @returns `true` if the metadata entry was found and deleted; otherwise, false.
      * @example
      *
      *     class C {
      *         constructor(p) { }
      *         static staticMethod(p) { }
      *         method(p) { } 
      *     }
      *
      *     // parameter (on constructor)
      *     result = Reflect.deleteMetadata("custom:annotation", C, 0);
      *
      *     // parameter (on method of constructor)
      *     result = Reflect.deleteMetadata("custom:annotation", C.staticMethod, 0);
      *
      *     // parameter (on method of prototype)
      *     result = Reflect.deleteMetadata("custom:annotation", C.prototype.method, 0);
      *
      */
    export function deleteMetadata(metadataKey: any, target: Object, targetIndex: number): boolean;

    /**
      * Deletes the metadata entry from the target object with the provided key.
      * @param metadataKey A key used to store and retrieve metadata.
      * @param target The target object on which the metadata is defined.
      * @param targetKeyOrIndex (Optional) The property key or parameter index of the target.
      * @returns `true` if the metadata entry was found and deleted; otherwise, false.
      * @example
      *
      *     class C {
      *         // property declarations are not part of ES6, though they are valid in TypeScript:
      *         // static staticProperty;      
      *         // property;
      *
      *         constructor(p) { }
      *         static staticMethod(p) { }
      *         method(p) { } 
      *     }
      *
      *     // constructor
      *     result = Reflect.deleteMetadata("custom:annotation", C);
      *
      *     // property (on constructor)
      *     result = Reflect.deleteMetadata("custom:annotation", C, "staticProperty");
      *
      *     // property (on prototype)
      *     result = Reflect.deleteMetadata("custom:annotation", C.prototype, "property");
      *
      *     // method (on constructor)
      *     result = Reflect.deleteMetadata("custom:annotation", C, "staticMethod");
      *
      *     // method (on prototype)
      *     result = Reflect.deleteMetadata("custom:annotation", C.prototype, "method");
      *
      *     // parameter (on constructor)
      *     result = Reflect.deleteMetadata("custom:annotation", C, 0);
      *
      *     // parameter (on method of constructor)
      *     result = Reflect.deleteMetadata("custom:annotation", C.staticMethod, 0);
      *
      *     // parameter (on method of prototype)
      *     result = Reflect.deleteMetadata("custom:annotation", C.prototype.method, 0);
      *
      */
    export function deleteMetadata(metadataKey: any, target: Object, targetKeyOrIndex?: string | symbol | number): boolean {
        if (!isObject(target)) {
            throw new TypeError();
        }
        if (isNumber(targetKeyOrIndex) && !isFunction(target)) {
            throw new TypeError();
        }
        targetKeyOrIndex = toTargetKeyOrIndex(targetKeyOrIndex);
        return deleteMetadataCore(metadataKey, target, targetKeyOrIndex);
    }

    /**
      * Merges unique metadata from a source Object into a target Object, returning the target.
      * @param target The target object.
      * @param source The source object.
      * @returns The target object.
      * @example
      *
      *     result = Reflect.mergeMetadata(target, source);
      *
      */
    export function mergeMetadata<T extends Object>(target: T, source: Object): T {
        if (!isObject(target)) {
            throw new TypeError();
        }
        if (!isObject(source)) {
            throw new TypeError();
        }
        return mergeMetadataCore<T>(target, source);
    }

    function decorateCore(decorators: Decorator[], target: Object, targetKeyOrIndex?: string | symbol | number): any {
       if (isMissing(targetKeyOrIndex)) {
            return decorateConstructor(<ClassDecorator[]>decorators, <Function>target);            
        }
        else if (isNumber(targetKeyOrIndex)) {
            return decorateParameter(<ParameterDecorator[]>decorators, <Function>target, <number>targetKeyOrIndex);
        }
        else {
            return decorateProperty(<PropertyDecorator[]>decorators, target, toPropertyKey(targetKeyOrIndex));
        }
    }
    
    function decorateConstructor(decorators: ClassDecorator[], target: Function): Function {
        for (let i = decorators.length - 1; i >= 0; --i) {
            let decorator = decorators[i];
            let decorated = decorator(target);
            if (decorated != null) {
                target = mergeMetadataCore(<Function>decorated, target);
            }
        }
        return target;
    }

    function decorateProperty(decorators: PropertyDecorator[], target: Object, propertyKey: string | symbol): void {
        let descriptor = getOwnPropertyDescriptorCore(target, propertyKey),
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
            definePropertyCore(target, propertyKey, descriptor);
        }
    }
    
    function decorateParameter(decorators: ParameterDecorator[], target: Function, paramIndex: number): void {
        for (let i = decorators.length - 1; i >= 0; --i) {
            let decorator = decorators[i];
            decorator(target, paramIndex);
        }
    }
     
    function defineMetadataCore(metadataKey: any, metadataValue: any, target: Object, targetKeyOrIndex: string | symbol | number): void {
        let targetMetadata = weakMetadata.get(target);
        if (!targetMetadata) {
            targetMetadata = new _Map<string | symbol | number, Map<any, any>>();
            weakMetadata.set(target, targetMetadata);
        }

        let keyMetadata = targetMetadata.get(targetKeyOrIndex);
        if (!keyMetadata) {
          keyMetadata = new _Map<any, any>();
          targetMetadata.set(targetKeyOrIndex, keyMetadata);
        }

        keyMetadata.set(metadataKey, metadataValue);
    }

    function hasMetadataCore(metadataKey: any, target: Object, targetKeyOrIndex: string | symbol | number): boolean {
        while (target) {
            if (hasOwnMetadataCore(metadataKey, target, targetKeyOrIndex)) {
                return true;
            }
            target = getPrototypeOfCore(target);
        }
        return false;
    }

    function hasOwnMetadataCore(metadataKey: any, target: Object, targetKeyOrIndex: string | symbol | number): boolean {
        let targetMetadata = weakMetadata.get(target);
        if (targetMetadata) {
            let keyMetadata = targetMetadata.get(targetKeyOrIndex);
            if (keyMetadata) {
                return keyMetadata.has(metadataKey);
            }
        }
        return false;
    }

    function getMetadataCore(metadataKey: any, target: Object, targetKeyOrIndex: string | symbol | number): any {
        while (target) {
            if (hasOwnMetadataCore(metadataKey, target, targetKeyOrIndex)) {
                return getOwnMetadataCore(metadataKey, target, targetKeyOrIndex);
            }
            target = getPrototypeOfCore(target);
        }
        return undefined;
    }

    function getOwnMetadataCore(metadataKey: any, target: Object, targetKeyOrIndex: string | symbol | number): any {
        let targetMetadata = weakMetadata.get(target);
        if (targetMetadata) {
            let keyMetadata = targetMetadata.get(targetKeyOrIndex);
            if (keyMetadata) {
                return keyMetadata.get(metadataKey);
            }
        }
        return undefined;
    }

    function getMetadataKeysCore(target: Object, targetKeyOrIndex: string | symbol | number): any[] {
        let keySet = new _Set<any>();
        let keys: any[] = [];
        while (target) {
            for (let key of getOwnMetadataKeysCore(target, targetKeyOrIndex)) {
                if (!keySet.has(key)) {
                    keySet.add(key);
                    keys.push(key);
                }
            }
            target = getPrototypeOfCore(target);
        }
        return keys;
    }

    function getOwnMetadataKeysCore(target: Object, targetKeyOrIndex: string | symbol | number): any[] {
        let result: any[] = [];
        let targetMetadata = weakMetadata.get(target);
        if (targetMetadata) {
            let keyMetadata = targetMetadata.get(targetKeyOrIndex);
            if (keyMetadata) {
                keyMetadata.forEach((_, key) => result.push(key));
            }
        }
        return result;
    }

    function deleteMetadataCore(metadataKey: any, target: Object, targetKeyOrIndex: string | symbol | number): boolean {
        let targetMetadata = weakMetadata.get(target);
        if (targetMetadata) {
            let keyMetadata = targetMetadata.get(targetKeyOrIndex);
            if (keyMetadata) {
                if (keyMetadata.delete(metadataKey)) {
                    if (keyMetadata.size === 0) {
                        targetMetadata.delete(targetKeyOrIndex);
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

    function mergeMetadataCore<T extends Object>(target: T, source: Object): T {
        if (source === target) {
            return target;
        }
        let sourceMetadata = weakMetadata.get(source);
        if (!sourceMetadata) {
            return target;
        }
        let targetMetadata = weakMetadata.get(target);
        if (!targetMetadata) {
            targetMetadata = new _Map<string | symbol | number, Map<any, any>>();
            weakMetadata.set(target, targetMetadata);
        }
        sourceMetadata.forEach((sourceKeyMetadata, key) => {
            let targetKeyMetadata = targetMetadata.get(key);
            if (!targetKeyMetadata) {
                targetKeyMetadata = new _Map<any, any>();
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

    function toPropertyKey(value: any): string | symbol {
        if (!isPropertyKey(value)) {
            return String(value);
        }
        return value;
    }

    function toTargetKeyOrIndex(value: any): string | symbol | number {
        if (!isMissing(value) && !isNumber(value)) {
            return toPropertyKey(value);
        }
        return value;
    }
}

// hook global Reflect
declare var global: any;
declare var WorkerGlobalScope: any;
(function(__global: any) {
    if (typeof __global.Reflect !== "undefined") {
        if (__global.Reflect !== Reflect) {
            for (var p in Reflect) {
                __global.Reflect[p] = (<any>Reflect)[p];
            }
        }
    }
    else {
        __global.Reflect = Reflect;
    }
})(typeof window !== "undefined" ? window :
    typeof WorkerGlobalScope !== "undefined" ? self :
    typeof global !== "undefined" ? global :
    Function("return this;")());
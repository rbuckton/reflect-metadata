"use strict";
var Reflect;
(function (Reflect) {
    const weakMetadata = new WeakMap();
    const weakPropertyMetadata = new WeakMap();
    const weakParameterMetadata = new WeakMap();
    function isFunction(x) {
        return typeof x === "function";
    }
    function isObject(x) {
        return (x != null && typeof x === "object") || isFunction(x);
    }
    function isNumber(x) {
        return typeof x === "number";
    }
    function isPropertyKey(x) {
        return typeof x === "string" || typeof x === "symbol";
    }
    /**
      * Applies a set of decorators to a target object.
      * @param target The target object.
      * @param decorators An array of decorators.
      * @remarks Decorators are applied in reverse order.
      */
    function decorate(target, ...decorators) {
        for (let i = decorators.length - 1; i >= 0; i--) {
            let decorator = decorators[i];
            let decorated = decorator(target);
            if (decorated === null || decorated === undefined) {
                continue;
            }
            target = decorated;
        }
        return target;
    }
    Reflect.decorate = decorate;
    /**
      * Applies a set of decorators to a property of a target object.
      * @param target The target object.
      * @param propertyKey The property key to decorate.
      * @param decorators An array of decorators.
      * @remarks Decorators are applied in reverse order.
      */
    function decorateProperty(target, propertyKey, ...decorators) {
        let descriptor = Reflect.getOwnPropertyDescriptor(target, propertyKey);
        if (descriptor === undefined) {
            descriptor = { enumerable: true, configurable: true, writable: true };
        }
        let { enumerable, configurable, writable, get, set, value } = descriptor;
        for (let i = decorators.length - 1; i >= 0; i--) {
            let decorator = decorators[i];
            let decorated = decorator(target, propertyKey, descriptor);
            if (decorated === null || decorated === undefined) {
                continue;
            }
            descriptor = decorated;
        }
        if (enumerable !== descriptor.enumerable ||
            configurable !== descriptor.configurable ||
            writable !== descriptor.writable ||
            value !== descriptor.value ||
            get !== descriptor.get ||
            set !== descriptor.set) {
            Object.defineProperty(target, propertyKey, descriptor);
        }
        return target;
    }
    Reflect.decorateProperty = decorateProperty;
    /**
      * Applies a set of decorators to a function parameter.
      * @param target The target function.
      * @param parameterIndex The index of the parameter to decorate.
      * @param decorators An array of decorators.
      * @remarks Decorators are applied in reverse order.
      */
    function decorateParameter(target, parameterIndex, ...decorators) {
        for (let i = decorators.length - 1; i >= 0; i--) {
            let decorator = decorators[i];
            decorator(target, parameterIndex);
        }
    }
    Reflect.decorateParameter = decorateParameter;
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
    function metadata(metadataKey, metadata) {
        return function (target, keyOrIndex) {
            if (isObject(target) && isPropertyKey(keyOrIndex)) {
                // (target: Object, key: string | symbol)
                definePropertyMetadata(target, keyOrIndex, metadataKey, metadata);
            }
            else if (isFunction(target) && isNumber(keyOrIndex)) {
                // (target: Function, index: number)
                defineParameterMetadata(target, keyOrIndex, metadataKey, metadata);
            }
            else if (isFunction(target)) {
                // (target: Function)
                defineMetadata(target, metadataKey, metadata);
            }
        };
    }
    Reflect.metadata = metadata;
    /**
      * Define a unique metadata entry on the target.
      * @param target The target object on which to define metadata.
      * @param metadataKey A key used to store and retrieve metadata.
      * @param metadata A value that contains attached metadata.
      * @example
      * ```
      * // Component decorator factory as metadata-producing annotation.
      * function Component(options) {
      *     return (target) => { Reflect.defineMetadata(target, Component, options); }
      * }
      * ```
      */
    function defineMetadata(target, metadataKey, metadata) {
        let metadataMap = weakMetadata.get(target);
        if (!metadataMap) {
            metadataMap = new Map();
            weakMetadata.set(target, metadataMap);
        }
        metadataMap.set(metadataKey, metadata);
    }
    Reflect.defineMetadata = defineMetadata;
    /**
      * Gets a value indicating whether the target object or its prototype chain has the provided metadata key defined.
      * @param target The target object on which the metadata is defined.
      * @param metadataKey A key used to store and retrieve metadata.
      * @returns `true` if the metadata key was defined on the target object or its prototype chain; otherwise, `false`.
      */
    function hasMetadata(target, metadataKey) {
        while (target) {
            if (Reflect.hasOwnMetadata(target, metadataKey)) {
                return true;
            }
            target = Reflect.getPrototypeOf(target);
        }
        return false;
    }
    Reflect.hasMetadata = hasMetadata;
    /**
      * Gets the metadata value for the provided metadata key on the target object or its prototype chain.
      * @param target The target object on which the metadata is defined.
      * @param metadataKey A key used to store and retrieve metadata.
      * @returns The metadata value for the metadata key if found; otherwise, `undefined`.
      * @example
      * ```
      * let metadata = Reflect.getMetadata(target, Component);
      * ```
      */
    function getMetadata(target, metadataKey) {
        while (target) {
            if (Reflect.hasOwnMetadata(target, metadataKey)) {
                return Reflect.getOwnMetadata(target, metadataKey);
            }
            target = Reflect.getPrototypeOf(target);
        }
        return undefined;
    }
    Reflect.getMetadata = getMetadata;
    /**
      * Gets the metadata keys defined on the target object or its prototype chain.
      * @param target The target object on which the metadata is defined.
      * @returns An array of unique metadata keys.
      */
    function getMetadataKeys(target) {
        let keySet = new Set();
        let keys = [];
        while (target) {
            for (let key of Reflect.getOwnMetadataKeys(target)) {
                if (!keySet.has(key)) {
                    keySet.add(key);
                    keys.push(key);
                }
            }
            target = Reflect.getPrototypeOf(target);
        }
        return keys;
    }
    Reflect.getMetadataKeys = getMetadataKeys;
    /**
      * Gets a value indicating whether the target object has the provided metadata key defined.
      * @param target The target object on which the metadata is defined.
      * @param metadataKey A key used to store and retrieve metadata.
      * @returns `true` if the metadata key was defined on the target object; otherwise, `false`.
      */
    function hasOwnMetadata(target, metadataKey) {
        let metadataMap = weakMetadata.get(target);
        if (metadataMap) {
            return metadataMap.has(metadataKey);
        }
        return false;
    }
    Reflect.hasOwnMetadata = hasOwnMetadata;
    /**
      * Gets the metadata value for the provided metadata key on the target object.
      * @param target The target object on which the metadata is defined.
      * @param metadataKey A key used to store and retrieve metadata.
      * @returns The metadata value for the metadata key if found; otherwise, `undefined`.
      * @example
      * ```
      * let metadata = Reflect.getOwnMetadata(target, Component);
      * ```
      */
    function getOwnMetadata(target, metadataKey) {
        let metadataMap = weakMetadata.get(target);
        if (metadataMap) {
            return metadataMap.get(metadataKey);
        }
        return undefined;
    }
    Reflect.getOwnMetadata = getOwnMetadata;
    /**
      * Gets the unique metadata keys defined on the target object.
      * @param target The target object on which the metadata is defined.
      * @returns An array of unique metadata keys.
      */
    function getOwnMetadataKeys(target) {
        let metadataMap = weakMetadata.get(target);
        if (metadataMap) {
            return [...metadataMap.keys()];
        }
        return [];
    }
    Reflect.getOwnMetadataKeys = getOwnMetadataKeys;
    /**
      * Deletes the metadata entry from the target object with the provided key.
      * @param target The target object on which the metadata is defined.
      * @param metadataKey A key used to store and retrieve metadata.
      * @returns `true` if the metadata entry was found and deleted; otherwise, false.
      */
    function deleteOwnMetadata(target, metadataKey) {
        let metadataMap = weakMetadata.get(target);
        if (metadataMap) {
            return metadataMap.delete(metadataKey);
        }
        return false;
    }
    Reflect.deleteOwnMetadata = deleteOwnMetadata;
    /**
      * Define a metadata entry on a property of the target.
      * @param target The target object on which to define metadata.
      * @param propertyKey The key of the property on the target.
      * @param metadataKey A key used to store and retrieve metadata.
      * @param metadata A value that contains attached metadata.
      * @example
      * ```
      * // MarshalAs decorator factory as metadata-producing annotation.
      * function MarshalAs(options) {
      *     return (target, propertyKey) => { Reflect.definePropertyMetadata(target, propertyKey, MarshalAs, options); }
      * }
      * ```
      */
    function definePropertyMetadata(target, propertyKey, metadataKey, metadata) {
        let propertyMap = weakPropertyMetadata.get(target);
        if (!propertyMap) {
            propertyMap = new Map();
            weakPropertyMetadata.set(target, propertyMap);
        }
        let metadataMap = propertyMap.get(propertyKey);
        if (!metadataMap) {
            metadataMap = new Map();
            propertyMap.set(propertyKey, metadataMap);
        }
        metadataMap.set(metadataKey, metadata);
    }
    Reflect.definePropertyMetadata = definePropertyMetadata;
    /**
      * Gets a value indicating whether a property of the target object or its prototype chain has the provided metadata key defined.
      * @param target The target object on which the metadata is defined.
      * @param propertyKey The key of the property on the target.
      * @param metadataKey A key used to store and retrieve metadata.
      * @returns `true` if the metadata key was defined on a property of the target object or its prototype chain; otherwise, `false`.
      */
    function hasPropertyMetadata(target, propertyKey, metadataKey) {
        while (target) {
            if (Reflect.hasOwnPropertyMetadata(target, propertyKey, metadataKey)) {
                return true;
            }
            target = Reflect.getPrototypeOf(target);
        }
        return false;
    }
    Reflect.hasPropertyMetadata = hasPropertyMetadata;
    /**
      * Gets the first metadata value for the provided metadata key on a property of the target object or its prototype chain.
      * @param target The target object on which the metadata is defined.
      * @param propertyKey The key of the property on the target.
      * @param metadataKey A key used to store and retrieve metadata.
      * @returns The metadata value for the metadata key if found; otherwise, `undefined`.
      * @example
      * ```
      * let metadata = Reflect.getPropertyMetadata(target, propertyKey, MarshalAs);
      * ```
      */
    function getPropertyMetadata(target, propertyKey, metadataKey) {
        while (target) {
            if (Reflect.hasOwnPropertyMetadata(target, propertyKey, metadataKey)) {
                return Reflect.getOwnPropertyMetadata(target, propertyKey, metadataKey);
            }
            target = Reflect.getPrototypeOf(target);
        }
        return undefined;
    }
    Reflect.getPropertyMetadata = getPropertyMetadata;
    /**
      * Gets the metadata keys defined on a property of the target object or its prototype chain.
      * @param target The target object on which the metadata is defined.
      * @param propertyKey The key of the property on the target.
      * @returns An array of unique metadata keys.
      */
    function getPropertyMetadataKeys(target, propertyKey) {
        let keySet = new Set();
        let keys = [];
        while (target) {
            for (let key of Reflect.getOwnPropertyMetadataKeys(target)) {
                if (!keySet.has(key)) {
                    keySet.add(key);
                    keys.push(key);
                }
            }
            target = Reflect.getPrototypeOf(target);
        }
        return keys;
    }
    Reflect.getPropertyMetadataKeys = getPropertyMetadataKeys;
    /**
      * Gets a value indicating whether a property of the target object has the provided metadata key defined.
      * @param target The target object on which the metadata is defined.
      * @param propertyKey The key of the property on the target.
      * @param metadataKey A key used to store and retrieve metadata.
      * @returns `true` if the metadata key was defined on the target object; otherwise, `false`.
      */
    function hasOwnPropertyMetadata(target, propertyKey, metadataKey) {
        let propertyMap = weakPropertyMetadata.get(target);
        if (propertyMap) {
            let metadataMap = propertyMap.get(propertyKey);
            if (metadataMap) {
                return metadataMap.has(metadataKey);
            }
        }
        return false;
    }
    Reflect.hasOwnPropertyMetadata = hasOwnPropertyMetadata;
    /**
      * Gets the metadata value for the provided metadata key on a property of the target object.
      * @param target The target object on which the metadata is defined.
      * @param propertyKey The key of the property on the target.
      * @param metadataKey A key used to store and retrieve metadata.
      * @returns The metadata value for the metadata key if found; otherwise, `undefined`.
      * @example
      * ```
      * let metadata = Reflect.getOwnPropertyMetadata(target, propertyKey, MarshalAs);
      * ```
      */
    function getOwnPropertyMetadata(target, propertyKey, metadataKey) {
        let propertyMap = weakPropertyMetadata.get(target);
        if (propertyMap) {
            let metadataMap = propertyMap.get(propertyKey);
            if (metadataMap) {
                return metadataMap.get(metadataKey);
            }
        }
        return undefined;
    }
    Reflect.getOwnPropertyMetadata = getOwnPropertyMetadata;
    /**
      * Gets the metadata keys defined on a property of the target object.
      * @param target The target object on which the metadata is defined.
      * @param propertyKey The key of the property on the target.
      * @returns An array of unique metadata keys.
      */
    function getOwnPropertyMetadataKeys(target, propertyKey) {
        let propertyMap = weakPropertyMetadata.get(target);
        if (propertyMap) {
            let metadataMap = propertyMap.get(propertyKey);
            if (metadataMap) {
                return [...metadataMap.keys()];
            }
        }
        return [];
    }
    Reflect.getOwnPropertyMetadataKeys = getOwnPropertyMetadataKeys;
    /**
      * Deletes the metadata from a property of the target object with the provided key.
      * @param target The target object on which the metadata is defined.
      * @param propertyKey The key of the property on the target.
      * @param metadataKey A key used to store and retrieve metadata.
      * @returns `true` if the metadata entry was found and deleted; otherwise, false.
      */
    function deleteOwnPropertyMetadata(target, propertyKey, metadataKey) {
        let propertyMap = weakPropertyMetadata.get(target);
        if (propertyMap) {
            let metadataMap = propertyMap.get(propertyKey);
            if (metadataMap) {
                return metadataMap.delete(metadataKey);
            }
        }
        return false;
    }
    Reflect.deleteOwnPropertyMetadata = deleteOwnPropertyMetadata;
    /**
      * Define a metadata entry on a parameter of the target function.
      * @param target The target function on which to define metadata.
      * @param parameterIndex The ordinal parameter index.
      * @param metadataKey A key used to store and retrieve metadata.
      * @param metadata A value that contains attached metadata.
      * @returns The target function.
      * @example
      * ```
      * // Inject decorator factory as metadata-producing annotation.
      * function Inject(type) {
      *     return (target, parameterIndex) => { Reflect.defineMetadata(target, parameterIndex, Inject, type); }
      * }
      * ```
      */
    function defineParameterMetadata(target, parameterIndex, metadataKey, metadata) {
        let parameterMap = weakParameterMetadata.get(target);
        if (!parameterMap) {
            parameterMap = new Map();
            weakParameterMetadata.set(target, parameterMap);
        }
        let metadataMap = parameterMap.get(parameterIndex);
        if (!metadataMap) {
            metadataMap = new Map();
            parameterMap.set(parameterIndex, metadataMap);
        }
        metadataMap.set(metadataKey, metadata);
    }
    Reflect.defineParameterMetadata = defineParameterMetadata;
    /**
      * Gets a value indicating whether a parameter of the target function or its prototype chain has the provided metadata key defined.
      * @param target The target function on which the metadata is defined.
      * @param parameterIndex The ordinal parameter index.
      * @param metadataKey A key used to store and retrieve metadata.
      * @returns `true` if the metadata key was defined on a property of the target function or its prototype chain; otherwise, `false`.
      */
    function hasParameterMetadata(target, parameterIndex, metadataKey) {
        let parameterMap = weakParameterMetadata.get(target);
        if (parameterMap) {
            let metadataMap = parameterMap.get(parameterIndex);
            if (metadataMap) {
                return metadataMap.has(metadataKey);
            }
        }
        return false;
    }
    Reflect.hasParameterMetadata = hasParameterMetadata;
    /**
      * Gets the first occurance of metadata for the provided metadata key on a parameter of the target function.
      * @param target The target function on which the metadata is defined.
      * @param parameterIndex The ordinal parameter index.
      * @param metadataKey A key used to store and retrieve metadata.
      * @returns The metadata value for the metadata key if found; otherwise, `undefined`.
      * @example
      * ```
      * let metadata = Reflect.getParameterMetadata(target, parameterIndex, Inject);
      * ```
      */
    function getParameterMetadata(target, parameterIndex, metadataKey) {
        let parameterMap = weakParameterMetadata.get(target);
        if (parameterMap) {
            let metadataMap = parameterMap.get(parameterIndex);
            if (metadataMap) {
                return metadataMap.get(metadataKey);
            }
        }
        return undefined;
    }
    Reflect.getParameterMetadata = getParameterMetadata;
    /**
      * Gets the unique metadata keys defined on a parameter of the target function.
      * @param target The target function on which the metadata is defined.
      * @param parameterIndex The ordinal parameter index.
      * @returns An array of unique metadata keys.
      */
    function getParameterMetadataKeys(target, parameterIndex) {
        let parameterMap = weakParameterMetadata.get(target);
        if (parameterMap) {
            let metadataMap = parameterMap.get(parameterIndex);
            if (metadataMap) {
                return [...metadataMap.keys()];
            }
        }
        return [];
    }
    Reflect.getParameterMetadataKeys = getParameterMetadataKeys;
    /**
      * Deletes the metadata from a parameter of the target function with the provided key.
      * @param target The target function on which the metadata is defined.
      * @param parameterIndex The ordinal parameter index.
      * @param metadataKey A key used to store and retrieve metadata.
      * @returns `true` if the metadata entry was found and deleted; otherwise, false.
      */
    function deleteParameterMetadata(target, parameterIndex, metadataKey) {
        let parameterMap = weakParameterMetadata.get(target);
        if (parameterMap) {
            let metadataMap = parameterMap.get(parameterIndex);
            if (metadataMap) {
                return metadataMap.delete(metadataKey);
            }
        }
        return undefined;
    }
    Reflect.deleteParameterMetadata = deleteParameterMetadata;
})(Reflect || (Reflect = {}));
//# sourceMappingURL=Reflect.js.map
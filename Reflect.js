"use strict";
var Reflect;
(function (Reflect) {
    var weakMetadata = new WeakMap();
    var isMissing = function (x) {
        return x == null;
    };
    var isNumber = function (x) {
        return typeof x === "number";
    };
    var isPropertyKey = function (x) {
        return typeof x === "string" || typeof x === "symbol";
    };
    var isFunction = function (x) {
        return typeof x === "function";
    };
    var isObject = function (x) {
        return typeof x === "object" ? x !== null : typeof x === "function";
    };
    var isArray = Array.isArray;
    var getOwnPropertyDescriptorCore = Reflect.getOwnPropertyDescriptor;
    var definePropertyCore = Reflect.defineProperty;
    var getPrototypeOfCore = Reflect.getPrototypeOf;
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
    function decorate(decorators, target, targetKeyOrIndex) {
        if (!isArray(decorators)) {
            throw new TypeError();
        }
        if (!isObject(target)) {
            throw new TypeError();
        }
        targetKeyOrIndex = toTargetKeyOrIndex(targetKeyOrIndex);
        return decorateCore(decorators, target, targetKeyOrIndex);
    }
    Reflect.decorate = decorate;
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
    function metadata(metadataKey, metadataValue) {
        function decorator(target, targetKeyOrIndex) {
            if (!isObject(target)) {
                throw new TypeError();
            }
            targetKeyOrIndex = toTargetKeyOrIndex(targetKeyOrIndex);
            return defineMetadataCore(metadataKey, metadataValue, target, targetKeyOrIndex);
        }
        return decorator;
    }
    Reflect.metadata = metadata;
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
    function defineMetadata(metadataKey, metadataValue, target, targetKeyOrIndex) {
        if (!isObject(target)) {
            throw new TypeError();
        }
        if (!isMissing(targetKeyOrIndex) && !isPropertyKey(targetKeyOrIndex) && !isNumber(targetKeyOrIndex)) {
            targetKeyOrIndex = String(targetKeyOrIndex);
        }
        return defineMetadataCore(metadataKey, metadataValue, target, targetKeyOrIndex);
    }
    Reflect.defineMetadata = defineMetadata;
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
    function hasMetadata(metadataKey, target, targetKeyOrIndex) {
        if (!isObject(target)) {
            throw new TypeError();
        }
        targetKeyOrIndex = toTargetKeyOrIndex(targetKeyOrIndex);
        return hasMetadataCore(metadataKey, target, targetKeyOrIndex);
    }
    Reflect.hasMetadata = hasMetadata;
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
    function hasOwnMetadata(metadataKey, target, targetKeyOrIndex) {
        if (!isObject(target)) {
            throw new TypeError();
        }
        targetKeyOrIndex = toTargetKeyOrIndex(targetKeyOrIndex);
        return hasOwnMetadataCore(metadataKey, target, targetKeyOrIndex);
    }
    Reflect.hasOwnMetadata = hasOwnMetadata;
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
    function getMetadata(metadataKey, target, targetKeyOrIndex) {
        if (!isObject(target)) {
            throw new TypeError();
        }
        targetKeyOrIndex = toTargetKeyOrIndex(targetKeyOrIndex);
        return getMetadataCore(metadataKey, target, targetKeyOrIndex);
    }
    Reflect.getMetadata = getMetadata;
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
    function getOwnMetadata(metadataKey, target, targetKeyOrIndex) {
        if (!isObject(target)) {
            throw new TypeError();
        }
        targetKeyOrIndex = toTargetKeyOrIndex(targetKeyOrIndex);
        return getOwnMetadata(metadataKey, target, targetKeyOrIndex);
    }
    Reflect.getOwnMetadata = getOwnMetadata;
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
    function getMetadataKeys(target, targetKeyOrIndex) {
        if (!isObject(target)) {
            throw new TypeError();
        }
        targetKeyOrIndex = toTargetKeyOrIndex(targetKeyOrIndex);
        return getMetadataKeysCore(target, targetKeyOrIndex);
    }
    Reflect.getMetadataKeys = getMetadataKeys;
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
    function getOwnMetadataKeys(target, targetKeyOrIndex) {
        if (!isObject(target)) {
            throw new TypeError();
        }
        targetKeyOrIndex = toTargetKeyOrIndex(targetKeyOrIndex);
        return getOwnMetadataKeysCore(target, targetKeyOrIndex);
    }
    Reflect.getOwnMetadataKeys = getOwnMetadataKeys;
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
    function deleteMetadata(metadataKey, target, targetKeyOrIndex) {
        if (!isObject(target)) {
            throw new TypeError();
        }
        targetKeyOrIndex = toTargetKeyOrIndex(targetKeyOrIndex);
        return deleteMetadataCore(metadataKey, target, targetKeyOrIndex);
    }
    Reflect.deleteMetadata = deleteMetadata;
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
    function mergeMetadata(target, source) {
        if (!isObject(target)) {
            throw new TypeError();
        }
        if (!isObject(source)) {
            throw new TypeError();
        }
        return mergeMetadataCore(target, source);
    }
    Reflect.mergeMetadata = mergeMetadata;
    function decorateCore(decorators, target, targetKeyOrIndex) {
        if (isMissing(targetKeyOrIndex)) {
            return decorateConstructor(decorators, target);
        }
        else if (isNumber(targetKeyOrIndex)) {
            return decorateParameter(decorators, target, targetKeyOrIndex);
        }
        else if (!isPropertyKey(targetKeyOrIndex)) {
            targetKeyOrIndex = String(targetKeyOrIndex);
        }
        return decorateProperty(decorators, target, targetKeyOrIndex);
    }
    function decorateConstructor(decorators, target) {
        for (var i = decorators.length - 1; i >= 0; --i) {
            var decorator = decorators[i];
            var decorated = decorator(target);
            if (decorated != null) {
                target = mergeMetadataCore(decorated, target);
            }
        }
        return target;
    }
    function decorateProperty(decorators, target, propertyKey) {
        var descriptor = getOwnPropertyDescriptorCore(target, propertyKey), enumerable, configurable, writable, value, _get, _set;
        if (descriptor) {
            (enumerable = descriptor.enumerable, configurable = descriptor.configurable, writable = descriptor.writable, value = descriptor.value, _get = descriptor._get, _set = descriptor._set, descriptor);
        }
        else {
            enumerable = true;
            configurable = true;
            writable = true;
            descriptor = {
                enumerable: enumerable,
                configurable: configurable,
                writable: writable,
                value: value
            };
        }
        for (var i = decorators.length - 1; i >= 0; --i) {
            var decorator = decorators[i];
            var decorated = decorator(target, propertyKey, descriptor);
            descriptor = decorated != null ? decorated : descriptor;
        }
        if (enumerable !== descriptor.enumerable || configurable !== descriptor.configurable || writable !== descriptor.writable || value !== descriptor.value || _get !== descriptor.get || _set !== descriptor.set) {
            definePropertyCore(target, propertyKey, descriptor);
        }
    }
    function decorateParameter(decorators, target, paramIndex) {
        for (var i = decorators.length - 1; i >= 0; --i) {
            var decorator = decorators[i];
            decorator(target, paramIndex);
        }
    }
    function defineMetadataCore(metadataKey, metadataValue, target, targetKeyOrIndex) {
        var targetMetadata = weakMetadata.get(target);
        if (!targetMetadata) {
            targetMetadata = new Map();
            weakMetadata.set(target, targetMetadata);
        }
        var keyMetadata = targetMetadata.get(targetKeyOrIndex);
        if (!keyMetadata) {
            keyMetadata = new Map();
            targetMetadata.set(targetKeyOrIndex, keyMetadata);
        }
        keyMetadata.set(metadataKey, metadata);
    }
    function hasMetadataCore(metadataKey, target, targetKeyOrIndex) {
        while (target) {
            if (hasOwnMetadataCore(metadataKey, target, targetKeyOrIndex)) {
                return true;
            }
            target = getPrototypeOfCore(target);
        }
        return false;
    }
    function hasOwnMetadataCore(metadataKey, target, targetKeyOrIndex) {
        var targetMetadata = weakMetadata.get(target);
        if (targetMetadata) {
            var keyMetadata = targetMetadata.get(targetKeyOrIndex);
            if (keyMetadata) {
                return keyMetadata.has(metadataKey);
            }
        }
        return false;
    }
    function getMetadataCore(metadataKey, target, targetKeyOrIndex) {
        while (target) {
            if (hasOwnMetadataCore(metadataKey, target, targetKeyOrIndex)) {
                return getOwnMetadataCore(metadataKey, target, targetKeyOrIndex);
            }
            target = getPrototypeOfCore(target);
        }
        return undefined;
    }
    function getOwnMetadataCore(metadataKey, target, targetKeyOrIndex) {
        var targetMetadata = weakMetadata.get(target);
        if (targetMetadata) {
            var keyMetadata = targetMetadata.get(targetKeyOrIndex);
            if (keyMetadata) {
                return keyMetadata.get(metadataKey);
            }
        }
        return undefined;
    }
    function getMetadataKeysCore(target, targetKeyOrIndex) {
        var keySet = new Set();
        var keys = [];
        while (target) {
            for (var _i = 0, _a = getOwnMetadataKeysCore(target, targetKeyOrIndex); _i < _a.length; _i++) {
                var key = _a[_i];
                if (!keySet.has(key)) {
                    keySet.add(key);
                    keys.push(key);
                }
            }
            target = getPrototypeOfCore(target);
        }
        return keys;
    }
    function getOwnMetadataKeysCore(target, targetKeyOrIndex) {
        var result = [];
        var targetMetadata = weakMetadata.get(target);
        if (targetMetadata) {
            var keyMetadata = targetMetadata.get(targetKeyOrIndex);
            if (keyMetadata) {
                keyMetadata.forEach(function (_, key) {
                    return result.push(key);
                });
            }
        }
        return result;
    }
    function deleteMetadataCore(metadataKey, target, targetKeyOrIndex) {
        var targetMetadata = weakMetadata.get(target);
        if (targetMetadata) {
            var keyMetadata = targetMetadata.get(targetKeyOrIndex);
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
    function mergeMetadataCore(target, source) {
        if (source === target) {
            return target;
        }
        var sourceMetadata = weakMetadata.get(source);
        if (!sourceMetadata) {
            return target;
        }
        var targetMetadata = weakMetadata.get(target);
        if (!targetMetadata) {
            targetMetadata = new Map();
            weakMetadata.set(target, targetMetadata);
        }
        sourceMetadata.forEach(function (sourceKeyMetadata, key) {
            var targetKeyMetadata = targetMetadata.get(key);
            if (!targetKeyMetadata) {
                targetKeyMetadata = new Map();
                targetMetadata.set(key, targetKeyMetadata);
            }
            sourceKeyMetadata.forEach(function (metadataValue, metadataKey) {
                if (!targetKeyMetadata.has(metadataKey)) {
                    targetKeyMetadata.set(metadataKey, metadataValue);
                }
            });
        });
        return target;
    }
    function toTargetKeyOrIndex(value) {
        if (!isMissing(value) && !isPropertyKey(value) && !isNumber(value)) {
            return String(value);
        }
        return value;
    }
})(Reflect || (Reflect = {}));
//# sourceMappingURL=Reflect.js.map
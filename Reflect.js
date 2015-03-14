"use strict";
var Reflect;
(function (Reflect) {
    var weakMetadata = new WeakMap();
    var isMissing = function (x) {
        return x == null;
    };
    var isFunction = function (x) {
        return typeof x === "function";
    };
    var isArray = Array.isArray;
    var isObject = function (x) {
        return !isMissing(x) && (typeof x === "object" || isFunction(x));
    };
    var isNumber = function (x) {
        return typeof x === "number";
    };
    var isPropertyKey = function (x) {
        return typeof x === "string" || typeof x === "symbol";
    };
    function decorateConstructor(decorators, target) {
        for (var i = decorators.length - 1; i >= 0; --i) {
            var decorator = decorators[i];
            var decorated = decorator(target);
            if (decorated != null) {
                target = Reflect.mergeMetadata(decorated, target);
            }
        }
        return target;
    }
    function decorateProperty(decorators, target, propertyKey) {
        var descriptor = Reflect.getOwnPropertyDescriptor(target, propertyKey), enumerable, configurable, writable, value, _get, _set;
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
            Reflect.defineProperty(target, propertyKey, descriptor);
        }
    }
    function decorateParameter(decorators, target, paramIndex) {
        for (var i = decorators.length - 1; i >= 0; --i) {
            var decorator = decorators[i];
            decorator(target, paramIndex);
        }
    }
    function decorate(decorators, target, targetKey) {
        if (!isArray(decorators))
            throw new TypeError();
        if (!isObject(target))
            throw new TypeError();
        if (isNumber(targetKey)) {
            return decorateParameter(decorators, target, targetKey);
        }
        else if (isPropertyKey(targetKey)) {
            return decorateProperty(decorators, target, targetKey);
        }
        else if (isMissing(targetKey)) {
            return decorateConstructor(decorators, target);
        }
        else {
            throw new TypeError();
        }
    }
    Reflect.decorate = decorate;
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
    function metadata(metadataKey, metadataValue) {
        function decorator(target, targetKey) {
            Reflect.defineMetadata(metadataKey, metadataValue, target, targetKey);
        }
        return decorator;
    }
    Reflect.metadata = metadata;
    function defineMetadata(metadataKey, metadataValue, target, targetKey) {
        if (!isObject(target))
            throw new TypeError();
        if (!isMissing(targetKey) && !isPropertyKey(targetKey) && !isNumber(targetKey))
            throw new TypeError();
        var targetMetadata = weakMetadata.get(target);
        if (!targetMetadata) {
            targetMetadata = new Map();
            weakMetadata.set(target, targetMetadata);
        }
        var keyMetadata = targetMetadata.get(targetKey);
        if (!keyMetadata) {
            keyMetadata = new Map();
            targetMetadata.set(targetKey, keyMetadata);
        }
        keyMetadata.set(metadataKey, metadata);
    }
    Reflect.defineMetadata = defineMetadata;
    function hasMetadata(metadataKey, target, targetKey) {
        if (!isObject(target))
            throw new TypeError();
        if (!isMissing(targetKey) && !isPropertyKey(targetKey) && !isNumber(targetKey))
            throw new TypeError();
        while (target) {
            if (Reflect.hasOwnMetadata(metadataKey, target, targetKey)) {
                return true;
            }
            target = Reflect.getPrototypeOf(target);
        }
        return false;
    }
    Reflect.hasMetadata = hasMetadata;
    function hasOwnMetadata(metadataKey, target, targetKey) {
        if (!isObject(target))
            throw new TypeError();
        if (!isMissing(targetKey) && !isPropertyKey(targetKey) && !isNumber(targetKey))
            throw new TypeError();
        var targetMetadata = weakMetadata.get(target);
        if (targetMetadata) {
            var keyMetadata = targetMetadata.get(targetKey);
            if (keyMetadata) {
                return keyMetadata.has(metadataKey);
            }
        }
        return false;
    }
    Reflect.hasOwnMetadata = hasOwnMetadata;
    function getMetadata(metadataKey, target, targetKey) {
        if (!isObject(target))
            throw new TypeError();
        if (!isMissing(targetKey) && !isPropertyKey(targetKey) && !isNumber(targetKey))
            throw new TypeError();
        while (target) {
            if (Reflect.hasOwnMetadata(metadataKey, target, targetKey)) {
                return Reflect.getOwnMetadata(metadataKey, target, targetKey);
            }
            target = Reflect.getPrototypeOf(target);
        }
        return undefined;
    }
    Reflect.getMetadata = getMetadata;
    function getOwnMetadata(metadataKey, target, targetKey) {
        if (!isObject(target))
            throw new TypeError();
        if (!isMissing(targetKey) && !isPropertyKey(targetKey) && !isNumber(targetKey))
            throw new TypeError();
        var targetMetadata = weakMetadata.get(target);
        if (targetMetadata) {
            var keyMetadata = targetMetadata.get(targetKey);
            if (keyMetadata) {
                return keyMetadata.get(metadataKey);
            }
        }
        return undefined;
    }
    Reflect.getOwnMetadata = getOwnMetadata;
    function getMetadataKeys(target, targetKey) {
        if (!isObject(target))
            throw new TypeError();
        if (!isMissing(targetKey) && !isPropertyKey(targetKey) && !isNumber(targetKey))
            throw new TypeError();
        var keySet = new Set();
        var keys = [];
        while (target) {
            for (var _i = 0, _a = Reflect.getOwnMetadataKeys(target, targetKey); _i < _a.length; _i++) {
                var key = _a[_i];
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
    function getOwnMetadataKeys(target, targetKey) {
        if (!isObject(target))
            throw new TypeError();
        if (!isMissing(targetKey) && !isPropertyKey(targetKey) && !isNumber(targetKey))
            throw new TypeError();
        var result = [];
        var targetMetadata = weakMetadata.get(target);
        if (targetMetadata) {
            var keyMetadata = targetMetadata.get(targetKey);
            if (keyMetadata) {
                keyMetadata.forEach(function (_, key) {
                    return result.push(key);
                });
            }
        }
        return result;
    }
    Reflect.getOwnMetadataKeys = getOwnMetadataKeys;
    function deleteMetadata(metadataKey, target, targetKey) {
        if (!isObject(target))
            throw new TypeError();
        if (!isMissing(targetKey) && !isPropertyKey(targetKey) && !isNumber(targetKey))
            throw new TypeError();
        var targetMetadata = weakMetadata.get(target);
        if (targetMetadata) {
            var keyMetadata = targetMetadata.get(targetKey);
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
    Reflect.deleteMetadata = deleteMetadata;
    /**
      * Merges unique metadata from a source Object into a target Object, returning the target.
      * @param target The target object.
      * @param source The source object.
      * @returns The target object.
      */
    function mergeMetadata(target, source) {
        if (!isObject(target))
            throw new TypeError();
        if (!isObject(source))
            throw new TypeError();
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
    Reflect.mergeMetadata = mergeMetadata;
})(Reflect || (Reflect = {}));
//# sourceMappingURL=Reflect.js.map
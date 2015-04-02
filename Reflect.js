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
var Reflect;
(function (Reflect) {
    var _Map = typeof Map === "function" ? Map : CreateMapPolyfill();
    var _Set = typeof Set === "function" ? Set : CreateSetPolyfill();
    var _WeakMap = typeof WeakMap === "function" ? WeakMap : CreateWeakMapPolyfill();
    var isMissing = function (x) { return x == null; };
    var isPropertyKey = function (x) { return typeof x === "string" || typeof x === "symbol"; };
    var isFunction = function (x) { return typeof x === "function"; };
    var isObject = function (x) { return typeof x === "object" ? x !== null : typeof x === "function"; };
    var isArray = Array.isArray;
    var getOwnPropertyDescriptorCore = Reflect.getOwnPropertyDescriptor || Object.getOwnPropertyDescriptor;
    var definePropertyCore = Reflect.defineProperty || Object.defineProperty;
    var getPrototypeOfCore = Reflect.getPrototypeOf || Object.getPrototypeOf;
    // global metadata store
    var weakMetadata = new _WeakMap();
    /**
      * Applies a set of decorators to a property of a target object.
      * @param decorators An array of decorators.
      * @param target The target object.
      * @param targetKey (Optional) The property key to decorate.
      * @param targetDescriptor (Optional) The property descriptor for the target key
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
      *     Object.defineProperty(C, "staticMethod",
      *         Reflect.decorate(decoratorsArray, C, "staticMethod",
      *             Object.getOwnPropertyDescriptor(C, "staticMethod")));
      *
      *     // method (on prototype)
      *     Object.defineProperty(C.prototype, "method",
      *         Reflect.decorate(decoratorsArray, C.prototype, "method",
      *             Object.getOwnPropertyDescriptor(C.prototype, "method")));
      *
      */
    function decorate(decorators, target, targetKey, targetDescriptor) {
        if (!isArray(decorators)) {
            throw new TypeError();
        }
        if (!isMissing(targetDescriptor)) {
            if (!isObject(targetDescriptor)) {
                throw new TypeError();
            }
            else if (!isMissing(targetKey)) {
                throw new TypeError();
            }
            else if (!isObject(target)) {
                throw new TypeError();
            }
        }
        else if (!isMissing(targetKey)) {
            if (!isObject(target)) {
                throw new TypeError();
            }
        }
        else if (!isFunction(target)) {
            throw new TypeError();
        }
        if (!isMissing(targetKey)) {
            targetKey = toPropertyKey(targetKey);
        }
        return decorateCore(decorators, target, targetKey, targetDescriptor);
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
      */
    function metadata(metadataKey, metadataValue) {
        function decorator(target, targetKey) {
            if (!isMissing(targetKey)) {
                if (!isObject(target)) {
                    throw new TypeError();
                }
                targetKey = toPropertyKey(targetKey);
            }
            else if (!isFunction(target)) {
                throw new TypeError();
            }
            return defineMetadataCore(metadataKey, metadataValue, target, targetKey);
        }
        return decorator;
    }
    Reflect.metadata = metadata;
    /**
      * Define a unique metadata entry on the target.
      * @param metadataKey A key used to store and retrieve metadata.
      * @param metadataValue A value that contains attached metadata.
      * @param target The target object on which to define metadata.
      * @param targetKey (Optional) The property key for the target.
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
      *     // decorator factory as metadata-producing annotation.
      *     function MyAnnotation(options): Decorator {
      *         return (target, key?) => Reflect.defineMetadata("custom:annotation", options, target, key);
      *     }
      *
      */
    function defineMetadata(metadataKey, metadataValue, target, targetKey) {
        if (!isObject(target)) {
            throw new TypeError();
        }
        else if (!isMissing(targetKey)) {
            targetKey = toPropertyKey(targetKey);
        }
        return defineMetadataCore(metadataKey, metadataValue, target, targetKey);
    }
    Reflect.defineMetadata = defineMetadata;
    /**
      * Gets a value indicating whether the target object or its prototype chain has the provided metadata key defined.
      * @param metadataKey A key used to store and retrieve metadata.
      * @param target The target object on which the metadata is defined.
      * @param targetKey (Optional) The property key for the target.
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
      */
    function hasMetadata(metadataKey, target, targetKey) {
        if (!isObject(target)) {
            throw new TypeError();
        }
        else if (!isMissing(targetKey)) {
            targetKey = toPropertyKey(targetKey);
        }
        return hasMetadataCore(metadataKey, target, targetKey);
    }
    Reflect.hasMetadata = hasMetadata;
    /**
      * Gets a value indicating whether the target object has the provided metadata key defined.
      * @param metadataKey A key used to store and retrieve metadata.
      * @param target The target object on which the metadata is defined.
      * @param targetKey (Optional) The property key for the target.
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
      */
    function hasOwnMetadata(metadataKey, target, targetKey) {
        if (!isObject(target)) {
            throw new TypeError();
        }
        else if (!isMissing(targetKey)) {
            targetKey = toPropertyKey(targetKey);
        }
        return hasOwnMetadataCore(metadataKey, target, targetKey);
    }
    Reflect.hasOwnMetadata = hasOwnMetadata;
    /**
      * Gets the metadata value for the provided metadata key on the target object or its prototype chain.
      * @param metadataKey A key used to store and retrieve metadata.
      * @param target The target object on which the metadata is defined.
      * @param targetKey (Optional) The property key for the target.
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
      */
    function getMetadata(metadataKey, target, targetKey) {
        if (!isObject(target)) {
            throw new TypeError();
        }
        else if (!isMissing(targetKey)) {
            targetKey = toPropertyKey(targetKey);
        }
        return getMetadataCore(metadataKey, target, targetKey);
    }
    Reflect.getMetadata = getMetadata;
    /**
      * Gets the metadata value for the provided metadata key on the target object.
      * @param metadataKey A key used to store and retrieve metadata.
      * @param target The target object on which the metadata is defined.
      * @param targetKey (Optional) The property key for the target.
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
      */
    function getOwnMetadata(metadataKey, target, targetKey) {
        if (!isObject(target)) {
            throw new TypeError();
        }
        else if (!isMissing(targetKey)) {
            targetKey = toPropertyKey(targetKey);
        }
        return getOwnMetadataCore(metadataKey, target, targetKey);
    }
    Reflect.getOwnMetadata = getOwnMetadata;
    /**
      * Gets the metadata keys defined on the target object or its prototype chain.
      * @param target The target object on which the metadata is defined.
      * @param targetKey (Optional) The property key for the target.
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
      */
    function getMetadataKeys(target, targetKey) {
        if (!isObject(target)) {
            throw new TypeError();
        }
        else if (!isMissing(targetKey)) {
            targetKey = toPropertyKey(targetKey);
        }
        return getMetadataKeysCore(target, targetKey);
    }
    Reflect.getMetadataKeys = getMetadataKeys;
    /**
      * Gets the unique metadata keys defined on the target object.
      * @param target The target object on which the metadata is defined.
      * @param targetKey (Optional) The property key for the target.
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
      */
    function getOwnMetadataKeys(target, targetKey) {
        if (!isObject(target)) {
            throw new TypeError();
        }
        else if (!isMissing(targetKey)) {
            targetKey = toPropertyKey(targetKey);
        }
        return getOwnMetadataKeysCore(target, targetKey);
    }
    Reflect.getOwnMetadataKeys = getOwnMetadataKeys;
    /**
      * Deletes the metadata entry from the target object with the provided key.
      * @param metadataKey A key used to store and retrieve metadata.
      * @param target The target object on which the metadata is defined.
      * @param targetKey (Optional) The property key for the target.
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
      */
    function deleteMetadata(metadataKey, target, targetKey) {
        if (!isObject(target)) {
            throw new TypeError();
        }
        else if (!isMissing(targetKey)) {
            targetKey = toPropertyKey(targetKey);
        }
        return deleteMetadataCore(metadataKey, target, targetKey);
    }
    Reflect.deleteMetadata = deleteMetadata;
    function decorateCore(decorators, target, targetKey, targetDescriptor) {
        if (isPropertyKey(targetKey)) {
            return decorateProperty(decorators, target, targetKey, targetDescriptor);
        }
        else {
            return decorateConstructor(decorators, target);
        }
    }
    function decorateConstructor(decorators, target) {
        for (var i = decorators.length - 1; i >= 0; --i) {
            var decorator = decorators[i];
            var decorated = decorator(target);
            if (decorated != null) {
                if (!isFunction(decorated)) {
                    throw new TypeError();
                }
                target = decorated;
            }
        }
        return target;
    }
    function decorateProperty(decorators, target, propertyKey, descriptor) {
        for (var i = decorators.length - 1; i >= 0; --i) {
            var decorator = decorators[i];
            var decorated = decorator(target, propertyKey, descriptor);
            if (descriptor != null && decorated != null) {
                if (!isObject(decorated)) {
                    throw new TypeError();
                }
                descriptor = decorated;
            }
        }
        return descriptor;
    }
    function getOrCreateMetadataMap(target, targetKey, create) {
        var targetMetadata = weakMetadata.get(target);
        if (!targetMetadata) {
            if (!create) {
                return undefined;
            }
            targetMetadata = new _Map();
            weakMetadata.set(target, targetMetadata);
        }
        var keyMetadata = targetMetadata.get(targetKey);
        if (!keyMetadata) {
            if (!create) {
                return undefined;
            }
            keyMetadata = new _Map();
            targetMetadata.set(targetKey, keyMetadata);
        }
        return keyMetadata;
    }
    function defineMetadataCore(metadataKey, metadataValue, target, targetKey) {
        var keyMetadata = getOrCreateMetadataMap(target, targetKey, true);
        keyMetadata.set(metadataKey, metadataValue);
    }
    function hasMetadataCore(metadataKey, target, targetKey) {
        while (target) {
            if (hasOwnMetadataCore(metadataKey, target, targetKey)) {
                return true;
            }
            target = getPrototypeOfCore(target);
        }
        return false;
    }
    function hasOwnMetadataCore(metadataKey, target, targetKey) {
        var keyMetadata = getOrCreateMetadataMap(target, targetKey, false);
        if (keyMetadata) {
            return keyMetadata.has(metadataKey);
        }
        return false;
    }
    function getMetadataCore(metadataKey, target, targetKey) {
        while (target) {
            if (hasOwnMetadataCore(metadataKey, target, targetKey)) {
                return getOwnMetadataCore(metadataKey, target, targetKey);
            }
            target = getPrototypeOfCore(target);
        }
        return undefined;
    }
    function getOwnMetadataCore(metadataKey, target, targetKey) {
        var keyMetadata = getOrCreateMetadataMap(target, targetKey, false);
        if (keyMetadata) {
            return keyMetadata.get(metadataKey);
        }
        return undefined;
    }
    function getMetadataKeysCore(target, targetKey) {
        var keySet = new _Set();
        var keys = [];
        while (target) {
            for (var _i = 0, _a = getOwnMetadataKeysCore(target, targetKey); _i < _a.length; _i++) {
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
    function getOwnMetadataKeysCore(target, targetKey) {
        var result = [];
        var keyMetadata = getOrCreateMetadataMap(target, targetKey, false);
        if (keyMetadata) {
            keyMetadata.forEach(function (_, key) { return result.push(key); });
        }
        return result;
    }
    function deleteMetadataCore(metadataKey, target, targetKey) {
        var keyMetadata = getOrCreateMetadataMap(target, targetKey, false);
        if (keyMetadata) {
            if (keyMetadata.delete(metadataKey)) {
                if (keyMetadata.size === 0) {
                    var targetMetadata = weakMetadata.get(target);
                    targetMetadata.delete(targetKey);
                    if (targetMetadata.size === 0) {
                        weakMetadata.delete(target);
                    }
                }
                return true;
            }
        }
        return false;
    }
    function toPropertyKey(value) {
        if (!isPropertyKey(value)) {
            return String(value);
        }
        return value;
    }
    // naive Map shim
    function CreateMapPolyfill() {
        var cacheSentinel = {};
        function Map() {
            this._keys = [];
            this._values = [];
            this._cache = cacheSentinel;
        }
        Map.prototype = {
            get size() {
                return this._keys.length;
            },
            has: function (key) {
                if (key === this._cache) {
                    return true;
                }
                if (this._find(key) >= 0) {
                    this._cache = key;
                    return true;
                }
                return false;
            },
            get: function (key) {
                var index = this._find(key);
                if (index > 0) {
                    this._cache = key;
                    return this._values[index];
                }
                return undefined;
            },
            set: function (key, value) {
                this.delete(key);
                this._keys.push(key);
                this._values.push(value);
                this._cache = key;
                return this;
            },
            delete: function (key) {
                var index = this._find(key);
                if (index) {
                    this._keys.splice(index, 1);
                    this._values.splice(index, 1);
                    this._cache = cacheSentinel;
                    return true;
                }
                return false;
            },
            clear: function () {
                this._keys.length = 0;
                this._values.length = 0;
                this._cache = cacheSentinel;
            },
            forEach: function (callback, thisArg) {
                var size = this.size;
                for (var i = 0; i < size; ++i) {
                    var key = this._keys[i];
                    var value = this._values[i];
                    this._cache = key;
                    callback.call(this, value, key, this);
                }
            },
            _find: function (key) {
                for (var i = 0; i < this._keys.length; ++i) {
                    if (this._keys[i] === key) {
                        return i;
                    }
                }
                return -1;
            }
        };
        return Map;
    }
    // naive Set shim
    function CreateSetPolyfill() {
        var cacheSentinel = {};
        function Set() {
            this._values = [];
            this._cache = cacheSentinel;
        }
        Set.prototype = {
            get size() {
                return this._values.length;
            },
            has: function (value) {
                if (value === this._cache) {
                    return true;
                }
                if (this._find(value) >= 0) {
                    this._cache = value;
                    return true;
                }
                return false;
            },
            add: function (value) {
                if (this._find(value) < 0) {
                    this._values.push(value);
                }
                this._cache = value;
                return this;
            },
            delete: function (value) {
                var index = this._find(value);
                if (index >= 0) {
                    this._values.splice(index, 1);
                    this._cache = cacheSentinel;
                    return true;
                }
                return false;
            },
            clear: function () {
                this._values.length = 0;
                this._cache = cacheSentinel;
            },
            forEach: function (callback, thisArg) {
                for (var i = 0; i < this._values.length; ++i) {
                    var value = this._values[i];
                    this._cache = value;
                    callback.call(thisArg, value, value, this);
                }
            },
            _find: function (value) {
                for (var i = 0; i < this._values.length; ++i) {
                    if (this._values[i] === value) {
                        return i;
                    }
                }
                return -1;
            }
        };
        return Set;
    }
    // naive WeakMap shim
    function CreateWeakMapPolyfill() {
        var hasOwn = Object.prototype.hasOwnProperty;
        var keys = {};
        var desc = { configurable: true, enumerable: false, writable: true };
        function WeakMap() {
            this.clear();
        }
        WeakMap.prototype = {
            has: function (target) {
                return hasOwn.call(target, this._key);
            },
            get: function (target) {
                if (hasOwn.call(target, this._key)) {
                    return target[this._key];
                }
                return undefined;
            },
            set: function (target, value) {
                if (!hasOwn.call(target, this._key)) {
                    Object.defineProperty(target, this._key, desc);
                }
                target[this._key] = value;
                return this;
            },
            delete: function (target) {
                if (hasOwn.call(target, this._key)) {
                    return delete target[this._key];
                }
                return false;
            },
            clear: function () {
                // NOTE: not a real clear, just makes the previous data unreachable
                var key;
                do
                    key = "@@WeakMap@" + Math.random().toString(16).substr(2);
                while (!hasOwn.call(keys, key));
                keys[key] = true;
                this._key = key;
            }
        };
        return WeakMap;
    }
})(Reflect || (Reflect = {}));
(function (__global) {
    if (typeof __global.Reflect !== "undefined") {
        if (__global.Reflect !== Reflect) {
            for (var p in Reflect) {
                __global.Reflect[p] = Reflect[p];
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
//# sourceMappingURL=Reflect.js.map
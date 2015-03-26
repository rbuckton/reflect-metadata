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
    // naive Map shim
    var _Map = typeof Map === "function" ? Map : (function () {
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
    })();
    // naive Set shim
    var _Set = typeof Set === "function" ? Set : (function () {
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
    })();
    // naive WeakMap shim
    var _WeakMap = typeof WeakMap === "function" ? WeakMap : (function () {
        var hasOwn = Object.prototype.hasOwnProperty;
        var keys = {};
        var desc = {
            configurable: true,
            enumerable: false,
            writable: true
        };
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
    })();
    var weakMetadata = new _WeakMap();
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
    var getOwnPropertyDescriptorCore = Reflect.getOwnPropertyDescriptor || Object.getOwnPropertyDescriptor;
    var definePropertyCore = Reflect.defineProperty || Object.defineProperty;
    var getPrototypeOfCore = Reflect.getPrototypeOf || Object.getPrototypeOf;
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
      *     Object.defineProperty(C, "staticMethod",
      *         Reflect.decorate(decoratorsArray, C, "staticMethod",
      *             Object.getOwnPropertyDescriptor(C, "staticMethod")));
      *
      *     // method (on prototype)
      *     Object.defineProperty(C.prototype, "method",
      *         Reflect.decorate(decoratorsArray, C.prototype, "method",
      *             Object.getOwnPropertyDescriptor(C.prototype, "method")));
      *
      *     // parameter (on constructor)
      *     Reflect.decorate(decoratorsArray, C, undefined, 0);
      *
      *     // parameter (on method of constructor)
      *     Reflect.decorate(decoratorsArray, C, "staticMethod", 0);
      *
      *     // parameter (on method of prototype)
      *     Reflect.decorate(decoratorsArray, C.prototype, "method", 0);
      *
      */
    function decorate(decorators, target, targetKey, targetIndexOrDescriptor) {
        if (!isArray(decorators)) {
            throw new TypeError();
        }
        else if (!isObject(target)) {
            throw new TypeError();
        }
        else if (!isMissing(targetIndexOrDescriptor) && !isNumber(targetIndexOrDescriptor) && !isObject(targetIndexOrDescriptor)) {
            throw new TypeError();
        }
        else if (isMissing(targetKey) && isMissing(targetIndexOrDescriptor) && !isFunction(target)) {
            throw new TypeError();
        }
        targetKey = toPropertyKey(targetKey);
        return decorateCore(decorators, target, targetKey, targetIndexOrDescriptor);
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
        function decorator(target, targetKey, targetIndex) {
            if (!isObject(target)) {
                throw new TypeError();
            }
            else if (!isMissing(targetIndex) && !isNumber(targetIndex)) {
                throw new TypeError();
            }
            else if (isMissing(targetKey) && isMissing(targetIndex) && !isFunction(target)) {
                throw new TypeError();
            }
            targetKey = toPropertyKey(targetKey);
            return defineMetadataCore(metadataKey, metadataValue, target, targetKey, targetIndex);
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
      * @param targetIndex (Optional) The parameter index of the target.
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
      *     Reflect.defineMetadata("custom:annotation", options, C, undefined, 0);
      *
      *     // parameter (on method of constructor)
      *     Reflect.defineMetadata("custom:annotation", options, C, "staticMethod", 0);
      *
      *     // parameter (on method of prototype)
      *     Reflect.defineMetadata("custom:annotation", options, C.prototype, "method", 0);
      *
      *     // decorator factory as metadata-producing annotation.
      *     function MyAnnotation(options): Decorator {
      *         return (target, key?, index?) => Reflect.defineMetadata("custom:annotation", options, target, key, typeof index === "number" ? index : undefined);
      *     }
      *
      */
    function defineMetadata(metadataKey, metadataValue, target, targetKey, targetIndex) {
        if (!isObject(target)) {
            throw new TypeError();
        }
        else if (!isMissing(targetIndex) && !isNumber(targetIndex)) {
            throw new TypeError();
        }
        else if (isMissing(targetIndex) && isMissing(targetKey) && !isFunction(target)) {
            throw new TypeError();
        }
        targetKey = toPropertyKey(targetKey);
        return defineMetadataCore(metadataKey, metadataValue, target, targetKey, targetIndex);
    }
    Reflect.defineMetadata = defineMetadata;
    /**
      * Gets a value indicating whether the target object or its prototype chain has the provided metadata key defined.
      * @param metadataKey A key used to store and retrieve metadata.
      * @param target The target object on which the metadata is defined.
      * @param targetKey (Optional) The property key for the target.
      * @param targetIndex (Optional) The parameter index of the target.
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
      *     result = Reflect.hasMetadata("custom:annotation", C, undefined, 0);
      *
      *     // parameter (on method of constructor)
      *     result = Reflect.hasMetadata("custom:annotation", C, "staticMethod", 0);
      *
      *     // parameter (on method of prototype)
      *     result = Reflect.hasMetadata("custom:annotation", C.prototype, "method", 0);
      *
      */
    function hasMetadata(metadataKey, target, targetKey, targetIndex) {
        if (!isObject(target)) {
            throw new TypeError();
        }
        else if (!isMissing(targetIndex) && !isNumber(targetIndex)) {
            throw new TypeError();
        }
        targetKey = toPropertyKey(targetKey);
        return hasMetadataCore(metadataKey, target, targetKey, targetIndex);
    }
    Reflect.hasMetadata = hasMetadata;
    /**
      * Gets a value indicating whether the target object has the provided metadata key defined.
      * @param metadataKey A key used to store and retrieve metadata.
      * @param target The target object on which the metadata is defined.
      * @param targetKey (Optional) The property key for the target.
      * @param targetIndex (Optional) The parameter index of the target.
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
      *     result = Reflect.hasOwnMetadata("custom:annotation", C, undefined, 0);
      *
      *     // parameter (on method of constructor)
      *     result = Reflect.hasOwnMetadata("custom:annotation", C, "staticMethod", 0);
      *
      *     // parameter (on method of prototype)
      *     result = Reflect.hasOwnMetadata("custom:annotation", C.prototype, "method", 0);
      *
      */
    function hasOwnMetadata(metadataKey, target, targetKey, targetIndex) {
        if (!isObject(target)) {
            throw new TypeError();
        }
        else if (!isMissing(targetIndex) && !isNumber(targetIndex)) {
            throw new TypeError();
        }
        targetKey = toPropertyKey(targetKey);
        return hasOwnMetadataCore(metadataKey, target, targetKey, targetIndex);
    }
    Reflect.hasOwnMetadata = hasOwnMetadata;
    /**
      * Gets the metadata value for the provided metadata key on the target object or its prototype chain.
      * @param metadataKey A key used to store and retrieve metadata.
      * @param target The target object on which the metadata is defined.
      * @param targetKey (Optional) The property key for the target.
      * @param targetIndex (Optional) The parameter index of the target.
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
      *     result = Reflect.getMetadata("custom:annotation", C, undefined, 0);
      *
      *     // parameter (on method of constructor)
      *     result = Reflect.getMetadata("custom:annotation", C, "staticMethod", 0);
      *
      *     // parameter (on method of prototype)
      *     result = Reflect.getMetadata("custom:annotation", C.prototype, "method", 0);
      *
      */
    function getMetadata(metadataKey, target, targetKey, targetIndex) {
        if (!isObject(target)) {
            throw new TypeError();
        }
        else if (!isMissing(targetIndex) && !isNumber(targetIndex)) {
            throw new TypeError();
        }
        targetKey = toPropertyKey(targetKey);
        return getMetadataCore(metadataKey, target, targetKey, targetIndex);
    }
    Reflect.getMetadata = getMetadata;
    /**
      * Gets the metadata value for the provided metadata key on the target object.
      * @param metadataKey A key used to store and retrieve metadata.
      * @param target The target object on which the metadata is defined.
      * @param targetKey (Optional) The property key for the target.
      * @param targetIndex (Optional) The parameter index of the target.
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
      *     result = Reflect.getOwnMetadata("custom:annotation", C, undefined, 0);
      *
      *     // parameter (on method of constructor)
      *     result = Reflect.getOwnMetadata("custom:annotation", C, "staticMethod", 0);
      *
      *     // parameter (on method of prototype)
      *     result = Reflect.getOwnMetadata("custom:annotation", C.prototype, "method", 0);
      *
      */
    function getOwnMetadata(metadataKey, target, targetKey, targetIndex) {
        if (!isObject(target)) {
            throw new TypeError();
        }
        else if (!isMissing(targetIndex) && !isNumber(targetIndex)) {
            throw new TypeError();
        }
        targetKey = toPropertyKey(targetKey);
        return getOwnMetadataCore(metadataKey, target, targetKey, targetIndex);
    }
    Reflect.getOwnMetadata = getOwnMetadata;
    /**
      * Gets the metadata keys defined on the target object or its prototype chain.
      * @param target The target object on which the metadata is defined.
      * @param targetKey (Optional) The property key for the target.
      * @param targetIndex (Optional) The parameter index of the target.
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
      *     result = Reflect.getMetadataKeys(C, undefined, 0);
      *
      *     // parameter (on method of constructor)
      *     result = Reflect.getMetadataKeys(C, "staticMethod", 0);
      *
      *     // parameter (on method of prototype)
      *     result = Reflect.getMetadataKeys(C.prototype, "method", 0);
      *
      */
    function getMetadataKeys(target, targetKey, targetIndex) {
        if (!isObject(target)) {
            throw new TypeError();
        }
        else if (!isMissing(targetIndex) && !isNumber(targetIndex)) {
            throw new TypeError();
        }
        targetKey = toPropertyKey(targetKey);
        return getMetadataKeysCore(target, targetKey, targetIndex);
    }
    Reflect.getMetadataKeys = getMetadataKeys;
    /**
      * Gets the unique metadata keys defined on the target object.
      * @param target The target object on which the metadata is defined.
      * @param targetKey (Optional) The property key for the target.
      * @param targetIndex (Optional) The parameter index of the target.
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
      *     result = Reflect.getOwnMetadataKeys(C, undefined, 0);
      *
      *     // parameter (on method of constructor)
      *     result = Reflect.getOwnMetadataKeys(C, "staticMethod", 0);
      *
      *     // parameter (on method of prototype)
      *     result = Reflect.getOwnMetadataKeys(C.prototype, "method", 0);
      *
      */
    function getOwnMetadataKeys(target, targetKey, targetIndex) {
        if (!isObject(target)) {
            throw new TypeError();
        }
        else if (!isMissing(targetIndex) && !isNumber(targetIndex)) {
            throw new TypeError();
        }
        targetKey = toPropertyKey(targetKey);
        return getOwnMetadataKeysCore(target, targetKey, targetIndex);
    }
    Reflect.getOwnMetadataKeys = getOwnMetadataKeys;
    /**
      * Deletes the metadata entry from the target object with the provided key.
      * @param metadataKey A key used to store and retrieve metadata.
      * @param target The target object on which the metadata is defined.
      * @param targetKey (Optional) The property key for the target.
      * @param targetIndex (Optional) The parameter index of the target.
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
      *     result = Reflect.deleteMetadata("custom:annotation", C, undefined, 0);
      *
      *     // parameter (on method of constructor)
      *     result = Reflect.deleteMetadata("custom:annotation", C, "staticMethod", 0);
      *
      *     // parameter (on method of prototype)
      *     result = Reflect.deleteMetadata("custom:annotation", C.prototype, "method", 0);
      *
      */
    function deleteMetadata(metadataKey, target, targetKey, targetIndex) {
        if (!isObject(target)) {
            throw new TypeError();
        }
        else if (!isMissing(targetIndex) && !isNumber(targetIndex)) {
            throw new TypeError();
        }
        targetKey = toPropertyKey(targetKey);
        return deleteMetadataCore(metadataKey, target, targetKey, targetIndex);
    }
    Reflect.deleteMetadata = deleteMetadata;
    function decorateCore(decorators, target, targetKey, targetIndexOrDescriptor) {
        if (isNumber(targetIndexOrDescriptor)) {
            return decorateParameter(decorators, target, targetKey, targetIndexOrDescriptor);
        }
        else if (isPropertyKey(targetKey)) {
            return decorateProperty(decorators, target, targetKey, targetIndexOrDescriptor);
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
    function decorateParameter(decorators, target, propertyKey, paramIndex) {
        for (var i = decorators.length - 1; i >= 0; --i) {
            var decorator = decorators[i];
            decorator(target, propertyKey, paramIndex);
        }
    }
    function defineMetadataCore(metadataKey, metadataValue, target, targetKey, targetIndex) {
        var targetMetadata = weakMetadata.get(target);
        if (!targetMetadata) {
            targetMetadata = new _Map();
            weakMetadata.set(target, targetMetadata);
        }
        var keyMetadata = targetMetadata.get(targetKey);
        if (!keyMetadata) {
            keyMetadata = {};
            targetMetadata.set(targetKey, keyMetadata);
        }
        var metadataMap;
        if (isMissing(targetIndex)) {
            metadataMap = keyMetadata.metadata;
            if (!metadataMap) {
                metadataMap = new Map();
                keyMetadata.metadata = metadataMap;
            }
        }
        else {
            var params = keyMetadata.params;
            if (!params) {
                params = new Map();
                keyMetadata.params = params;
            }
            metadataMap = params.get(targetIndex);
            if (!metadataMap) {
                metadataMap = new Map();
                params.set(targetIndex, metadataMap);
            }
        }
        metadataMap.set(metadataKey, metadataValue);
    }
    function hasMetadataCore(metadataKey, target, targetKey, targetIndex) {
        while (target) {
            if (hasOwnMetadataCore(metadataKey, target, targetKey, targetIndex)) {
                return true;
            }
            target = getPrototypeOfCore(target);
        }
        return false;
    }
    function hasOwnMetadataCore(metadataKey, target, targetKey, targetIndex) {
        var targetMetadata = weakMetadata.get(target);
        if (targetMetadata) {
            var keyMetadata = targetMetadata.get(targetKey);
            if (keyMetadata) {
                var metadataMap;
                if (isMissing(targetIndex)) {
                    metadataMap = keyMetadata.metadata;
                }
                else {
                    if (keyMetadata.params) {
                        metadataMap = keyMetadata.params.get(targetIndex);
                    }
                }
                if (metadataMap) {
                    return metadataMap.has(metadataKey);
                }
            }
        }
        return false;
    }
    function getMetadataCore(metadataKey, target, targetKey, targetIndex) {
        while (target) {
            if (hasOwnMetadataCore(metadataKey, target, targetKey, targetIndex)) {
                return getOwnMetadataCore(metadataKey, target, targetKey, targetIndex);
            }
            target = getPrototypeOfCore(target);
        }
        return undefined;
    }
    function getOwnMetadataCore(metadataKey, target, targetKey, targetIndex) {
        var targetMetadata = weakMetadata.get(target);
        if (targetMetadata) {
            var keyMetadata = targetMetadata.get(targetKey);
            if (keyMetadata) {
                var metadataMap;
                if (isMissing(targetIndex)) {
                    metadataMap = keyMetadata.metadata;
                }
                else {
                    if (keyMetadata.params) {
                        metadataMap = keyMetadata.params.get(targetIndex);
                    }
                }
                if (metadataMap) {
                    return metadataMap.get(metadataKey);
                }
            }
        }
        return undefined;
    }
    function getMetadataKeysCore(target, targetKey, targetIndex) {
        var keySet = new _Set();
        var keys = [];
        while (target) {
            for (var _i = 0, _a = getOwnMetadataKeysCore(target, targetKey, targetIndex); _i < _a.length; _i++) {
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
    function getOwnMetadataKeysCore(target, targetKey, targetIndex) {
        var result = [];
        var targetMetadata = weakMetadata.get(target);
        if (targetMetadata) {
            var keyMetadata = targetMetadata.get(targetKey);
            if (keyMetadata) {
                var metadataMap;
                if (isMissing(targetIndex)) {
                    metadataMap = keyMetadata.metadata;
                }
                else {
                    if (keyMetadata.params) {
                        metadataMap = keyMetadata.params.get(targetIndex);
                    }
                }
                if (metadataMap) {
                    metadataMap.forEach(function (_, key) {
                        return result.push(key);
                    });
                }
            }
        }
        return result;
    }
    function deleteMetadataCore(metadataKey, target, targetKey, targetIndex) {
        var result = false;
        var targetMetadata = weakMetadata.get(target);
        if (targetMetadata) {
            var keyMetadata = targetMetadata.get(targetKey);
            if (keyMetadata) {
                var metadataMap;
                if (isMissing(targetIndex)) {
                    metadataMap = keyMetadata.metadata;
                    if (metadataMap) {
                        result = metadataMap.delete(metadataKey);
                        if (metadataMap.size === 0) {
                            delete keyMetadata.metadata;
                        }
                    }
                }
                else {
                    var params = keyMetadata.params;
                    if (params) {
                        metadataMap = params.get(targetIndex);
                        if (metadataMap) {
                            result = metadataMap.delete(metadataKey);
                            if (metadataMap.size === 0) {
                                params.delete(targetIndex);
                            }
                        }
                        if (params.size === 0) {
                            delete keyMetadata.params;
                        }
                    }
                }
                if (!keyMetadata.metadata && !keyMetadata.params) {
                    targetMetadata.delete(targetKey);
                }
            }
            if (targetMetadata.size === 0) {
                weakMetadata.delete(target);
            }
        }
        return result;
    }
    function toPropertyKey(value) {
        if (!isPropertyKey(value)) {
            return String(value);
        }
        return value;
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
})(typeof window !== "undefined" ? window : typeof WorkerGlobalScope !== "undefined" ? self : typeof global !== "undefined" ? global : Function("return this;")());
//# sourceMappingURL=Reflect.js.map
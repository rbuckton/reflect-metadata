/// <reference path="../index.d.ts" />
/// <reference path="../globals.d.ts" />
import { assert } from "chai";
import { script } from "./vm";
import { suites } from "./suites";

for (const { name, header, context } of suites.filter(s => s.global && !s.polyfill)) {
    describe(`ReflectNoConflict + ${name}`, () => {
        describe("MetadataRegistry", () => {
            it("defines registry", () => {
                const { registry } = script(context)`
                    const ReflectNoConflict = require("../ReflectNoConflict");
                    ${header}

                    const registrySymbol = Symbol.for("@reflect-metadata:registry");
                    exports.registry = Reflect[registrySymbol];
                `;
                assert.isDefined(registry);
            });
            it("two registries", () => {
                const { provider1, provider2 } = script(context)`
                    const ReflectNoConflict = require("../ReflectNoConflict");
                    ${header}

                    const registrySymbol = Symbol.for("@reflect-metadata:registry");
                    const registry = Reflect[registrySymbol];

                    const obj1 = {};
                    ReflectNoConflict.defineMetadata("key", "value", obj1);

                    const obj2 = {};
                    Reflect.defineMetadata("key", "value", obj2);

                    const provider1 = registry.getProvider(obj1, undefined);
                    const provider2 = registry.getProvider(obj2, undefined);

                    exports.provider1 = provider1;
                    exports.provider2 = provider2;
                    exports.registry = registry;
                `;
                assert.isDefined(provider1);
                assert.isDefined(provider2);
                assert.notStrictEqual(provider1, provider2);
            });
            it("registries are shared", () => {
                const { ReflectNoConflict, Reflect } = script(context)`
                    const ReflectNoConflict = require("../ReflectNoConflict");
                    ${header}

                    exports.ReflectNoConflict = ReflectNoConflict;
                    exports.Reflect = Reflect;
                `;
                const obj = {};
                ReflectNoConflict.defineMetadata("key", "value", obj);
                assert.isTrue(Reflect.hasOwnMetadata("key", obj));
            });
        });
    });
}

for (const { name, header, context } of suites) {
    describe(`fallback + ${name}`, () => {
        it("MetadataRegistry", () => {
            const { provider1, provider2 } = script({ ESMap: Map, ...context })`
                {
                    const Map = ESMap;
                    const map = new Map();
                    Reflect.defineMetadata = function(key, value, target, prop) {
                        let props = map.get(target);
                        if (!props) map.set(target, props = new Map());
                        let meta = props.get(prop);
                        if (!meta) props.set(prop, meta = new Map());
                        meta.set(key, value);
                    };
                    Reflect.hasOwnMetadata = function(key, target, prop) {
                        let props = map.get(target);
                        let meta = props && props.get(prop);
                        return meta && meta.has(key) || false;
                    };
                    Reflect.getOwnMetadata = function(key, target, prop) {
                        let props = map.get(target);
                        let meta = props && props.get(prop);
                        return meta && meta.get(key);
                    };
                    Reflect.getOwnMetadataKeys = function(target, prop) {
                        let props = map.get(target);
                        let meta = props && props.get(prop);
                        const keys = meta && meta.keys() || [];
                        return [...keys];
                    };
                    Reflect.deleteMetadata = function(key, target, prop) {
                        let props = map.get(target);
                        let meta = props && props.get(prop);
                        return meta && meta.delete(key) || false;
                    };
                }

                const obj = {};
                Reflect.defineMetadata("a", 1, obj);
                Reflect.defineMetadata("b", 2, obj, "c");

                {
                    ${header}
                }

                const registrySymbol = Symbol.for("@reflect-metadata:registry");
                const registry = Reflect[registrySymbol];
                const provider1 = registry.getProvider(obj, undefined);
                const provider2 = registry.getProvider(obj, "c");

                exports.provider1 = provider1;
                exports.provider2 = provider2;
            `;
            assert.isDefined(provider1);
            assert.isDefined(provider2);
            assert.strictEqual(provider1, provider2);
        });
    });
}
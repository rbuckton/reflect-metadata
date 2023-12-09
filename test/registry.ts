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
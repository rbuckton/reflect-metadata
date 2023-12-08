/// <reference path="../../index.d.ts" />
/// <reference path="../../globals.d.ts" />
const ReflectNoConflict = require("../../ReflectNoConflict");
require("../../Reflect");
import { assert } from "chai";

describe("MetadataRegistry", () => {
    it("defines registry", () => {
        const registrySymbol = Symbol.for("@reflect-metadata:registry");
        const registry = (Reflect as any)[registrySymbol] as MetadataRegistry;
        assert.isDefined(registry);
    });
    it("two registries", () => {
        const registrySymbol = Symbol.for("@reflect-metadata:registry");
        const registry = (Reflect as any)[registrySymbol] as MetadataRegistry;
        const obj1 = {};
        ReflectNoConflict.defineMetadata("key", "value", obj1);
        const obj2 = {};
        Reflect.defineMetadata("key", "value", obj2);
        const provider1 = registry.getProvider(obj1, undefined);
        const provider2 = registry.getProvider(obj2, undefined);
        assert.isDefined(provider1);
        assert.isDefined(provider2);
        assert.notStrictEqual(provider1, provider2);
    });
    it("registries are shared", () => {
        const obj = {};
        ReflectNoConflict.defineMetadata("key", "value", obj);
        assert.isTrue(Reflect.hasOwnMetadata("key", obj));
    });
});

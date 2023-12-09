// 4.1.9 Reflect.getOwnMetadataKeysKeys ( target [, propertyKey] )
// https://rbuckton.github.io/reflect-metadata/#reflect.getownmetadatakeys

/// <reference path="../index.d.ts" />
import { assert } from "chai";
import { script } from "./vm";
import { suites } from "./suites";

for (const { name, header, context } of suites) {
    describe(name, () => {
        describe("Reflect.getOwnMetadataKeys", () => {
            it("KeysKeysInvalidTarget", () => {
                const { Reflect, TypeError } = script(context)`
                    ${header}
                    exports.Reflect = Reflect;
                    exports.TypeError = TypeError;
                `;
                // 1. If Type(target) is not Object, throw a TypeError exception.
                assert.throws(() => Reflect.getOwnMetadataKeys(undefined, undefined!), TypeError);
            });

            it("KeysWithoutTargetKeyWhenNotDefined", () => {
                const { Reflect } = script(context)`
                    ${header}
                    exports.Reflect = Reflect;
                `;
                let obj = {};
                let result = Reflect.getOwnMetadataKeys(obj, undefined!);
                assert.deepEqual(result, []);
            });

            it("KeysWithoutTargetKeyWhenDefined", () => {
                const { Reflect } = script(context)`
                    ${header}
                    exports.Reflect = Reflect;
                `;
                let obj = {};
                Reflect.defineMetadata("key", "value", obj, undefined!);
                let result = Reflect.getOwnMetadataKeys(obj, undefined!);
                assert.deepEqual(result, ["key"]);
            });

            it("KeysWithoutTargetKeyWhenDefinedOnPrototype", () => {
                const { Reflect } = script(context)`
                    ${header}
                    exports.Reflect = Reflect;
                `;
                let prototype = {};
                let obj = Object.create(prototype);
                Reflect.defineMetadata("key", "value", prototype, undefined!);
                let result = Reflect.getOwnMetadataKeys(obj, undefined!);
                assert.deepEqual(result, []);
            });

            it("KeysOrderWithoutTargetKey", () => {
                const { Reflect } = script(context)`
                    ${header}
                    exports.Reflect = Reflect;
                `;
                let obj = {};
                Reflect.defineMetadata("key1", "value", obj, undefined!);
                Reflect.defineMetadata("key0", "value", obj, undefined!);
                let result = Reflect.getOwnMetadataKeys(obj, undefined!);
                assert.deepEqual(result, ["key1", "key0"]);
            });

            it("KeysOrderAfterRedefineWithoutTargetKey", () => {
                const { Reflect } = script(context)`
                    ${header}
                    exports.Reflect = Reflect;
                `;
                let obj = {};
                Reflect.defineMetadata("key1", "value", obj, undefined!);
                Reflect.defineMetadata("key0", "value", obj, undefined!);
                Reflect.defineMetadata("key1", "value", obj, undefined!);
                let result = Reflect.getOwnMetadataKeys(obj, undefined!);
                assert.deepEqual(result, ["key1", "key0"]);
            });

            it("KeysWithTargetKeyWhenNotDefined", () => {
                const { Reflect } = script(context)`
                    ${header}
                    exports.Reflect = Reflect;
                `;
                let obj = {};
                let result = Reflect.getOwnMetadataKeys(obj, "name");
                assert.deepEqual(result, []);
            });

            it("KeysWithTargetKeyWhenDefined", () => {
                const { Reflect } = script(context)`
                    ${header}
                    exports.Reflect = Reflect;
                `;
                let obj = {};
                Reflect.defineMetadata("key", "value", obj, "name");
                let result = Reflect.getOwnMetadataKeys(obj, "name");
                assert.deepEqual(result, ["key"]);
            });

            it("KeysWithTargetKeyWhenDefinedOnPrototype", () => {
                const { Reflect } = script(context)`
                    ${header}
                    exports.Reflect = Reflect;
                `;
                let prototype = {};
                let obj = Object.create(prototype);
                Reflect.defineMetadata("key", "value", prototype, "name");
                let result = Reflect.getOwnMetadataKeys(obj, "name");
                assert.deepEqual(result, []);
            });

            it("KeysOrderAfterRedefineWithTargetKey", () => {
                const { Reflect } = script(context)`
                    ${header}
                    exports.Reflect = Reflect;
                `;
                let obj = {};
                Reflect.defineMetadata("key1", "value", obj, "name");
                Reflect.defineMetadata("key0", "value", obj, "name");
                Reflect.defineMetadata("key1", "value", obj, "name");
                let result = Reflect.getOwnMetadataKeys(obj, "name");
                assert.deepEqual(result, ["key1", "key0"]);
            });
        });
    });
}
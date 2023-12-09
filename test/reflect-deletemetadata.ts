// 4.1.10 Reflect.deleteMetadata ( metadataKey, target [, propertyKey] )
// https://rbuckton.github.io/reflect-metadata/#reflect.deletemetadata

/// <reference path="../index.d.ts" />
import { assert } from "chai";
import { script } from "./vm";
import { suites } from "./suites";

for (const { name, header, context } of suites) {
    describe(name, () => {
        describe("Reflect.deleteMetadata", () => {
            it("InvalidTarget", () => {
                const { Reflect, TypeError } = script(context)`
                    ${header}
                    exports.Reflect = Reflect;
                    exports.TypeError = TypeError;
                `;
                assert.throws(() => Reflect.deleteMetadata("key", undefined, undefined!), TypeError);
            });

            it("WhenNotDefinedWithoutTargetKey", () => {
                const { Reflect } = script(context)`
                    ${header}
                    exports.Reflect = Reflect;
                `;
                let obj = {};
                let result = Reflect.deleteMetadata("key", obj, undefined!);
                assert.equal(result, false);
            });

            it("WhenDefinedWithoutTargetKey", () => {
                const { Reflect } = script(context)`
                    ${header}
                    exports.Reflect = Reflect;
                `;
                let obj = {};
                Reflect.defineMetadata("key", "value", obj, undefined!);
                let result = Reflect.deleteMetadata("key", obj, undefined!);
                assert.equal(result, true);
            });

            it("WhenDefinedOnPrototypeWithoutTargetKey", () => {
                const { Reflect } = script(context)`
                    ${header}
                    exports.Reflect = Reflect;
                `;
                let prototype = {};
                Reflect.defineMetadata("key", "value", prototype, undefined!);
                let obj = Object.create(prototype);
                let result = Reflect.deleteMetadata("key", obj, undefined!);
                assert.equal(result, false);
            });

            it("AfterDeleteMetadata", () => {
                const { Reflect } = script(context)`
                    ${header}
                    exports.Reflect = Reflect;
                `;
                let obj = {};
                Reflect.defineMetadata("key", "value", obj, undefined!);
                Reflect.deleteMetadata("key", obj, undefined!);
                let result = Reflect.hasOwnMetadata("key", obj, undefined!);
                assert.equal(result, false);
            });
        });
    });
}
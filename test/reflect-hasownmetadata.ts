// 4.1.5 Reflect.hasOwnMetadata ( metadataKey, target [, propertyKey] )
// https://rbuckton.github.io/reflect-metadata/#reflect.hasownmetadata

/// <reference path="../index.d.ts" />
import { assert } from "chai";
import { script } from "./vm";
import { suites } from "./suites";

for (const { name, header, context } of suites) {
    describe(name, () => {
        describe("Reflect.hasOwnMetadata", () => {
            it("InvalidTarget", () => {
                const { Reflect, TypeError } = script(context)`
                    ${header}
                    exports.Reflect = Reflect;
                    exports.TypeError = TypeError;
                `;
                assert.throws(() => Reflect.hasOwnMetadata("key", undefined, undefined!), TypeError);
            });

            it("WithoutTargetKeyWhenNotDefined", () => {
                const { Reflect } = script(context)`
                    ${header}
                    exports.Reflect = Reflect;
                `;
                let obj = {};
                let result = Reflect.hasOwnMetadata("key", obj, undefined!);
                assert.equal(result, false);
            });

            it("WithoutTargetKeyWhenDefined", () => {
                const { Reflect } = script(context)`
                    ${header}
                    exports.Reflect = Reflect;
                `;
                let obj = {};
                Reflect.defineMetadata("key", "value", obj, undefined!);
                let result = Reflect.hasOwnMetadata("key", obj, undefined!);
                assert.equal(result, true);
            });

            it("WithoutTargetKeyWhenDefinedOnPrototype", () => {
                const { Reflect } = script(context)`
                    ${header}
                    exports.Reflect = Reflect;
                `;
                let prototype = {};
                let obj = Object.create(prototype);
                Reflect.defineMetadata("key", "value", prototype, undefined!);
                let result = Reflect.hasOwnMetadata("key", obj, undefined!);
                assert.equal(result, false);
            });

            it("WithTargetKeyWhenNotDefined", () => {
                const { Reflect } = script(context)`
                    ${header}
                    exports.Reflect = Reflect;
                `;
                let obj = {};
                let result = Reflect.hasOwnMetadata("key", obj, "name");
                assert.equal(result, false);
            });

            it("WithTargetKeyWhenDefined", () => {
                const { Reflect } = script(context)`
                    ${header}
                    exports.Reflect = Reflect;
                `;
                let obj = {};
                Reflect.defineMetadata("key", "value", obj, "name");
                let result = Reflect.hasOwnMetadata("key", obj, "name");
                assert.equal(result, true);
            });

            it("WithTargetKeyWhenDefinedOnPrototype", () => {
                const { Reflect } = script(context)`
                    ${header}
                    exports.Reflect = Reflect;
                `;
                let prototype = {};
                let obj = Object.create(prototype);
                Reflect.defineMetadata("key", "value", prototype, "name");
                let result = Reflect.hasOwnMetadata("key", obj, "name");
                assert.equal(result, false);
            });
        });
    });
}
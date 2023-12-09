// 4.1.7 Reflect.getOwnMetadata ( metadataKey, target [, propertyKey] )
// https://rbuckton.github.io/reflect-metadata/#reflect.getownmetadata

/// <reference path="../index.d.ts" />
import { assert } from "chai";
import { script } from "./vm";
import { suites } from "./suites";

for (const { name, header, context } of suites) {
    describe(name, () => {
        describe("Reflect.getOwnMetadata", () => {
            it("InvalidTarget", () => {
                const { Reflect, TypeError } = script(context)`
                    ${header}
                    exports.Reflect = Reflect;
                    exports.TypeError = TypeError;
                `;
                assert.throws(() => Reflect.getOwnMetadata("key", undefined, undefined!), TypeError);
            });

            it("WithoutTargetKeyWhenNotDefined", () => {0
                const { Reflect } = script(context)`
                    ${header}
                    exports.Reflect = Reflect;
                `;
                let obj = {};
                let result = Reflect.getOwnMetadata("key", obj, undefined!);
                assert.equal(result, undefined);
            });

            it("WithoutTargetKeyWhenDefined", () => {
                const { Reflect } = script(context)`
                    ${header}
                    exports.Reflect = Reflect;
                `;
                let obj = {};
                Reflect.defineMetadata("key", "value", obj, undefined!);
                let result = Reflect.getOwnMetadata("key", obj, undefined!);
                assert.equal(result, "value");
            });

            it("WithoutTargetKeyWhenDefinedOnPrototype", () => {
                const { Reflect } = script(context)`
                    ${header}
                    exports.Reflect = Reflect;
                `;
                let prototype = {};
                let obj = Object.create(prototype);
                Reflect.defineMetadata("key", "value", prototype, undefined!);
                let result = Reflect.getOwnMetadata("key", obj, undefined!);
                assert.equal(result, undefined);
            });

            it("WithTargetKeyWhenNotDefined", () => {
                const { Reflect } = script(context)`
                    ${header}
                    exports.Reflect = Reflect;
                `;
                let obj = {};
                let result = Reflect.getOwnMetadata("key", obj, "name");
                assert.equal(result, undefined);
            });

            it("WithTargetKeyWhenDefined", () => {
                const { Reflect } = script(context)`
                    ${header}
                    exports.Reflect = Reflect;
                `;
                let obj = {};
                Reflect.defineMetadata("key", "value", obj, "name");
                let result = Reflect.getOwnMetadata("key", obj, "name");
                assert.equal(result, "value");
            });

            it("WithTargetKeyWhenDefinedOnPrototype", () => {
                const { Reflect } = script(context)`
                    ${header}
                    exports.Reflect = Reflect;
                `;
                let prototype = {};
                let obj = Object.create(prototype);
                Reflect.defineMetadata("key", "value", prototype, "name");
                let result = Reflect.getOwnMetadata("key", obj, "name");
                assert.equal(result, undefined);
            });
        });
    });
}
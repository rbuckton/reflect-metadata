// 4.1.5 Reflect.getMetadata ( metadataKey, target [, propertyKey] )
// https://rbuckton.github.io/reflect-metadata/#reflect.getmetadata

/// <reference path="../index.d.ts" />
import { assert } from "chai";
import { script } from "./vm";
import { suites } from "./suites";

for (const { name, header, context } of suites) {
    describe(name, () => {
        describe("Reflect.getMetadata", () => {
            it("InvalidTarget", () => {
                const { Reflect, TypeError } = script(context)`
                    ${header}
                    exports.Reflect = Reflect;
                    exports.TypeError = TypeError;
                `;
                assert.throws(() => Reflect.getMetadata("key", undefined, undefined!), TypeError);
            });

            it("WithoutTargetKeyWhenNotDefined", () => {
                const { Reflect } = script(context)`
                    ${header}
                    exports.Reflect = Reflect;
                `;
                let obj = {};
                let result = Reflect.getMetadata("key", obj, undefined!);
                assert.equal(result, undefined);
            });

            it("WithoutTargetKeyWhenDefined", () => {
                const { Reflect } = script(context)`
                    ${header}
                    exports.Reflect = Reflect;
                `;
                let obj = {};
                Reflect.defineMetadata("key", "value", obj, undefined!);
                let result = Reflect.getMetadata("key", obj, undefined!);
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
                let result = Reflect.getMetadata("key", obj, undefined!);
                assert.equal(result, "value");
            });

            it("WithTargetKeyWhenNotDefined", () => {
                const { Reflect } = script(context)`
                    ${header}
                    exports.Reflect = Reflect;
                `;
                let obj = {};
                let result = Reflect.getMetadata("key", obj, "name");
                assert.equal(result, undefined);
            });

            it("WithTargetKeyWhenDefined", () => {
                const { Reflect } = script(context)`
                    ${header}
                    exports.Reflect = Reflect;
                `;
                let obj = {};
                Reflect.defineMetadata("key", "value", obj, "name");
                let result = Reflect.getMetadata("key", obj, "name");
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
                let result = Reflect.getMetadata("key", obj, "name");
                assert.equal(result, "value");
            });
        });
    });
}
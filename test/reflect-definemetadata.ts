// 4.1.2 Reflect.defineMetadata ( metadataKey, metadataValue, target, propertyKey )
// https://rbuckton.github.io/reflect-metadata/#reflect.definemetadata

/// <reference path="../index.d.ts" />
import { assert } from "chai";
import { script } from "./vm";
import { suites } from "./suites";

for (const { name, header, context } of suites) {
    describe(name, () => {
        describe("Reflect.defineMetadata", () => {
            it("InvalidTarget", () => {
                const { Reflect, TypeError } = script(context)`
                    ${header}
                    exports.Reflect = Reflect;
                    exports.TypeError = TypeError;
                `;
                assert.throws(() => Reflect.defineMetadata("key", "value", undefined, undefined!), TypeError);
            });

            it("ValidTargetWithoutTargetKey", () => {
                const { Reflect } = script(context)`
                    ${header}
                    exports.Reflect = Reflect;
                `;
                assert.doesNotThrow(() => Reflect.defineMetadata("key", "value", { }, undefined!));
            });

            it("ValidTargetWithTargetKey", () => {
                const { Reflect } = script(context)`
                    ${header}
                    exports.Reflect = Reflect;
                `;
                assert.doesNotThrow(() => Reflect.defineMetadata("key", "value", { }, "name"));
            });
        });
    });
}
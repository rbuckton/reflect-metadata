// 4.1.2 Reflect.metadata ( metadataKey, metadataValue )
// https://rbuckton.github.io/reflect-metadata/#reflect.metadata

/// <reference path="../index.d.ts" />
import { assert } from "chai";
import { script } from "./vm";
import { suites } from "./suites";

for (const { name, header, context } of suites) {
    describe(name, () => {
        describe("Reflect.metadata", () => {
            it("ReturnsDecoratorFunction", () => {
                const { Reflect } = script(context)`
                    ${header}
                    exports.Reflect = Reflect;
                `;
                let result = Reflect.metadata("key", "value");
                assert.equal(typeof result, "function");
            });

            it("DecoratorThrowsWithInvalidTargetWithTargetKey", () => {
                const { Reflect, TypeError } = script(context)`
                    ${header}
                    exports.Reflect = Reflect;
                    exports.TypeError = TypeError;
                `;
                let decorator = Reflect.metadata("key", "value");
                assert.throws(() => decorator(undefined!, "name"), TypeError);
            });

            it("DecoratorThrowsWithInvalidTargetKey", () => {
                const { Reflect, TypeError } = script(context)`
                    ${header}
                    exports.Reflect = Reflect;
                    exports.TypeError = TypeError;
                `;
                let decorator = Reflect.metadata("key", "value");
                assert.throws(() => decorator({}, <any>{}), TypeError);
            });

            it("OnTargetWithoutTargetKey", () => {
                const { Reflect } = script(context)`
                    ${header}
                    exports.Reflect = Reflect;
                `;
                let decorator = Reflect.metadata("key", "value");
                let target = function () {}
                decorator(target);

                let result = Reflect.hasOwnMetadata("key", target, undefined!);
                assert.equal(result, true);
            });

            it("OnTargetWithTargetKey", () => {
                const { Reflect } = script(context)`
                    ${header}
                    exports.Reflect = Reflect;
                `;
                let decorator = Reflect.metadata("key", "value");
                let target = {}
                decorator(target, "name");

                let result = Reflect.hasOwnMetadata("key", target, "name");
                assert.equal(result, true);
            });
        });
    });
}
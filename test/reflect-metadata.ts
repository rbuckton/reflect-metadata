// 4.1.2 Reflect.metadata ( metadataKey, metadataValue )
// https://rbuckton.github.io/reflect-metadata/#reflect.metadata

import { assert } from "chai";
import type { ReflectApiType } from "./api";

export default function (Reflect: ReflectApiType) {
    describe("Reflect.metadata", () => {
        it("ReturnsDecoratorFunction", () => {
            let result = Reflect.metadata("key", "value");
            assert.equal(typeof result, "function");
        });

        it("DecoratorThrowsWithInvalidTargetWithTargetKey", () => {
            let decorator = Reflect.metadata("key", "value");
            assert.throws(() => decorator(undefined, "name"), TypeError);
        });

        it("DecoratorThrowsWithInvalidTargetKey", () => {
            let decorator = Reflect.metadata("key", "value");
            assert.throws(() => decorator({}, <any>{}), TypeError);
        });

        it("OnTargetWithoutTargetKey", () => {
            let decorator = Reflect.metadata("key", "value");
            let target = function () {}
            decorator(target);

            let result = Reflect.hasOwnMetadata("key", target, undefined);
            assert.equal(result, true);
        });

        it("OnTargetWithTargetKey", () => {
            let decorator = Reflect.metadata("key", "value");
            let target = {}
            decorator(target, "name");

            let result = Reflect.hasOwnMetadata("key", target, "name");
            assert.equal(result, true);
        });
    });
}
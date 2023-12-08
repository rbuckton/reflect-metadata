// 4.1.2 Reflect.metadata ( metadataKey, metadataValue )
// https://rbuckton.github.io/reflect-metadata/#reflect.metadata

/// <reference path="../../index.d.ts" />
const Reflect_ = require("../../ReflectNoConflict") as typeof Reflect;
import { assert } from "chai";

describe("Reflect.metadata", () => {
    it("ReturnsDecoratorFunction", () => {
        let result = Reflect_.metadata("key", "value");
        assert.equal(typeof result, "function");
    });

    it("DecoratorThrowsWithInvalidTargetWithTargetKey", () => {
        let decorator = Reflect_.metadata("key", "value");
        assert.throws(() => decorator(undefined, "name"), TypeError);
    });

    it("DecoratorThrowsWithInvalidTargetKey", () => {
        let decorator = Reflect_.metadata("key", "value");
        assert.throws(() => decorator({}, <any>{}), TypeError);
    });

    it("OnTargetWithoutTargetKey", () => {
        let decorator = Reflect_.metadata("key", "value");
        let target = function () {}
        decorator(target);

        let result = Reflect_.hasOwnMetadata("key", target, undefined!);
        assert.equal(result, true);
    });

    it("OnTargetWithTargetKey", () => {
        let decorator = Reflect_.metadata("key", "value");
        let target = {}
        decorator(target, "name");

        let result = Reflect_.hasOwnMetadata("key", target, "name");
        assert.equal(result, true);
    });
});
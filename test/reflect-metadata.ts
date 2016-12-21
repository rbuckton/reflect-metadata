// Reflect.metadata ( metadataKey, metadataValue )
// - https://github.com/jonathandturner/decorators/blob/master/specs/metadata.md#reflectmetadata--metadatakey-metadatavalue-

import "../Reflect";
import { assert } from "chai";

describe("Reflect.metadata", () => {
    it("ReturnsDecoratorFunction", () => {
        let result = Reflect.metadata("key", "value");
        assert.equal(typeof result, "function");
    });

    it("DecoratorThrowsWithInvalidTargetWithTargetKey", () => {
        let decorator = Reflect.metadata("key", "value");
        assert.throws(() => decorator(undefined, "name"), TypeError);
    });

    it("DecoratorThrowsWithInvalidTargetWithoutTargetKey", () => {
        let decorator = Reflect.metadata("key", "value");
        assert.throws(() => decorator({}, undefined), TypeError);
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
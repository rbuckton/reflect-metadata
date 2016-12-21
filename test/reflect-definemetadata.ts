// Reflect.defineMetadata ( metadataKey, metadataValue, target, propertyKey )
// - https://github.com/jonathandturner/decorators/blob/master/specs/metadata.md#reflectdefinemetadata--metadatakey-metadatavalue-target-propertykey-

import "../Reflect";
import { assert } from "chai";

describe("Reflect.defineMetadata", () => {
    it("InvalidTarget", () => {
        assert.throws(() => Reflect.defineMetadata("key", "value", undefined, undefined), TypeError);
    });

    it("ValidTargetWithoutTargetKey", () => {
        assert.doesNotThrow(() => Reflect.defineMetadata("key", "value", { }, undefined));
    });

    it("ValidTargetWithTargetKey", () => {
        assert.doesNotThrow(() => Reflect.defineMetadata("key", "value", { }, "name"));
    });
});
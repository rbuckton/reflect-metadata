// 4.1.2 Reflect.defineMetadata ( metadataKey, metadataValue, target, propertyKey )
// https://rbuckton.github.io/reflect-metadata/#reflect.definemetadata

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
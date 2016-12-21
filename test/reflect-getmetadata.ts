// Reflect.getMetadata ( metadataKey, target [, propertyKey] )
// - https://github.com/jonathandturner/decorators/blob/master/specs/metadata.md#reflectgetmetadata--metadatakey-target--propertykey-

import "../Reflect";
import { assert } from "chai";

describe("Reflect.getMetadata", () => {
    it("InvalidTarget", () => {
        assert.throws(() => Reflect.getMetadata("key", undefined, undefined), TypeError);
    });

    it("WithoutTargetKeyWhenNotDefined", () => {
        let obj = {};
        let result = Reflect.getMetadata("key", obj, undefined);
        assert.equal(result, undefined);
    });

    it("WithoutTargetKeyWhenDefined", () => {
        let obj = {};
        Reflect.defineMetadata("key", "value", obj, undefined);
        let result = Reflect.getMetadata("key", obj, undefined);
        assert.equal(result, "value");
    });

    it("WithoutTargetKeyWhenDefinedOnPrototype", () => {
        let prototype = {};
        let obj = Object.create(prototype);
        Reflect.defineMetadata("key", "value", prototype, undefined);
        let result = Reflect.getMetadata("key", obj, undefined);
        assert.equal(result, "value");
    });

    it("WithTargetKeyWhenNotDefined", () => {
        let obj = {};
        let result = Reflect.getMetadata("key", obj, "name");
        assert.equal(result, undefined);
    });

    it("WithTargetKeyWhenDefined", () => {
        let obj = {};
        Reflect.defineMetadata("key", "value", obj, "name");
        let result = Reflect.getMetadata("key", obj, "name");
        assert.equal(result, "value");
    });

    it("WithTargetKeyWhenDefinedOnPrototype", () => {
        let prototype = {};
        let obj = Object.create(prototype);
        Reflect.defineMetadata("key", "value", prototype, "name");
        let result = Reflect.getMetadata("key", obj, "name");
        assert.equal(result, "value");
    });
});
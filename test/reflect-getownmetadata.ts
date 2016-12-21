// Reflect.getOwnMetadata ( metadataKey, target [, propertyKey] )
// - https://github.com/jonathandturner/decorators/blob/master/specs/metadata.md#reflectgetownmetadata--metadatakey-target--propertykey-

import "../Reflect";
import { assert } from "chai";

describe("Reflect.getOwnMetadata", () => {
    it("InvalidTarget", () => {
        assert.throws(() => Reflect.getOwnMetadata("key", undefined, undefined), TypeError);
    });

    it("WithoutTargetKeyWhenNotDefined", () => {
        let obj = {};
        let result = Reflect.getOwnMetadata("key", obj, undefined);
        assert.equal(result, undefined);
    });

    it("WithoutTargetKeyWhenDefined", () => {
        let obj = {};
        Reflect.defineMetadata("key", "value", obj, undefined);
        let result = Reflect.getOwnMetadata("key", obj, undefined);
        assert.equal(result, "value");
    });

    it("WithoutTargetKeyWhenDefinedOnPrototype", () => {
        let prototype = {};
        let obj = Object.create(prototype);
        Reflect.defineMetadata("key", "value", prototype, undefined);
        let result = Reflect.getOwnMetadata("key", obj, undefined);
        assert.equal(result, undefined);
    });

    it("WithTargetKeyWhenNotDefined", () => {
        let obj = {};
        let result = Reflect.getOwnMetadata("key", obj, "name");
        assert.equal(result, undefined);
    });

    it("WithTargetKeyWhenDefined", () => {
        let obj = {};
        Reflect.defineMetadata("key", "value", obj, "name");
        let result = Reflect.getOwnMetadata("key", obj, "name");
        assert.equal(result, "value");
    });

    it("WithTargetKeyWhenDefinedOnPrototype", () => {
        let prototype = {};
        let obj = Object.create(prototype);
        Reflect.defineMetadata("key", "value", prototype, "name");
        let result = Reflect.getOwnMetadata("key", obj, "name");
        assert.equal(result, undefined);
    });
});
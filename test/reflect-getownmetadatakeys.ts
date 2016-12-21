// Reflect.getOwnMetadataKeysKeys ( target [, propertyKey] )
// - https://github.com/jonathandturner/decorators/blob/master/specs/metadata.md#reflectgetownmetadatakeyskeys--target--propertykey-

import "../Reflect";
import { assert } from "chai";

describe("Reflect.deleteMetadata", () => {
    it("KeysKeysInvalidTarget", () => {
        // 1. If Type(target) is not Object, throw a TypeError exception.
        assert.throws(() => Reflect.getOwnMetadataKeys(undefined, undefined), TypeError);
    });

    it("KeysWithoutTargetKeyWhenNotDefined", () => {
        let obj = {};
        let result = Reflect.getOwnMetadataKeys(obj, undefined);
        assert.deepEqual(result, []);
    });

    it("KeysWithoutTargetKeyWhenDefined", () => {
        let obj = {};
        Reflect.defineMetadata("key", "value", obj, undefined);
        let result = Reflect.getOwnMetadataKeys(obj, undefined);
        assert.deepEqual(result, ["key"]);
    });

    it("KeysWithoutTargetKeyWhenDefinedOnPrototype", () => {
        let prototype = {};
        let obj = Object.create(prototype);
        Reflect.defineMetadata("key", "value", prototype, undefined);
        let result = Reflect.getOwnMetadataKeys(obj, undefined);
        assert.deepEqual(result, []);
    });

    it("KeysOrderWithoutTargetKey", () => {
        let obj = {};
        Reflect.defineMetadata("key1", "value", obj, undefined);
        Reflect.defineMetadata("key0", "value", obj, undefined);
        let result = Reflect.getOwnMetadataKeys(obj, undefined);
        assert.deepEqual(result, ["key1", "key0"]);
    });

    it("KeysOrderAfterRedefineWithoutTargetKey", () => {
        let obj = {};
        Reflect.defineMetadata("key1", "value", obj, undefined);
        Reflect.defineMetadata("key0", "value", obj, undefined);
        Reflect.defineMetadata("key1", "value", obj, undefined);
        let result = Reflect.getOwnMetadataKeys(obj, undefined);
        assert.deepEqual(result, ["key1", "key0"]);
    });

    it("KeysWithTargetKeyWhenNotDefined", () => {
        let obj = {};
        let result = Reflect.getOwnMetadataKeys(obj, "name");
        assert.deepEqual(result, []);
    });

    it("KeysWithTargetKeyWhenDefined", () => {
        let obj = {};
        Reflect.defineMetadata("key", "value", obj, "name");
        let result = Reflect.getOwnMetadataKeys(obj, "name");
        assert.deepEqual(result, ["key"]);
    });

    it("KeysWithTargetKeyWhenDefinedOnPrototype", () => {
        let prototype = {};
        let obj = Object.create(prototype);
        Reflect.defineMetadata("key", "value", prototype, "name");
        let result = Reflect.getOwnMetadataKeys(obj, "name");
        assert.deepEqual(result, []);
    });

    it("KeysOrderAfterRedefineWithTargetKey", () => {
        let obj = {};
        Reflect.defineMetadata("key1", "value", obj, "name");
        Reflect.defineMetadata("key0", "value", obj, "name");
        Reflect.defineMetadata("key1", "value", obj, "name");
        let result = Reflect.getOwnMetadataKeys(obj, "name");
        assert.deepEqual(result, ["key1", "key0"]);
    });
});
// 4.1.4 Reflect.hasMetadata ( metadataKey, target [, propertyKey] )
// https://rbuckton.github.io/reflect-metadata/#reflect.hasmetadata

import "../Reflect";
import { assert } from "chai";

describe("Reflect.hasMetadata", () => {
    it("InvalidTarget", () => {
        assert.throws(() => Reflect.hasMetadata("key", undefined, undefined), TypeError);
    });

    it("WithoutTargetKeyWhenNotDefined", () => {
        let obj = {};
        let result = Reflect.hasMetadata("key", obj, undefined);
        assert.equal(result, false);
    });

    it("WithoutTargetKeyWhenDefined", () => {
        let obj = {};
        Reflect.defineMetadata("key", "value", obj, undefined);
        let result = Reflect.hasMetadata("key", obj, undefined);
        assert.equal(result, true);
    });

    it("WithoutTargetKeyWhenDefinedOnPrototype", () => {
        let prototype = {};
        let obj = Object.create(prototype);
        Reflect.defineMetadata("key", "value", prototype, undefined);
        let result = Reflect.hasMetadata("key", obj, undefined);
        assert.equal(result, true);
    });

    it("WithTargetKeyWhenNotDefined", () => {
        let obj = {};
        let result = Reflect.hasMetadata("key", obj, "name");
        assert.equal(result, false);
    });

    it("WithTargetKeyWhenDefined", () => {
        let obj = {};
        Reflect.defineMetadata("key", "value", obj, "name");
        let result = Reflect.hasMetadata("key", obj, "name");
        assert.equal(result, true);
    });

    it("WithTargetKeyWhenDefinedOnPrototype", () => {
        let prototype = {};
        let obj = Object.create(prototype);
        Reflect.defineMetadata("key", "value", prototype, "name");
        let result = Reflect.hasMetadata("key", obj, "name");
        assert.equal(result, true);
    });
});
// 4.1.2 Reflect.defineMetadata ( metadataKey, metadataValue, target, propertyKey )
// https://rbuckton.github.io/reflect-metadata/#reflect.definemetadata

import { assert } from "chai";
import type { ReflectApiType } from "./api";

export default function (Reflect: ReflectApiType) {
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
}
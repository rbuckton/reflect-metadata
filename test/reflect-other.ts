import * as fs from "fs";
import { assert } from "chai";
import type { ReflectApiType } from "./api";

export default function (Reflect: ReflectApiType) {
    describe("Reflect", () => {
        it("does not overwrite existing implementation", () => {
            const defineMetadata = Reflect.defineMetadata;
            const reflectPath = require.resolve("../Reflect.js");
            const reflectContent = fs.readFileSync(reflectPath, "utf8");
            const reflectFunction = Function(reflectContent);
            reflectFunction();
            assert.strictEqual(Reflect.defineMetadata, defineMetadata);
        });
    });
}
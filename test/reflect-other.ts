import * as fs from "fs";
import { assert } from "chai";

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
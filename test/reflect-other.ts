import { assert } from "chai";
import { script } from "./vm";
import { suites } from "./suites";

for (const { name, header, context } of suites.filter(s => s.global)) {
    describe(name, () => {
        describe("Reflect", () => {
            it("does not clobber existing implementation", () => {
                const { Reflect, defineMetadata, obj } = script(context)`
                    const fs = require("fs");
                    ${header}

                    exports.Reflect = Reflect;
                    exports.defineMetadata = Reflect.defineMetadata;
                    exports.obj = {};
                    Reflect.defineMetadata("key", "value", exports.obj);

                    const reflectPath = require.resolve("../Reflect.js");
                    const reflectContent = fs.readFileSync(reflectPath, "utf8");
                    const reflectFunction = Function(reflectContent);
                    reflectFunction();
                `;

                assert.notStrictEqual(Reflect.defineMetadata, defineMetadata);
                assert.strictEqual(Reflect.getOwnMetadata("key", obj), "value");
            });
        });

        it("isProviderFor crash", () => {
            const { Reflect } = script(context)`
                Reflect.defineMetadata = function() {};
                Reflect.getOwnMetadataKeys = function() { return [] };
                Reflect.getMetadataKeys = function() { return []; }
                ${header}
                exports.Reflect = Reflect;
            `;
            let obj = {};
            Reflect.getMetadataKeys(obj);
        });
    });
}
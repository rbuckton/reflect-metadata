import { Loader } from "./loader";
import reflect_other from "./reflect-other";
import reflect_tests from "./reflect-tests";

describe(`Global Reflect shim without polyfill`, () => {
    // Intercept "../Reflect" (the actual script), "./reflect" (a redirection helper for TypeScript), and "./global-tests" (the test entrypoint)
    const loader = new Loader(["../Reflect", "./reflect", "./global-tests"], __filename);
    process.env["REFLECT_METADATA_USE_MAP_POLYFILL"] = "false";
    try {
        loader.load("./global-tests");
    }
    finally {
        process.env["REFLECT_METADATA_USE_MAP_POLYFILL"] = "";
    }
});

describe(`Global Reflect shim with polyfill`, () => {
    // Intercept "../Reflect" (the actual script), "./reflect" (a redirection helper for TypeScript), and "./global-tests" (the test entrypoint)
    const loader = new Loader(["../Reflect", "./reflect", "./global-tests"], __filename);
    process.env["REFLECT_METADATA_USE_MAP_POLYFILL"] = "true";
    try {
        loader.load("./global-tests");
    }
    finally {
        process.env["REFLECT_METADATA_USE_MAP_POLYFILL"] = "";
    }
});
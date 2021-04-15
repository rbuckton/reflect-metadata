import { Loader } from "./loader";

describe("No-conflict Reflect shim without polyfill", () => {
    // Intercept "../no-conflict" (the actual module), "./no-conflict" (a redirection helper for TypeScript), and "./import-tests" (the test entrypoint)
    const loader = new Loader(["../no-conflict", "./no-conflict", "./import-tests"], __filename);
    process.env["REFLECT_METADATA_USE_MAP_POLYFILL"] = "false";
    try {
        loader.load("./import-tests");
    }
    finally {
        process.env["REFLECT_METADATA_USE_MAP_POLYFILL"] = "";
    }
});

describe("No-conflict Reflect shim with polyfill", () => {
    // Intercept "../no-conflict" (the actual module), "./no-conflict" (a redirection helper for TypeScript), and "./import-tests" (the test entrypoint)
    const loader = new Loader(["../no-conflict", "./no-conflict", "./import-tests"], __filename);
    process.env["REFLECT_METADATA_USE_MAP_POLYFILL"] = "true";
    try {
        loader.load("./import-tests");
    }
    finally {
        process.env["REFLECT_METADATA_USE_MAP_POLYFILL"] = "";
    }
});

describe("No-conflict Reflect shim shares state with global reflect shim", () => {
    const loader = new Loader(["../no-conflict", "./no-conflict", "../Reflect", "./reflect", "./shared-tests"], __filename);
    process.env["REFLECT_METADATA_USE_MAP_POLYFILL"] = "";
    loader.load("./shared-tests");
});
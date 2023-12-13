interface TestSuite {
    name: string;
    header: string;
    global?: boolean;
    polyfill?: boolean;
    context?: any;
}

export const suites: TestSuite[] = [
    {
        name: "Reflect.js",
        header: `require("../Reflect");`,
        global: true,
    },
    {
        name: "Reflect.js (w/polyfill)",
        header: `require("../Reflect");`,
        global: true,
        polyfill: true,
        context: {
            Map: {},
            Set: {},
            WeakMap: {},
        }
    },
    {
        name: "ReflectLite.js",
        header: `require("../ReflectLite");`,
        global: true,
    },
    {
        name: "ReflectNoConflict.js",
        header: `const Reflect = require("../ReflectNoConflict");`,
    },
];
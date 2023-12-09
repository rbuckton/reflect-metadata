/// <reference path="../globals.d.ts" />
import vm = require("vm");
import mod = require("module");
import fs = require("fs");
import path = require("path");

class Loader {
    cache = new Map<string, NodeModule>();
    context: vm.Context;
    constructor(context: vm.Context = { }) {
        this.context = vm.createContext(context);
    }
    load(id: string, filename = id, code?: string): any {
        let module = this.cache.get(id);
        if (module) return module.exports;
        module = {
            id,
            filename,
            exports: {},
            require: undefined,
            loaded: false,
            paths: undefined!,
            children: undefined!,
            parent: undefined!
        };
        this.cache.set(id, module);
        if (mod.builtinModules.indexOf(id) >= 0) {
            module.exports = require(id);
            module.loaded = true;
        }
        else {
            module.require = this.createRequire(filename);
            if (code === undefined) {
                code = fs.readFileSync(filename, { encoding: "utf8" });
            }
            code = `(function(module, exports, require, __filename, __dirname) {${code}\n})`;
            const func = vm.runInContext(code, this.context, { filename });
            func(module, module.exports, module.require, filename, path.dirname(filename));
            module.loaded = true;
        }
        return module.exports;
    }
    createRequire(filename: string) {
        const req = mod.createRequireFromPath(filename) as NodeRequire;
        const require = ((id: string) => this.load(mod.builtinModules.indexOf(id) >= 0 ? id : req.resolve(id))) as NodeRequire;
        require.resolve = req.resolve;
        return require;
    }
}

export function script(context: vm.Context = {}): (array: TemplateStringsArray, ...args: any[]) => any{
    return (array, ...args) => {
        let code = array[0];
        for (let i = 1; i < array.length; i++) {
            code += args[i - 1];
            code += array[i];
        }
        const loader = new Loader(context);
        return loader.load("test.js", __filename, code);
    };
}

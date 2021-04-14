import * as fs from "fs";
import { Context, createContext, runInContext } from "vm";
import { createRequire } from "module";

export class Loader {
    private _baseFilename: string;
    private _counter = 0;
    private _intercepts: Set<string>;
    private _context: Context;
    private _moduleMap: Map<string, any>;

    constructor(intercepts: string[], baseFilename: string) {
        const require = createRequire(baseFilename);
        this._baseFilename = baseFilename;
        this._intercepts = new Set(intercepts.map(id => require.resolve(id)));
        this._context = createContext({ describe, it, process, console, Error, TypeError });
        this._moduleMap = new Map();
    }

    load(id: string, referer = this._baseFilename) {
        const baseRequire = createRequire(referer);
        const filename = baseRequire.resolve(id);
        return this._evalModule(filename);
    }

    eval(content: string, filename: string = `${this._baseFilename}#eval${this._counter++ || ""}`) {
        if (this._moduleMap.has(filename)) throw new Error("Module already evaluated.");
        const func = runInContext(`(function (require, module, exports) {${content}\n})`, this._context, { filename });
        const module = { exports: { } as any };
        this._moduleMap.set(filename, module);
        let ok = false;
        try {
            func(this._makeRequire(filename), module, module.exports);
            ok = true;
        }
        finally {
            if (!ok) {
                this._moduleMap.delete(filename);
            }
        }
        return module.exports;
    }

    private _evalModule(filename: string) {
        const content = fs.readFileSync(filename, "utf8");
        return this.eval(content, filename);
    }

    private _makeRequire(referer: string) {
        const baseRequire = createRequire(referer);
        const wrappedRequire = ((id: string) => {
            const filename = baseRequire.resolve(id);
            if (this._intercepts.has(filename)) {
                const module = this._moduleMap.get(filename);
                if (module) return module.exports;
                return this._evalModule(filename);
            }
            return baseRequire(id);
        }) as NodeRequire;
        wrappedRequire.resolve = baseRequire.resolve;
        wrappedRequire.cache = baseRequire.cache;
        wrappedRequire.main = baseRequire.main;
        return wrappedRequire;
    }
}
import { expect } from "chai";
import Reflect_default, { Reflect as Reflect_binding } from "./no-conflict";
import * as Reflect_namespace from "./no-conflict";
import reflect_tests from "./reflect-tests";
import { API_KEYS } from "./api";

it("Native Reflect is undisturbed", () => {
    for (const key of API_KEYS) {
        expect(Reflect).to.not.haveOwnProperty(key);
    }
});

describe("Named import", () => {
    it("Has native Reflect as prototype", () => {
        expect(Object.getPrototypeOf(Reflect_binding)).to.eq(Reflect);
        for (const key of API_KEYS) {
            expect(Reflect_binding).to.haveOwnProperty(key);
        }
    });
    reflect_tests(Reflect_binding);
});

describe("Default import", () => {
    it("Has native Reflect as prototype", () => {
        expect(Object.getPrototypeOf(Reflect_default)).to.eq(Reflect);
        for (const key of API_KEYS) {
            expect(Reflect_default).to.haveOwnProperty(key);
        }
    });
    reflect_tests(Reflect_default);
});

describe("Namespace import", () => {
    it("Exports api", () => {
        for (const key of API_KEYS) {
            expect(Reflect_namespace).to.haveOwnProperty(key);
        }
    });
    reflect_tests(Reflect_namespace);
});
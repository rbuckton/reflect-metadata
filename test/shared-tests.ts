import "./reflect"; // shim global (must occur first)
import { Reflect as Reflect_binding } from "./no-conflict"; // load import (must occur second)
import { expect } from "chai";
import { API_KEYS } from "./api";

it("Shares state", () => {
    for (const key of API_KEYS) {
        expect(Reflect_binding[key]).to.eq(Reflect[key]);
    }
});
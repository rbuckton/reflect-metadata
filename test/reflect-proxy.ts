import "../Reflect";

import { assert } from "chai";

describe("Reflect", () => {
    it("propagates class constructor metadata trough Proxy", () => {
        const METADATA_KEY = Symbol();

        class Cls {}

        Reflect.defineMetadata(METADATA_KEY, "Hello", Cls);

        const Proxied = new Proxy(Cls, {});

        assert.strictEqual(
            Reflect.getMetadata(METADATA_KEY, Cls),
            Reflect.getMetadata(METADATA_KEY, Proxied)
        );
    });
    it("propagates class prototype metadata trough Proxy", () => {
      const METADATA_KEY = Symbol();

      class Cls {}

      Reflect.defineMetadata(METADATA_KEY, "Hello", Cls.prototype);

      const Proxied = new Proxy(Cls, {});

      assert.strictEqual(
          Reflect.getMetadata(METADATA_KEY, Cls.prototype),
          Reflect.getMetadata(METADATA_KEY, Proxied.prototype)
      );
  });
});
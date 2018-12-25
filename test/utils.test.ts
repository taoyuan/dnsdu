import { assert } from "chai";
import { etcdir, schedule } from "../src/utils";

describe("utils", () => {
  it("should schedule with textual time", (done) => {
    const t = Date.now();
    schedule("100ms", () => {
      const d = Date.now() - t;
      assert.ok(t >= 100 && d < 105);
      setTimeout(done, 100);
      return false;
    });

  });
});



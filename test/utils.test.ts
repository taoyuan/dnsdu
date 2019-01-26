import { assert } from "chai";
import { etcdir, formatDate, schedule, transformTimestamp } from "../src/utils";

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

  it("should transform timestamp", () => {
    const expected = {ip: '1.1.1.1', ts: '2018-12-27 15:13:44', handled: true};
    const data = {ip: '1.1.1.1', ts: 1545894824742, handled: true};
    assert.deepEqual(transformTimestamp(data), expected);
  });
});



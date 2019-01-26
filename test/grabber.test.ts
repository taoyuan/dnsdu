import * as s from "./support";
import { assert } from "chai";
import * as isip from "isip";
import { Grabber } from "../src";

describe("grabber", function() {
  this.timeout(5000);

  describe("grab", () => {


    it("should grab external ip", async () => {
      const ip = await Grabber.create().grab();
      assert.ok(isip(ip));
    });

    it("should throw ECONNREFUSED for invalid service", async () => {
      const g = Grabber.create({ timeout: 100, services: ["http://localhost/invalid"] });
      await assert.isRejected(g.grab(1), /Got invalid IP/);
    });

    it("should callback ip when it changed", (done) => {
      const grabs = ["1.1.1.1", "1.1.1.2"];
      const expected = grabs;
      const ips: string[] = [];
      const g = Grabber.create(s.buildIpFetcher(grabs));
      const job = g.schedule("10ms", (ip: string) => {
        ips.push(ip);
        return true; // mark handled
      }, (canceled) => {
        assert.ok(canceled);
        assert.deepEqual(ips, expected);
        done();
      });

      setTimeout(() => job.cancel(), 500);
    });

    it("should callback same ip if not handled", (done) => {
      const grabs = ["1.1.1.1"];
      const expected = ["1.1.1.1", "1.1.1.1", "1.1.1.1", "1.1.1.1"];
      const ips: string[] = [];
      const g = Grabber.create(s.buildIpFetcher(grabs));
      g.reset();
      let n = 5;
      const job = g.schedule("10ms", (ip: string) => {
        ips.push(ip);
        return --n === 1; // mark forth handled
      }, (canceled) => {
        assert.ok(canceled);
        assert.deepEqual(ips, expected);
        done();
      });

      setTimeout(() => job.cancel(), 500);
    });
  });

});



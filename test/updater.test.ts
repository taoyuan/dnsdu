import * as path from "path";
import { Executor } from "dnsm";
import sinon = require("sinon");
import * as s from "./support";
import { MockProvider } from "./mocks/mock-provider";
import { Grabber, schedule } from "../src";
import { assert } from "chai";

process.env.DNSM_MOCK_TOKEN = process.env.DNSM_MOCK_TOKEN || 'dnsm-mock-token';

describe("updater", function() {
  this.timeout(5000);

  let stubCreateProvider, stubEnvToken;
  let cache: MockProvider[];

  before(() => {
    stubCreateProvider = sinon.stub(Executor, "createProvider");
    stubEnvToken = sinon.stub(process.env, "DNSM_MOCK_TOKEN");
    stubEnvToken.value('1234567890');
  });

  after(() => {
    stubCreateProvider.reset();
    stubEnvToken.reset();
  });

  beforeEach(() => {
    stubCreateProvider.callsFake(s.buildProviderCreator(MockProvider, cache = []));
  });

  it("should schedule with domains files", (done) => {
    const expected = [
      ["authenticate", [
        "example.com",
        '1234567890'
      ]],
      ["updyn", ["", {
        name: "n1.example.com",
        type: undefined,
        ttl: 300,
        content: "1.1.1.1"
      }]],
      ["updyn", ["", {
        name: "n2.example.com",
        type: undefined,
        ttl: 300,
        content: "1.1.1.1"
      }]]
    ];
    (async () => {
      const job = await schedule("./test/fixtures/domains.yml", {
        interval: "10ms",
        grabber: Grabber.create(s.buildIpFetcher(["1.1.1.1"]), { hostfile: path.join(__dirname, "host.json") }),
        listener: (event) => {
          if (event !== "complete") {
            return job.cancel();
          }
          assert.lengthOf(cache, 1);
          assert.deepEqual(cache[0].requests, expected);
          done();
        }
      });
    })();
  });

  it("should schedule with actual grabber", (done) => {
    (async () => {
      const job = await schedule("./test/fixtures/domains.yml", {
        interval: "10ms",
        hostfile: path.join(__dirname, "host.json"),
        listener: (event) => {
          if (event !== "complete") {
            return job.cancel();
          }
          assert.lengthOf(cache, 1);
          assert.lengthOf(cache[0].requests, 3);
          // console.log(JSON.stringify(cache[0].requests, null, "  "));
          done();
        }
      });
    })();
  });
});

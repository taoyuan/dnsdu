import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import { Provider, ProviderOptions, Logger } from "dnsm";

// import * as sinon from "sinon";

chai.use(chaiAsPromised);

export function buildIpFetcher(ips: string[] | string) {
  ips = Array.isArray(ips) ? ips : [ips];
  let i = 0;
  let current = ips[0];
  return async () => {
    current = ips[i++] || current;
    return current;
  }
}

export function buildProviderCreator<T extends Provider>(ProviderClass, cache?: T[]) {
  return (provider: string, domain: string, opts: ProviderOptions, logger?: Logger): Provider => {
    const p = new ProviderClass(domain, opts, logger);
    cache && cache.push(p);
    return p;
  }
}


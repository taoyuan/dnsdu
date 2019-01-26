import { EventEmitter } from "events";
import { promisify } from "util";
import _ = require("lodash");
import exip = require("external-ip");
import fs = require("fs-extra");
import retry = require("async-retry");
import { ensureDir, etcdir, JobComplete, schedule } from "./utils";
import * as path from "path";

const DEFAULT_SERVICES = ["http://ifconfig.io/ip", "http://me.gandi.net", "https://api.ipify.org"];
const DEFAULT_HOSTFILE = path.join(etcdir(), "host.json");

export type Interval = number | string;

export interface GrabberOptions {
  replace?: boolean;
  services?: string[];
  timeout?: number;
  mode?: "parallel" | "sequential";
  ua?: string;
  hostfile?: string;
  reset?: boolean;
}

export interface ExternalAddress {
  ip: string;
  ts: number;
  handled?: boolean;
}

export interface GrabberData {
  previous: ExternalAddress;
  current: string;
}

export interface GrabberCallback {
  (current: string, previous: ExternalAddress);
}

export class Grabber extends EventEmitter {

  protected _hostfile: string;
  protected _checking: boolean;
  protected _fetchip;

  static create(opts?: GrabberOptions): Grabber;
  static create(fetchip?: Function, opts?: GrabberOptions): Grabber;
  static create(fetchip?: Function | GrabberOptions, opts?: GrabberOptions): Grabber {
    if (typeof fetchip === "function") {
      return new Grabber(fetchip, opts);
    }
    return new Grabber(fetchip);
  }

  constructor(opts?: GrabberOptions);
  constructor(fetchip?: Function, opts?: GrabberOptions);
  constructor(fetchip?: Function | GrabberOptions, opts?: GrabberOptions) {
    super();
    if (typeof fetchip === "function") {
      this._fetchip = fetchip;
    } else {
      opts = fetchip;
    }
    opts = opts || {};

    if (!this._fetchip) {
      const o: any = _.defaults({
        replace: opts.replace,
        services: opts.services,
        timeout: opts.timeout,
        getIP: opts.mode,
        userAgent: opts.ua
      }, {
        replace: true,
        services: DEFAULT_SERVICES,
        timeout: 1000,
        getIP: "parallel",
        userAgent: "Chrome 71.0.3578 / Mac OS X 10.14.2"
      });

      this._fetchip = promisify(exip(o));
    }

    this._hostfile = opts.hostfile || DEFAULT_HOSTFILE;
    if (opts.reset !== false) {
      this.reset();
    }
  }

  schedule(interval: Interval, fn: GrabberCallback, done?: JobComplete);
  schedule(fn: GrabberCallback, done?: JobComplete)
  schedule(interval: Interval | GrabberCallback, callback?: GrabberCallback | JobComplete, done?: JobComplete) {
    if (typeof interval === "function") {
      done = <JobComplete>callback;
      callback = <GrabberCallback>interval;
      interval = "5m";
    }

    return schedule(interval, () => this.check(<GrabberCallback>callback), done);
  }

  protected async check(callback?: GrabberCallback) {
    if (this._checking) return;
    this._checking = true;
    try {
      const address = this.readExternalAddress();
      const current = await this.grab();
      this.emit("check", { previous: address, current });
      if ((current && address.ip !== current) || !address.handled) {
        if (current) {
          address.ip = current;
          address.ts = Date.now();
        }
        this.emit("changed", { previous: address, current });
        if (callback && await callback(current, address)) {
          address.handled = true;
        }
        this.writeExternalAddress(address);
      }
    } catch (e) {
      this.emit("error", e);
    } finally {
      this._checking = false;
    }
  }

  protected readExternalAddress(): ExternalAddress {
    if (fs.existsSync(this._hostfile)) {
      return fs.readJsonSync(this._hostfile);
    }
    return { ip: "", ts: 0 };
  }

  protected writeExternalAddress(address: ExternalAddress) {
    ensureDir(path.dirname(this._hostfile));
    return fs.writeJsonSync(this._hostfile, address);
  }

  reset() {
    try {
      if (fs.existsSync(this._hostfile)) {
        fs.removeSync(this._hostfile);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async grab(retries?: number) {
    retries = retries || 0;
    return await retry(() => this._fetchip(), { retries });
  }

}

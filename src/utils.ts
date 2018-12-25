import * as _ from "lodash";
import * as path from "path";
import * as fs from "fs-extra";
import totime = require("to-time");

export const APPNAME = require('../package').name;
export const APPDATA = process.env.APPDATA || (process.platform == "darwin" ? path.join(process.env.HOME || "", "Library/Preferences") : "/etc");

export interface Job {
  cancel();
}

export interface JobComplete {
  (canceled?: boolean);
}

export function etcdir(name?: string) {
  return path.join(APPDATA, name || APPNAME);
}

export function ensureDir(dir) {
  return fs.ensureDirSync(dir);
}

export function envs() {
  return _.transform(process.env, (result: Object, value, key) => {
    result[_.toLower(key)] = value;
    return result;
  }, {});
}

export function schedule(interval, fn, done?: JobComplete): Job {
  interval = typeof interval === "string" ? totime(interval).milliseconds() : interval;

  let stop;
  let t: any = setImmediate(tick);

  const job = {
    cancel: () => {
      if (t) {
        t && clearTimeout(t);
        t = null;
        if (done) {
          done(true);
        }
      }
      stop = true;
    }
  };

  async function tick() {
    t = null;
    if (!stop) {
      try {
        const answer = await fn(job);
        stop = stop || (answer === false);
      } catch (e) {
        //
      }
    }

    if (!stop) {
      t = setTimeout(tick, interval);
    } else if (done) {
      done();
    }
  }

  return job;
}

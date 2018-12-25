import { execute } from "dnsm";
import * as path from "path";
import * as logs from "./logs";
import { Grabber } from "./grabber";

const DEFAULT_INTERVAL = '1m'; // 1 minute

// for dns record
export interface RecordOptions {
  ttl?: number;
}

export interface ScheduleOptions extends RecordOptions {
  hostfile?: string;
  listener?: (event: string, data?: any) => void;
  grabber?: Grabber;
  interval?: string;
}

export async function schedule(file: string, opts?: ScheduleOptions, logger?);
export async function schedule(file: string, logger?);
export async function schedule(file: string, opts?: ScheduleOptions | Logger, logger?) {
  if (opts && (typeof (<Logger>opts).debug === 'function')) {
    logger = <Logger> opts;
    opts = undefined;
  }

  opts = <ScheduleOptions>Object.assign({ ttl: 300 }, opts);
  logger = logger || logs.logger;

  const listener = opts.listener || (() => {});

  const g = opts.grabber || await Grabber.create({hostfile: opts.hostfile});
  g.on('error', err => listener('error', err));
  g.on('check', data => listener('check', data));
  return g.schedule(opts.interval || DEFAULT_INTERVAL, async (current, previous) => {
    try {
      listener('before updyn', {current, previous});
      await updyn(path.resolve(file), { content: current, ...opts }, logger);
      listener('after updyn', {current, previous});
      return true; // mark this ip has been handled
    } catch (e) {
      logger && logger.error(e.message);
      if (/token is required/.test(e.message)) {
        process.exit(2);
      }
    }
  }, () => {
    listener('complete');
    logger && logger.debug('Schedule complete', {file, ...opts});
  });
}

async function updyn(file: string, opts, logger) {
  await execute("updyn", { conf: file, ...opts }, logger);
}

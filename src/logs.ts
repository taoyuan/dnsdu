import * as _ from "lodash";
import * as pino from "pino";

export const DATE_FORMAT = 'yyyy-mm-dd HH:MM:ss';

export function create(opts?: pino.LoggerOptions) {
  opts = _.merge({
    prettyPrint: {
      colorize: true,
      translateTime: `SYS:${DATE_FORMAT}`,
    },
    level: "info",
  }, opts);
  return pino(opts);
}

export const logger = create();

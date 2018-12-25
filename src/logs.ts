import * as _ from "lodash";
import * as pino from "pino";

export function create(opts?: pino.LoggerOptions) {
  opts = _.merge({
    prettyPrint: {
      colorize: true,
      translateTime: 'SYS:yyyy-mm-dd HH:MM:ss'
    },
    level: "info",
  }, opts);
  return pino(opts);
}

export const logger = create();

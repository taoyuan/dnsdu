import * as _ from "lodash";
import * as pino from "pino";
import * as dateformat from "dateformat";
import program = require("caporal");
import { schedule } from "./updater";
import * as logs from "./logs";
import { envs, formatDate, transformTimestamp } from "./utils";
import { DATE_FORMAT } from "./logs";

const pkg = require('../package');

function handleError(err, logger) {
  logger.error(err.message || err);
  if (err.stack) {
    logger.debug();
    logger.debug(err.stack);
  }
  process.exit(1);
}

function buildScheduleListener(logger, checkinterval) {
  checkinterval = parseInt(checkinterval || 60);
  let numcheck = 0;
  return (event, data) => {

    let previous = '';
    if (data && data.previous) {
      previous = transformTimestamp(_.clone(data.previous));
    }

    if (event === "check") {
      logger.trace(`checked. current ip: ${data.current} | previous: `, previous);
      if (++numcheck === checkinterval) {
        logger.info(`checked (${numcheck}) ${data.current} =`, previous);
        numcheck = 0;
      }
    } else if (event === "before updyn") {
      logger.info(`Update ${data.current} <-`, previous);
    } else if (event === "after updyn") {
      logger.info(`Updated ${data.current}`);
    } else if (event === "complete") {
      logger.info("Schedule complete!");
    } else if (event === "error") {
      logger.error((data && data.message) || data);
    }
  };
}

export function cli(argv: any) {
  program
    .version(pkg.version)
    .description("Update DNS record dynamic")
    .option("-i, --interval <interval>", "Specify the interval in textual time like: 1h, 2m, 3s, 4ms", program.STRING, '')
    .option("-f, --file <file>", "Specify the domain entries file", program.STRING, '')
    .option("-h, --hostfile <hostfile>", "Specify the cache host file", program.STRING, '')
    .option("-k, --checkinterval <checkinterval>", "Specify checking info interval", program.INT)
    .action(async function(args, opts, log) {
      const level = _.get(log, "transports.caporal.level", "info");
      const logger = logs.create({ level });

      const names = _.keys(opts);
      opts = _.pick(_.merge(opts, envs()), names);
      opts = _.pickBy(opts, _.identity);
      try {
        logger.info('Schedule ', _.pickBy({conf: opts.file, ...opts}, _.identity));
        await schedule(opts.file, { ...opts, listener: buildScheduleListener(logger, opts.checkinterval) }, logger);
      } catch (e) {
        handleError(e, logger);
      }
    });

  program.parse(argv);
}


process.on("uncaughtException", pino.final(logs.logger, (err, finalLogger) => {
  finalLogger.error(err, "uncaughtException");
  process.exit(1);
}));

process.on("unhandledRejection", pino.final(logs.logger, (err, finalLogger) => {
  finalLogger.error(err, "unhandledRejection");
  process.exit(1);
}));

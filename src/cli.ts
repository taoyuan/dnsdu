import * as _ from "lodash";
import program = require("caporal");
import { schedule } from "./updater";
import * as pino from "pino";
import * as logs from "./logs";

function handleError(err, logger) {
  logger.error(err.message || err);
  if (err.stack) {
    logger.debug();
    logger.debug(err.stack);
  }
  process.exit(1);
}

function buildScheduleListener(logger, checkpoint = 60) {
  let numcheck = 0;
  return (event, data) => {
    if (event === "check") {
      logger.trace(`check ${data.current} |`, data.previous);
      if (++numcheck === checkpoint) {
        logger.debug(`checked ${numcheck} times ${data.current} |`, data.previous);
        numcheck = 0;
      }
    } else if (event === "before updyn") {
      logger.info(`Update ${data.current} |`, data.previous);
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
    .description("Dynamic update DNS record")
    .option("-i, --interval", "Specify the interval in textual time like: 1h, 2m, 3s, 4ms")
    .option("-c, --conf", "Specify the domain entries file")
    .option("-h, --host", "Specify the cache host file")
    .action(async function(args, opts, log) {
      const level = _.get(log, "transports.caporal.level", "info");
      const logger = logs.create({ level });
      try {
        await schedule(opts.conf, { ...opts, listener: buildScheduleListener(logger) }, logger);
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

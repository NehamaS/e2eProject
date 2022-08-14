import logger from "mcu-logger";
import { McuLoggerConfig } from "mcu-logger/lib/common";

export class LoggerService {
	private logger: any = logger;

	constructor() {
		this.logger.update(<McuLoggerConfig>{
			level: process.env.LOG_LEVEL || "debug",
			stackLevel: 14,
		});
	}

	error(...args: any) {
		// add your tailored logic here
		this.logger.error(args);
	}

	info(...args: any) {
		this.logger.info(args);
	}

	warn(...args: any) {
		this.logger.warn(args);
	}

	debug(...args: any) {
		this.logger.debug(args);
	}

	verbose(...args: any) {
		this.logger.verbose(args);
	}
}

export const LOGGER: LoggerService = new LoggerService();

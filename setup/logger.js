let methods = ["log", "warn", "debug", "error", "info"];

let logger = require("mcu-logger");
logger.update({
	level: "debug",
	stackLevel: 12,
});

if (process.env.USE_SIMPLE_LOGGER) {
	methods.map((method) => {
		let origLog = console[method];
		console[method] = (...args) => {
			let now = new Date();
			args.unshift(now);
			origLog.apply(console, args);
		};
	});
} else {
	methods.map((method) => {
		let origLog = method == "log" ? logger.info : logger[method];
		console[method] = (...args) => {
			// let now = new Date();
			// args.unshift(now);
			origLog.apply(logger, args);
		};
	});
}

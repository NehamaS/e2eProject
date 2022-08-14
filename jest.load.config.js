module.exports = {
	roots: ["<rootDir>/load"],
	transform: {
		"^.+\\.tsx?$": "ts-jest",
	},
	setupFiles: ["./setup/init.load.js"],
	moduleNameMapper: {
		"@if(.*)$": "<rootDir>/if/gen-nodejs/$1",
	},
	testMatch: ["**/*.steps.ts"],
	reporters: [
		"default",
		[
			"jest-html-reporters",
			{
				pageTitle: "mMCU Load Automation",
				publicPath: "./reports",
				filename: "mcu_load_automation_report.html",
				expand: true,
			},
		],
	],
	setupFilesAfterEnv: ["jest-expect-message"],
};

module.exports = {
	roots: ["<rootDir>/manual"],
	transform: {
		"^.+\\.tsx?$": "ts-jest",
	},
	setupFiles: ["./setup/init.manual.js"],
	moduleNameMapper: {
		"@if(.*)$": "<rootDir>/if/gen-nodejs/$1",
	},
	modulePathIgnorePatterns: ["<rootDir>/load/"],
	testMatch: ["**/*.steps.ts"],
	reporters: [
		"default",
		[
			"jest-html-reporters",
			{
				pageTitle: "mMCU Automation",
				publicPath: "./reports",
				filename: "mcu_automation_report.html",
				expand: true,
			},
		],
	],
	setupFilesAfterEnv: ["jest-expect-message"],
};

module.exports = {
	roots: ["<rootDir>/steps"],
	transform: {
		"^.+\\.tsx?$": "ts-jest",
	},
	setupFiles: ["./setup/init.js"],
	moduleNameMapper: {
		"@if(.*)$": "<rootDir>/if/gen-nodejs/$1",
	},
	modulePathIgnorePatterns: ["<rootDir>/load/"],
	testMatch: ["**/*.steps.ts"],
	//setupFilesAfterEnv: ["./node_modules/jest-enzyme/lib/index.js"],
	//setupFilesAfterEnv: ["jest-expect-message"],
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
		// [
		// 	"./node_modules/jest-cucumber/dist/src/reporter",
		// 	{
		// 		formatter: "json",
		// 		path: "./reports/test-report.json",
		// 	},
		// ],
		[
			"jest-junit",
			{
				outputDirectory: "./jreports",
				outputName: "jenkins-report.xml",
			},
		],
	],
	setupFilesAfterEnv: ["jest-expect-message"],
};

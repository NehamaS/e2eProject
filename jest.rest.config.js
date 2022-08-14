module.exports = {
	roots: ["<rootDir>/steps/health"],
	transform: {
		"^.+\\.tsx?$": "ts-jest",
	},
	setupFiles: ["./setup/init.rest.js"],
	moduleNameMapper: {
		"@if(.*)$": "<rootDir>/if/gen-nodejs/$1",
	},
	modulePathIgnorePatterns: ["<rootDir>/load/", "<rootDir>/health/"],
	testMatch: ["**/*.steps.ts"],
	reporters: [
		"default",
		[
			"jest-junit",
			{
				outputDirectory: "jreports",
				outputName: "jenkins-report.xml",
			},
		],
		// [
		// 	"./node_modules/jest-cucumber/dist/src/reporter",
		// 	{
		// 		formatter: "json",
		// 		path: "./reports/sanity-report.json",
		// 	},
		// ],
	],
	setupFilesAfterEnv: ["jest-expect-message"],
};

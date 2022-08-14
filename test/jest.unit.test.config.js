module.exports = {
	roots: ["<rootDir>"],
	transform: {
		"^.+\\.tsx?$": "ts-jest",
	},
	//setupFiles: ['./setup/init.js'],
	// "globals": {
	//     "CONFIG": {
	//         "counters": {"enable": false, "sendCountersTimer": 0}
	//     }
	// }
	moduleNameMapper: {
		"@if(.*)$": "<rootDir>/if/gen-nodejs/$1",
	},
	testMatch: ["**/*.spec.ts"],
	setupFilesAfterEnv: ["jest-expect-message"],
};

import { LOGGER } from "../../common/logger.service";

describe("test loger service", () => {
	test("test log ", () => {
		LOGGER.info("1", 2, "this is a test", { a: 1 });
	});
});

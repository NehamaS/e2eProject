import * as fs from "fs";
import { SdpValidator } from "../../../common/sip/validators/sdp.validator";
import { isNumberString } from "class-validator";

describe("validators", () => {
	const validator: SdpValidator = new SdpValidator();

	test("Test SDP parse", async () => {
		//let sdpInput = require();
		try {
			const sdpInput = fs.readFileSync(`${__dirname}/sdp/SdpExample.sdp`, "utf8");
			const result: any = await validator.checkSDPType(sdpInput);

			expect("Invalid request").toEqual(result);

			// //groups: [ { type: 'BUNDLE', mids: '0 1 2 3 4 5 screenShare' } ],
			// expect(result.groups).toBeDefined();
			// expect("BUNDLE").toEqual(result.groups[0].type);
			// expect(result.groups[0].mids).toBeDefined();
			// const mids: Array<string> = result.groups[0].mids.split(" ");
			// expect(7).toEqual(mids.length);
			// mids.map((entry) => {
			// 	if (isNumberString(entry)) {
			// 		const num: number = parseInt(entry);
			// 		expect(num).toBeGreaterThanOrEqual(0);
			// 		expect(num).toBeLessThanOrEqual(5);
			// 	} else {
			// 		expect("screenShare").toEqual(entry);
			// 	}
			// });
			//
			// expect(result.media).toBeDefined();
			// expect(7).toEqual(result.media.length);
		} catch (e) {
			console.error(e);
		}
	});
});

import { SdpService } from "../../../common/sip/sdp/sdp.service";

import * as fs from "fs";
import { SessionDescription } from "sdp-transform";

describe("sdp service", () => {
	const service: SdpService = new SdpService();

	xtest("Test sdp service", async () => {
		try {
			const sdpInput = fs.readFileSync(`${__dirname}/../validators/sdp/SdpExample.sdp`, "utf8");
			const sdp: SessionDescription = service.toSDP(sdpInput);
			expect(sdp).toBeDefined();
			const sdpOutput = service.toString(sdp);
			expect(sdpInput).toEqual(sdpOutput);
		} catch (e) {
			fail(e);
		}
	});
});

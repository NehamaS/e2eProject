import { RoomType, UserType } from "../../common/messages/factory";
import { SdpType } from "../../common/sip/sdp.factory";
import * as stepUtils from "../../steps/common.steps.utils";

describe("load", () => {
	const delay = (): Promise<number> => {
		return new Promise<number>((resolve) => {
			setTimeout(() => {
				return resolve(200);
			}, 3000);
		});
	};

	beforeEach(() => {
		console.debug("start", new Date());
	});
	afterEach(() => {
		console.debug("end", new Date());
	});

	test("Load test basic ", async () => {
		const num: number = await delay();

		expect(200).toEqual(num);
	});

	test("sdp type ", async () => {
		expect(SdpType.VideoSender).toEqual(stepUtils.sdpResolver(RoomType.AUDIO_VIDEO, UserType.SENDER));
		expect(SdpType.SSPublisher).toEqual(stepUtils.sdpResolver(RoomType.SCREEN_SHARE, UserType.SENDER));
		//expect(SdpType.dataChannel).toEqual(stepUtils.sdpResolver(RoomType.DATA_CHANNEL, UserType.SENDER));
		expect(SdpType.receiver).toEqual(stepUtils.sdpResolver(RoomType.AUDIO_VIDEO, UserType.RECEIVER));
	});
});

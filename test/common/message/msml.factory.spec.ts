import { MsmlFactory, MsmlMsgType } from "../../../common/messages/msml.factory";
import { MsmlType } from "../../../common/messages/msml/msml.message";
import { ControlSession, UserSession } from "../../../common/sip/dto/controlSession";
import { RoomType } from "../../../common/messages/factory";
import { ROOM_TYPE_SCRSH } from "../../../common/constants";
import { SipAction } from "../../../common/sip/sipAction";

describe("sdp service", () => {
	const factory: MsmlFactory = new MsmlFactory();
	test("Test message construction", async () => {
		const meeting = "10001";
		try {
			let xml: string = factory.message(
				<MsmlMsgType>{ roomType: RoomType.AUDIO_VIDEO, msgType: MsmlType.CREATE_CONF },
				<ControlSession>{
					roomId: meeting,
				}
			);
			console.debug("createconference", xml);
			expect(xml).toBeDefined();
			expect(xml.search("createconference")).toBeGreaterThan(0);
			expect(xml.search(meeting)).toBeGreaterThan(0);

			const sessions = new Map();
			sessions.set(meeting, { roomId: `r${meeting}` });
			xml = factory.message(
				<MsmlMsgType>{ roomType: RoomType.AUDIO_VIDEO, msgType: MsmlType.JOIN },
				<UserSession>{
					meetingId: meeting,
					connId: `c${meeting}`,
					room: { callId: "callid121212", id: `r${meeting}` },
				}
			);
			console.debug("join", xml);
			expect(xml).toBeDefined();
			expect(xml.search("join")).toBeGreaterThan(0);
			expect(xml.split(meeting).length - 1).toEqual(2);

			xml = factory.message(
				<MsmlMsgType>{ roomType: RoomType.AUDIO_VIDEO, msgType: MsmlType.UNJOIN },
				<UserSession>{
					meetingId: meeting,
					connId: `c${meeting}`,
					room: { callId: "callid121212", id: `r${meeting}` },
				}
			);
			console.debug("unjoin", xml);
			expect(xml).toBeDefined();
			expect(xml.search("unjoin")).toBeGreaterThan(0);
			expect(xml.split(meeting).length - 1).toEqual(2);
		} catch (e) {
			fail(e);
		}
	});

	test("Test message construction - modify stream", async () => {
		try {
			const meeting = "10070";
			const xml: string = factory.message(
				<MsmlMsgType>{
					roomType: RoomType.SCREEN_SHARE,
					msgType: MsmlType.MODIFY_STREAM,
					sipAction: SipAction.UNDEFINED,
				},

				<UserSession>{
					meetingId: meeting,
					connId: `c${meeting}`,
					roomType: ROOM_TYPE_SCRSH,
					room: { callId: "callid121212", id: `r${meeting}` },
				}
			);
			console.debug("modifystream", xml);
			expect(xml).toBeDefined();

			let regExp = new RegExp("modifystream", "gi");
			expect((xml.match(regExp) || []).length).toEqual(4);
			regExp = new RegExp(`conf:r${meeting}`, "gi");
			expect((xml.match(regExp) || []).length).toEqual(2);
		} catch (e) {
			fail(e);
		}
	});
});

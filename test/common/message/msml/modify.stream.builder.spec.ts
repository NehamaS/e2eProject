import { ModifyStreamBuilder, StreamMessage } from "../../../../common/messages/msml/modify.stream.builder";
import { RoomType } from "../../../../common/messages/factory";
import { SipAction } from "../../../../common/sip/sipAction";
import { MsmlService } from "../../../../common/sip/msml.service";

describe("modify stream builder", () => {
	test("Build modify Stream object", async () => {
		const builder: ModifyStreamBuilder = new ModifyStreamBuilder(
			RoomType.SCREEN_SHARE,
			SipAction.UNDEFINED,
			"c:10001",
			"r:10001",
			"c:10002"
		);
		try {
			builder.construct();
			const res: Array<StreamMessage> = builder.getResult();

			//Build object
			console.debug("modifyStream", res);
			expect(res).toBeDefined();
			expect(2).toEqual(res.length);

			const service: MsmlService = new MsmlService();

			//Convert to xml
			const xml: string = service.Object2xmlString(res);
			console.debug("modifyStream", "xml", xml);
			expect(xml).toBeDefined();
		} catch (e) {
			fail(e);
		}
	});
});

import { SipValidator } from "../../../common/sip/validators/sip.validator";
import { ControlSession } from "../../../common/sip/dto/controlSession";
import { RequestDTO, ResponseDTO } from "../../../common/sip/dto/infoDTO";
import { Context } from "../../../common/context";
// test

describe("validators", () => {
	const validator: SipValidator = new SipValidator();

	const session: ControlSession = new ControlSession();

	test("Test SipValidator", async () => {
		const dto: any = <ResponseDTO>{ status: 200, duration: 2000 };
		try {
			await validator.validate(dto, <ResponseDTO>{}, session);
			fail("dto is actually invalid");
		} catch (e) {
			//test is ok
			console.info(e);
		}
	});
});

import { BaseValidator } from "./validator";
import { SdpValidator } from "./sdp.validator";
import { RequestDTO, ResponseDTO } from "../dto/infoDTO";
import { MsmlService } from "../msml.service";
import { ControlSession, UserSession } from "../dto/controlSession";
import { LOGGER } from "../../logger.service";
import { strToCaseType, strToSDPCaseType } from "../../utils";
import { CaseType, SDPCaseType } from "../../messages/factory";

const MAX_API_ROUND_TRIP = 10000;

export class SipValidator extends BaseValidator {
	private sdp: SdpValidator;

	constructor() {
		super();

		this.sdp = new SdpValidator();
	}

	public validate(request: RequestDTO, response: ResponseDTO, session: ControlSession | UserSession): void {
		if (!session.inviteError && !session.infoError) {
			expect(response.status).toEqual(session.statusCode ? Number(session.statusCode) : 200);
			expect(response.duration).toBeLessThan(
				process.env.MAX_DURATION ? parseInt(process.env.MAX_DURATION) : MAX_API_ROUND_TRIP
			);
			if (request.headers.from.params) {
				expect(response.headers.from.params.tag).toEqual(request.headers.from.params.tag);
			} else {
				expect(Object.keys(response.headers.from.params).length).toEqual(0);
			}
			expect(response.headers["call-id"]).toEqual(request.headers["call-id"]);
			expect(response.headers.cseq.seq).toEqual(request.headers.cseq.seq);
			switch (response.headers.cseq.method) {
				case "INFO":
					this.validateInfo(request, response);
					break;
				case "INVITE":
					this.validateInvite(request, response, session);
					break;
				case "BYE":
					this.validateBye(request, response);
					break;
			}
		}
	}

	public async validateInfo(request: RequestDTO, response: ResponseDTO): Promise<void> {
		LOGGER.debug({ action: "InfoResponse", data: response });

		expect(response.headers.to.params.tag).toEqual(request.headers.to.params.tag);

		const msml: MsmlService = new MsmlService();

		const newMSML = await msml.xmlString2Object(response.content);
		expect(newMSML.msml.result[0].$.response).toEqual("200");
	}

	public validateInvite(request: RequestDTO, response: ResponseDTO, session: ControlSession | UserSession): void {
		// LOGGER.log({
		// 	action: "InviteResponse",
		// 	data: JSON.stringify(request),
		// });
		expect(response.headers.to.params.tag).toBeDefined();
		if (request.content) this.sdp.validate(request, response, session);
	}

	public validateBye(request: RequestDTO, response: ResponseDTO): void {
		LOGGER.debug({ action: "byeResponse", data: response });

		expect(response.headers.to.params.tag).toEqual(request.headers.to.params.tag);
	}
}

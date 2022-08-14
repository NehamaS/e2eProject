import { ControlSession, UserSession } from "../sip/dto/controlSession";

import { SipDTO } from "../sip/dto/infoDTO";
import { RoomType, SipMethod } from "./factory";
import { BaseFactory } from "./base.factory";
import { METHOD_OPTIONS } from "./audio.message.factory";

export class GenericMessageFactory extends BaseFactory<SipMethod, SipDTO> {
	public message(method: SipMethod, session: ControlSession | UserSession | Array<UserSession>, roomType?: RoomType) {
		switch (method) {
			case SipMethod.OPTIONS:
				return this.options(<ControlSession>session);
			default:
				throw new Error("not supported option");
		}
	}

	private options(session: ControlSession): SipDTO {
		const optionReq: SipDTO = <SipDTO>{
			method: METHOD_OPTIONS,
			uri: this.contact(session.tls, session.to).uri,
			headers: {
				to: this.contact(session.tls, session.to),
				from: this.contact(session.tls, session.from, true),
				"call-id": session.callId,
				cseq: {
					method: METHOD_OPTIONS,
					seq: 1,
				},
				contact: [{ uri: this.contact(session.tls, session.from).uri }],
				via: [],
			},
		};

		return optionReq;
	}
}

import { ControlSession, UserSession } from "../sip/dto/controlSession";

import { RoomType, SipMethod } from "./factory";
import { BaseMessageFactory } from "./base.message.factory";
import { MEDIA_TYPE_AUDIO } from "../constants";
import { MsmlType } from "./msml/msml.message";

export const METHOD_INFO = "INFO";
export const METHOD_INVITE = "INVITE";
export const METHOD_ACK = "ACK";
export const METHOD_BYE = "BYE";
export const METHOD_OPTIONS = "OPTIONS";
export const METHOD_NOTIFY = "NOTIFY";
export const METHOD_PRACK = "PRACK";
export const METHOD_UPDATE = "UPDATE";

export class AudioMessageFactory extends BaseMessageFactory {
	constructor() {
		super();
		this.type = RoomType.AUDIO_VIDEO;
		this.mediaType = MEDIA_TYPE_AUDIO;
	}

	public message(method: SipMethod, session: ControlSession | UserSession, roomType?: RoomType) {
		switch (method) {
			case SipMethod.CREATE_ROOM_INFO:
				return this.createRoomInfo(<ControlSession>session);
			case SipMethod.CREATE_ROOM_INVITE:
				return this.createRoomInvite(<ControlSession>session);
			case SipMethod.ACK:
				return this.ack(<ControlSession | UserSession>session);
			case SipMethod.JOIN_PARTICIPANT_INVITE:
				return this.joinParticipantInvite(<UserSession>session);
			case SipMethod.JOIN_PARTICIPANT_REINVITE:
				return this.joinParticipantReInvite(<UserSession>session);
			case SipMethod.JOIN_PARTICIPANT_INFO:
				return this.joinParticipantInfo(<UserSession>session);
			case SipMethod.DESTROY_ROOM_INFO:
				return this.destroyRoomInfo(<ControlSession>session);
			case SipMethod.DESTROY_ROOM_BYE:
				return this.destroyRoomBye(<ControlSession>session);
			case SipMethod.LEAVE_PARTICIPANT_INFO:
				return this.leaveParticipantInfo(<UserSession>session);
			case SipMethod.LEAVE_PARTICIPANT_BYE:
				return this.leaveparticipantBye(<UserSession>session);
			case SipMethod.MODIFY_STREAM_INFO:
				return this.modifyStreamInfo(<UserSession>session);
			case SipMethod.MUTE:
				return this.mute(<UserSession>session, MsmlType.MUTE);
			case SipMethod.MUTEALL:
				return this.muteAll(<UserSession>session);
			case SipMethod.HOLD:
				return this.mute(<UserSession>session, MsmlType.HOLD);
			case SipMethod.RECORD:
				return this.recorderInfo(<ControlSession>session);
			case SipMethod.UPDATE:
				return this.updateParticipant(<UserSession>session);
			case SipMethod.PRACK:
				return this.prack(<ControlSession | UserSession>session);
			// case SipMethod.OPTIONS:
			// 	return this.options(<ControlSession>session);
			default:
				throw new Error("not supported option");
		}
	}

	// protected options(session: ControlSession): SipDTO {
	// 	const optionReq: SipDTO = {
	// 		method: METHOD_OPTIONS,
	// 		headers: {
	// 			to: this.contact(session.to),
	// 			from: this.contact(session.from),
	// 			"call-Id": session.callId,
	// 			cseq: { method: METHOD_ACK, seq: session.cseq.seq },
	// 			contact: [{ uri: this.contact(session.from).uri }],
	// 			via: new Array<Contact>(),
	// 		},
	// 	};
	// 	return optionReq;
	// }
}

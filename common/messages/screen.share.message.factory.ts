import { ControlSession, UserSession } from "../sip/dto/controlSession";

import { RoomType, SipMethod } from "./factory";
import { BaseMessageFactory } from "./base.message.factory";
import { MEDIA_TYPE_SCRSH } from "../constants";

export class ScreenShareMessageFactory extends BaseMessageFactory {
	constructor() {
		super();
		this.type = RoomType.SCREEN_SHARE;
		this.mediaType = MEDIA_TYPE_SCRSH;
	}

	public message(method: SipMethod, session: ControlSession | UserSession | Array<UserSession>, roomType?: RoomType) {
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
			default:
				throw new Error("not supported option");
		}
	}
}

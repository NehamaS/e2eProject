// import { RequestDTO } from "../sip/dto/infoDTO";
// import { RoomType, SipMethod } from "./factory";
// import { BaseMessageFactory } from "./base.message.factory";
// import { ControlSession, UserSession } from "../sip/dto/controlSession";
// import { MEDIA_TYPE_DC } from "../constants";
//
// export class DCMessageFactory extends BaseMessageFactory {
// 	constructor() {
// 		super();
// 		this.type = RoomType.DATA_CHANNEL;
// 		this.mediaType = MEDIA_TYPE_DC;
// 	}
//
// 	// return result;
//
// 	message(method: SipMethod, session: ControlSession | UserSession): RequestDTO {
// 		switch (method) {
// 			case SipMethod.CREATE_ROOM_INFO:
// 				return this.createRoomInfo(<ControlSession>session);
// 			case SipMethod.CREATE_ROOM_INVITE:
// 				return this.createRoomInvite(<ControlSession>session);
// 			case SipMethod.ACK:
// 				return this.ack(session);
// 			case SipMethod.JOIN_PARTICIPANT_INVITE:
// 				return this.joinParticipantInvite(<UserSession>session);
// 			case SipMethod.JOIN_PARTICIPANT_REINVITE:
// 				return this.joinParticipantReInvite(<UserSession>session);
// 			case SipMethod.JOIN_PARTICIPANT_INFO:
// 				return this.joinParticipantInfo(<UserSession>session);
// 			case SipMethod.DESTROY_ROOM_INFO:
// 				return this.destroyRoomInfo(<ControlSession>session);
// 			case SipMethod.DESTROY_ROOM_BYE:
// 				return this.destroyRoomBye(<ControlSession>session);
// 			case SipMethod.LEAVE_PARTICIPANT_INFO:
// 				return this.leaveParticipantInfo(<UserSession>session);
// 			case SipMethod.LEAVE_PARTICIPANT_BYE:
// 				return this.leaveparticipantBye(<UserSession>session);
// 			default:
// 				throw new Error("not supported option");
// 		}
// 		// return undefined;
// 	}
//
// 	protected createRoomInvite = (session: ControlSession) => {
// 		const inviteReq: RequestDTO = super.createRoomInvite(session);
// 		inviteReq.headers["P-Mav-DataChannel"] = 1;
// 		return inviteReq;
// 	};
//
// 	protected joinParticipantInvite = (session: UserSession) => {
// 		const inviteReq: RequestDTO = super.joinParticipantInvite(session);
// 		inviteReq.headers["P-Mav-DataChannel"] = 1;
// 		return inviteReq;
// 	};
//
// 	protected joinParticipantReInvite = (session: UserSession) => {
// 		const inviteReq: RequestDTO = super.joinParticipantReInvite(session);
// 		inviteReq.headers["P-Mav-DataChannel"] = 1;
// 		return inviteReq;
// 	};
// }

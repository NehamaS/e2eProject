import { CaseType, RoomType, SipMethod, SDPCaseType } from "./factory";
import { ControlSession, Session, UserSession } from "../sip/dto/controlSession";
import { rstring, strToRoomType, strToDeviceType } from "../utils";
import { MsmlFactory, MsmlMsgType } from "./msml.factory";
import { MsmlType } from "./msml/msml.message";
import {
	METHOD_ACK,
	METHOD_BYE,
	METHOD_INFO,
	METHOD_INVITE,
	METHOD_PRACK,
	METHOD_UPDATE,
} from "./audio.message.factory";
import { AckRequestDTO } from "../sip/dto/ackDTO";
import { Attributes, ROOM_TYPE_SCRSH, ROOM_TYPE_WB } from "../constants";
import { BaseFactory } from "./base.factory";
import { Contact, RequestDTO } from "../sip/dto/infoDTO";
import { LOGGER } from "../logger.service";

export const CONTENT_TYPE_MSML_XML = "application/msml+xml";
export const CONTENT_TYPE_APP_JSON = "application/json";

export const DIALOG_TYPE_UNDEFINED = 0;
const DIALOG_TYPE_AV = 1;
const DIALOG_TYPE_SCRSH = 2;
const DIALOG_TYPE_WB = 3;
export const DIALOG_TYPE_PRACK = 8;
export const DIALOG_TYPE_DTMF = 7;

export abstract class BaseMessageFactory extends BaseFactory<SipMethod, RequestDTO> {
	protected msmlFactory: MsmlFactory;
	protected type: RoomType = RoomType.AUDIO_VIDEO;
	protected mediaType = "";
	protected caseType?: CaseType | string;

	constructor() {
		super();
		this.msmlFactory = new MsmlFactory();
	}

	public abstract message(type: SipMethod, session: ControlSession, roomType?: RoomType): RequestDTO;

	protected createRoomInfo(session: ControlSession): RequestDTO {
		const infoReq: RequestDTO = <RequestDTO>{
			method: METHOD_INFO,
			uri: session.destContact[0].uri(session.tls),
			version: "2.0",
			headers: {
				to: this.contact(session.tls, session.to, true),
				from: this.contact(session.tls, session.from, true),
				"call-id": session.callId,
				"P-Meeting-Id": session.meetingId || rstring(),
				cseq: { method: METHOD_INFO, seq: session.cseq.seq },
				contact: [this.contact(session.tls, session.from)],
				via: [],
				"Content-Type": CONTENT_TYPE_MSML_XML,
			},
			content: this.msmlFactory.message(
				<MsmlMsgType>{
					msgType: MsmlType.CREATE_CONF,
					roomType: this.type,
				},
				session
			),
		};
		return infoReq;
	}

	protected createRoomInvite(session: ControlSession): RequestDTO {
		const inviteReq: RequestDTO = {
			method: METHOD_INVITE,
			uri: this.contact(session.tls, session.to).uri,
			version: "2.0",
			headers: {
				to: this.contact(session.tls, session.to),
				from: this.contact(session.tls, session.from, true),
				"call-id": session.callId || rstring(),
				cseq: { method: session.cseq.method, seq: session.cseq.seq },
				"P-Meeting-Id": session.meetingId || rstring(),
				"P-Dialogue-Type": this.dialogType(session.roomType),
				//"Accept-Contact": `*;${this.mediaType}`,
				"P-Meeting-Session-ID": session.pMeetingSessionID,
				"X-DeviceId": session.xDeviceID, //@TODO Verify whether it's should P-Device-ID
				contact: [this.contact(session.tls, session.from)],
				via: new Array<Contact>(),
			},
		};
		return inviteReq;
	}

	public dialogType(roomType: string) {
		let dialogueType = -1;
		switch (roomType) {
			case ROOM_TYPE_SCRSH:
				dialogueType = DIALOG_TYPE_SCRSH;
				break;
			//			case ROOM_TYPE_WB:
			// case ROOM_TYPE_DATA:
			// 	dialogueType = DIALOG_TYPE_WB;
			// 	break;
			/*case ROOM_TYPE_AUDIO, ROOM_TYPE_VIDEO*/
			default:
				dialogueType = DIALOG_TYPE_AV;
		}

		return dialogueType;
	}

	protected ack(session: ControlSession | UserSession): any {
		const ackReq: AckRequestDTO = {
			method: METHOD_ACK,
			uri: session.destContact[0].uri(session.tls),
			headers: {
				to: this.contact(session.tls, session.to, true),
				from: this.contact(session.tls, session.from, true),
				"call-id": session.callId,
				"P-Meeting-Id": session.meetingId || rstring(),
				cseq: { method: METHOD_ACK, seq: session.cseq.seq },
				contact: [{ uri: this.contact(session.tls, session.from).uri }],
				via: session.status == 200 ? new Array<Contact>() : session.via,
			},
		};
		return ackReq;
	}

	protected prack(session: ControlSession | UserSession): any {
		const prackReq: AckRequestDTO = {
			method: METHOD_PRACK,
			uri: session.destContact[0].uri(session.tls),
			headers: {
				to: this.contact(session.tls, session.to, true),
				from: this.contact(session.tls, session.from, true),
				"call-id": session.callId,
				"P-Meeting-Id": session.meetingId || rstring(),
				cseq: { method: METHOD_PRACK, seq: session.cseq.seq },
				RAck: "1 1 INVITE",
				contact: [{ uri: this.contact(session.tls, session.from).uri }],
				via: session.status == 200 ? new Array<Contact>() : session.via,
			},
		};
		return prackReq;
	}

	protected joinParticipantInvite(session: UserSession): RequestDTO {
		const inviteReq: RequestDTO = {
			method: METHOD_INVITE,
			uri: this.contact(session.tls, session.to).uri,
			version: "2.0",
			headers: {
				to: this.contact(session.tls, session.to),
				from: this.contact(session.tls, session.from, true),
				"call-id": rstring(),
				cseq: { method: METHOD_INVITE, seq: 1 },
				"P-Meeting-Id": session.meetingId || rstring(),
				"P-Dialogue-Type": this.dialogType(session.roomType),
				"p-devicetype": strToDeviceType(session.deviceType),
				"X-Caller-Id": session.callerId,
				"Content-Type": "application/sdp",
				//	"Accept-Contact": `*;${this.mediaType}`,
				"P-Meeting-Session-ID": session.pMeetingSessionID,
				"X-Displayname": session.displayName,
				"X-DeviceId": session.xDeviceID, //@TODO Verify whether it's should P-Device-ID
				contact: [{ uri: this.contact(session.tls, session.from).uri }],
				via: new Array<Contact>(),
			},
			content: session.sdp,
		};
		return inviteReq;
	}

	protected joinParticipantReInvite(session: UserSession): RequestDTO {
		const inviteReq: RequestDTO = {
			method: METHOD_INVITE,
			uri: this.contact(session.tls, session.to).uri,
			version: "2.0",
			headers: {
				to: this.contact(session.tls, session.to, true),
				from: this.contact(session.tls, session.from, true),
				"call-id": session.callId,
				cseq: { method: METHOD_INVITE, seq: session.cseq.seq },
				"P-Meeting-Id": session.meetingId || rstring(),
				"P-Dialogue-Type": this.dialogType(session.roomType),
				"p-devicetype": strToDeviceType(session.deviceType),
				"X-Caller-Id": session.callerId,
				"Content-Type": "application/sdp",
				//"Accept-Contact": `*;${this.mediaType}`,
				"P-Meeting-Session-ID": session.pMeetingSessionID,
				"X-Displayname": session.displayName,
				"X-DeviceId": session.xDeviceID, //@TODO Verify whether it's should P-Device-ID
				contact: [{ uri: this.contact(session.tls, session.from).uri }],
				via: new Array<Contact>(),
			},
			content: session.sdp,
		};
		return inviteReq;
	}

	protected updateParticipant(session: UserSession): RequestDTO {
		const inviteReq: RequestDTO = {
			method: METHOD_UPDATE,
			uri: this.contact(session.tls, session.to).uri,
			version: "2.0",
			headers: {
				to: this.contact(session.tls, session.to, true),
				from: this.contact(session.tls, session.from, true),
				"call-id": session.callId,
				cseq: { method: METHOD_UPDATE, seq: session.cseq.seq },
				"P-Meeting-Id": session.meetingId || rstring(),
				"P-Dialogue-Type": this.dialogType(session.roomType),
				"p-devicetype": strToDeviceType(session.deviceType),
				"X-Caller-Id": session.callerId,
				"Content-Type": "application/sdp",
				//"Accept-Contact": `*;${this.mediaType}`,
				contact: [{ uri: this.contact(session.tls, session.from).uri }],
				via: new Array<Contact>(),
			},
			content: session.sdp,
		};
		return inviteReq;
	}

	protected joinParticipantInfo(session: UserSession): RequestDTO {
		const infoReq: RequestDTO = {
			method: METHOD_INFO,
			uri: session.destContact[0].uri(session.tls),
			version: "2.0",
			headers: {
				to: this.contact(session.tls, session.room.to ? session.room.to : session.to, true),
				from: this.contact(session.tls, session.room.from ? session.room.from : session.from, true),
				"call-id": session.room.callId ? session.room.callId : session.callId,
				"P-Meeting-Id": session.meetingId || rstring(),
				cseq: { method: METHOD_INFO, seq: session.roomCseq.seq ? session.roomCseq.seq : session.cseq.seq },
				contact: [this.contact(session.tls, session.room.from ? session.room.from : session.from)],
				via: new Array<Contact>(),
				"Content-Type": CONTENT_TYPE_MSML_XML,
			},
			content: this.msmlFactory.message(
				<MsmlMsgType>{
					msgType: MsmlType.JOIN,
					roomType: this.type,
				},
				session
			),
		};
		return infoReq;
	}

	protected joinParticipantInfoDialInUser(session: UserSession): RequestDTO {
		const infoReq: RequestDTO = {
			method: METHOD_INFO,
			uri: session.destContact[0].uri(session.tls),
			version: "2.0",
			headers: {
				to: this.contact(session.tls, session.room.to ? session.room.to : session.to, true),
				from: this.contact(session.tls, session.room.from ? session.room.from : session.from, true),
				"call-id": session.room.callId ? session.room.callId : session.callId,
				"P-Meeting-Id": session.meetingId || rstring(),
				cseq: { method: METHOD_INFO, seq: session.roomCseq.seq ? session.roomCseq.seq : session.cseq.seq },
				contact: [this.contact(session.tls, session.room.from ? session.room.from : session.from)],
				via: new Array<Contact>(),
				"Content-Type": CONTENT_TYPE_MSML_XML,
			},
			content: this.msmlFactory.message(
				<MsmlMsgType>{
					msgType: MsmlType.DIAL_IN,
					roomType: this.type,
				},
				session
			),
		};
		return infoReq;
	}

	protected recorderInfo(session: ControlSession | UserSession): RequestDTO {
		const infoReq: RequestDTO = {
			method: METHOD_INFO,
			uri: session.destContact[0].uri(session.tls),
			version: "2.0",
			headers: {
				to: this.contact(session.tls, session.room.to ? session.room.to : session.to, true),
				from: this.contact(session.tls, session.room.from ? session.room.from : session.from, true),
				"call-id": session.callId,
				"P-Meeting-Id": session.meetingId || rstring(),
				cseq: { method: METHOD_INFO, seq: session.roomCseq.seq ? session.roomCseq.seq : ++session.cseq.seq },
				contact: [this.contact(session.tls, session.from)],
				via: new Array<Contact>(),
				"Content-Type": CONTENT_TYPE_MSML_XML,
			},
			content: this.msmlFactory.message(
				<MsmlMsgType>{
					msgType: MsmlType.RECORDER,
					roomType: this.type,
				},
				session
			),
		};
		return infoReq;
	}

	protected destroyRoomInfo(session: ControlSession | UserSession): RequestDTO {
		const infoReq: RequestDTO = {
			method: METHOD_INFO,
			uri: session.destContact[0].uri(session.tls),
			headers: {
				to: this.contact(session.tls, session.to, true),
				from: this.contact(session.tls, session.from, true),
				"call-id": session.callId,
				cseq: { method: METHOD_INFO, seq: session.cseq.seq },
				"P-Meeting-Id": session.meetingId || rstring(),
				contact: [this.contact(session.tls, session.from)],
				via: new Array<Contact>(),
				"Content-Type": CONTENT_TYPE_MSML_XML,
			},
			content: this.msmlFactory.message(
				<MsmlMsgType>{
					msgType: MsmlType.DESTROY_CONF,
					roomType: this.type,
				},
				session
			),
		};
		return infoReq;
	}

	protected destroyRoomBye(session: ControlSession | UserSession): RequestDTO {
		const byeReq: RequestDTO = {
			method: METHOD_BYE,
			uri: session.destContact[0].uri(session.tls),
			headers: {
				to: this.contact(session.tls, session.to, true),
				from: this.contact(session.tls, session.from, true),
				"call-id": session.callId,
				cseq: { method: METHOD_BYE, seq: session.cseq.seq },
				"P-Meeting-Id": session.meetingId || rstring(),
				contact: [this.contact(session.tls, session.from)],
				via: new Array<Contact>(),
			},
		};
		return byeReq;
	}

	protected leaveParticipantInfo(session: UserSession): RequestDTO {
		const infoReq: RequestDTO = {
			method: METHOD_INFO,
			uri: session.destContact[0].uri(session.tls),
			headers: {
				to: this.contact(session.tls, session.room.to ? session.room.to : session.to, true),
				from: this.contact(session.tls, session.room.from ? session.room.from : session.from, true),
				"call-id": session.room.callId ? session.room.callId : session.callId,
				cseq: { method: METHOD_INFO, seq: session.roomCseq.seq ? session.roomCseq.seq : session.cseq.seq },
				"P-Meeting-Id": session.meetingId || rstring(),
				contact: [this.contact(session.tls, session.room.from ? session.room.from : session.from)],
				via: new Array<Contact>(),
				"Content-Type": CONTENT_TYPE_MSML_XML,
			},
			content: this.msmlFactory.message(
				<MsmlMsgType>{
					msgType: MsmlType.UNJOIN,
					roomType: RoomType.AUDIO_VIDEO,
				},
				session
			),
		};
		return infoReq;
	}

	protected mute = (session: UserSession, msmlType: MsmlType) => {
		const infoReq: RequestDTO = {
			method: METHOD_INFO,
			uri: session.destContact[0].uri(session.tls),
			version: "2.0",
			headers: {
				to: this.contact(session.tls, session.room.to, true),
				from: this.contact(session.tls, session.room.from, true),
				"call-id": session.room.callId,
				"P-Meeting-Id": session.meetingId || rstring(),
				cseq: { method: METHOD_INFO, seq: session.roomCseq.seq },
				contact: [this.contact(session.tls, session.room.from)],
				via: new Array<Contact>(),
				"Content-Type": CONTENT_TYPE_MSML_XML,
			},
			content: this.msmlFactory.message(
				<MsmlMsgType>{
					msgType: msmlType,
					roomType: this.type,
				},
				session
			),
		};
		LOGGER.debug({ action: "mute", info: infoReq });
		return infoReq;
	};

	protected muteAll = (session: UserSession) => {
		const infoReq: RequestDTO = {
			method: METHOD_INFO,
			uri: session.destContact[0].uri(session.tls),
			version: "2.0",
			headers: {
				to: this.contact(session.tls, session.room.to, true),
				from: this.contact(session.tls, session.room.from, true),
				"call-id": session.room.callId,
				"P-Meeting-Id": session.meetingId || rstring(),
				cseq: { method: METHOD_INFO, seq: session.roomCseq.seq },
				contact: [this.contact(session.tls, session.room.from)],
				via: new Array<Contact>(),
				"Content-Type": CONTENT_TYPE_MSML_XML,
			},
			content: this.msmlFactory.message(
				<MsmlMsgType>{
					msgType: MsmlType.MUTEALL,
					roomType: this.type,
				},
				session
			),
		};
		LOGGER.debug({ action: "mute", info: infoReq });
		return infoReq;
	};

	protected leaveparticipantBye(session: UserSession): RequestDTO {
		const byeReq: RequestDTO = {
			method: METHOD_BYE,
			uri: session.destContact[0].uri(session.tls),
			headers: {
				to: this.contact(session.tls, session.to, true),
				from: this.contact(session.tls, session.from, true),
				"call-id": session.callId,
				cseq: { method: METHOD_BYE, seq: session.cseq.seq },
				"P-Meeting-Id": session.meetingId || rstring(),
				contact: [this.contact(session.tls, session.from)],
				via: new Array<Contact>(),
			},
		};
		return byeReq;
	}

	protected modifyStreamInfo = (session: UserSession) => {
		const infoReq: RequestDTO = {
			method: METHOD_INFO,
			uri: session.destContact[0].uri(session.tls),
			version: "2.0",
			headers: {
				to: this.contact(session.tls, session.room.to, true),
				from: this.contact(session.tls, session.from, true),
				"call-id": session.callId,
				"P-Meeting-Id": session.meetingId || rstring(),
				cseq: { method: METHOD_INFO, seq: session.cseq.seq },
				contact: [this.contact(session.tls, session.from)],
				via: new Array<Contact>(),
				"Content-Type": CONTENT_TYPE_MSML_XML,
			},
			content: this.msmlFactory.message(
				<MsmlMsgType>{
					msgType: MsmlType.MODIFY_STREAM,
					roomType: strToRoomType(session.roomType),
					sipAction: session.action,
				},
				session
			),
		};
		return infoReq;
	};

	protected joinParticipantInfoWithWrongMSML(session: UserSession): RequestDTO {
		const infoReq: RequestDTO = {
			method: METHOD_INFO,
			uri: session.destContact[0].uri(session.tls),
			version: "2.0",
			headers: {
				to: this.contact(session.tls, session.room.to, true),
				from: this.contact(session.tls, session.room.from, true),
				"call-id": session.room.callId,
				"P-Meeting-Id": session.meetingId || rstring(),
				cseq: { method: METHOD_INFO, seq: session.roomCseq.seq },
				contact: [this.contact(session.tls, session.room.from)],
				via: new Array<Contact>(),
				"Content-Type": CONTENT_TYPE_MSML_XML,
			},
			content: this.msmlFactory.message(
				<MsmlMsgType>{
					msgType: MsmlType.WRONG_MSML,
					roomType: this.type,
				},
				session
			),
		};
		return infoReq;
	}
}

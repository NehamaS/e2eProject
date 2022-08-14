import { RequestDTO } from "../sip/dto/infoDTO";
import { CaseType, RoomType, SipMethod } from "./factory";
import { BaseMessageFactory, DIALOG_TYPE_DTMF, DIALOG_TYPE_PRACK, DIALOG_TYPE_UNDEFINED } from "./base.message.factory";
import { ControlSession, UserSession } from "../sip/dto/controlSession";
import { Attributes, MEDIA_TYPE_AUDIO } from "../constants";
import * as stepUtils from "../../steps/common.steps.utils";
import { SdpFactory } from "../sip/sdp.factory";
import { MsmlMsgType } from "./msml.factory";
import { MsmlType } from "./msml/msml.message";
import { strToCaseType } from "../utils";
import { PSTN_DEVICE_TYPE } from "../constants";

export class NotStandardMessageFactory extends BaseMessageFactory {
	private sdpFactory: SdpFactory;
	constructor(caseType: CaseType) {
		super();
		this.type = RoomType.AUDIO_VIDEO;
		this.mediaType = MEDIA_TYPE_AUDIO;
		this.caseType = caseType;
		this.sdpFactory = new SdpFactory();
	}

	// return result;

	message(method: SipMethod, session: ControlSession | UserSession): RequestDTO {
		switch (method) {
			case SipMethod.CREATE_ROOM_INFO:
				return this.createRoomInfo(<ControlSession>session);
			case SipMethod.CREATE_ROOM_INVITE:
				return this.createRoomInvite(<ControlSession>session);
			// case SipMethod.ACK:
			// 	return this.ack(<ControlSession | UserSession>session);
			case SipMethod.JOIN_PARTICIPANT_INVITE:
				return this.joinParticipantInvite(<UserSession>session);
			case SipMethod.JOIN_PARTICIPANT_REINVITE:
				return this.joinParticipantReInvite(<UserSession>session);
			case SipMethod.JOIN_PARTICIPANT_INFO:
				return this.joinParticipantInfo(<UserSession>session);
			case SipMethod.DESTROY_ROOM_INFO:
				return this.destroyRoomInfo(session);
			case SipMethod.DESTROY_ROOM_BYE:
				return this.destroyRoomBye(<ControlSession>session);
			case SipMethod.LEAVE_PARTICIPANT_INFO:
				return this.leaveParticipantInfo(<UserSession>session);
			case SipMethod.LEAVE_PARTICIPANT_BYE:
				return this.leaveparticipantBye(<UserSession>session);
			default:
				throw new Error("not supported option");
		}
		// return undefined;
	}

	protected joinParticipantInvite = (session: UserSession) => {
		const inviteReq: RequestDTO = super.joinParticipantInvite(session);

		switch (this.caseType) {
			case CaseType.MISSING_CALLER_ID:
				delete inviteReq.headers[Attributes.X_CALLER_ID];
				break;
			case CaseType.MISSING_MEETING_ID:
				delete inviteReq.headers[Attributes.P_MEETING_ID];
				break;
			case CaseType.NOT_EXIST_MEETING:
				inviteReq.headers[Attributes.P_MEETING_ID] = "9999";
				break;
			case CaseType.AUDIO_WRONG_SDP:
				inviteReq.content =
					"<joinconf><confid>48a3c092-afee-4bd6-bda3-7722f93bde5f</confid><displayname>QW1ub24gVGFtYXI=</displayname></joinconf>\r\n";
				break;
			case CaseType.REINVITE_WITH_UNKNOWN_TO_TAG_AND_CALLID:
				inviteReq.headers.to.params.tag = this.longRstring();
				break;
			case CaseType.DTMF_USER:
				delete inviteReq.headers[Attributes.P_MEETING_ID];
				delete inviteReq.headers[Attributes.P_DEVICETYPE];
				inviteReq.headers[Attributes.P_DIALOG_TYPE] = DIALOG_TYPE_DTMF;
				inviteReq.headers[Attributes.SUPPORTED] = "100rel";
				inviteReq.headers[Attributes.P_EARLY_MEDIA] = "supported";
				inviteReq.headers[Attributes.P_CALL_TYPE] = 1;
				break;
			case CaseType.DIAL_IN:
				delete inviteReq.headers[Attributes.P_DEVICETYPE];
				inviteReq.headers[Attributes.P_DIALOG_TYPE] = DIALOG_TYPE_UNDEFINED;
				inviteReq.headers[Attributes.SUPPORTED] = "100rel";
				inviteReq.headers[Attributes.P_EARLY_MEDIA] = "supported";
				break;
			case CaseType.INVITE_WITHOUT_SDP:
			case CaseType.INVITE_PSTN_ON_HOLD:
				inviteReq.content = null;
				delete inviteReq.headers[Attributes.P_DEVICETYPE];
				inviteReq.headers[Attributes.P_DIALOG_TYPE] = DIALOG_TYPE_UNDEFINED;
				break;
			case CaseType.MRF_USER:
				delete inviteReq.headers[Attributes.P_MEETING_ID];
				inviteReq.headers[Attributes.P_DIALOG_TYPE] = DIALOG_TYPE_PRACK;
				inviteReq.headers[Attributes.SUPPORTED] = "100rel";
				inviteReq.headers[Attributes.P_EARLY_MEDIA] = "supported";
				break;
			case CaseType.WITH_RECORDING_HEADER:
				inviteReq.headers[Attributes.P_CALL_RECORDING] = true;
				break;
			case CaseType.PSTN:
				inviteReq.headers[Attributes.P_CALL_TYPE] = 1;
				break;
		}
		return inviteReq;
	};

	protected joinParticipantReInvite = (session: UserSession) => {
		const inviteReq: RequestDTO = super.joinParticipantReInvite(session);
		switch (strToCaseType(this.caseType)) {
			case CaseType.WITH_RECORDING_HEADER:
				inviteReq.headers[Attributes.P_CALL_RECORDING] = true;
				break;
		}
		return inviteReq;
	};

	protected joinParticipantInfo = (session: UserSession | ControlSession) => {
		let infoReq: RequestDTO = super.joinParticipantInfo(<UserSession>session);
		switch (this.caseType) {
			case CaseType.DIAL_IN:
			case CaseType.MRF_UPDATE:
				infoReq = super.joinParticipantInfoDialInUser(<UserSession>session);
				break;
			case CaseType.DTMF_USER:
				infoReq = super.joinParticipantInfoDialInUser(<UserSession>session);
				delete infoReq.headers[Attributes.P_MEETING_ID];
				break;
			case CaseType.RECORDER:
				if (session.infoType == "ONE_ON_ONE") {
					infoReq = super.recorderInfo(<UserSession>session);
					infoReq.headers[Attributes.P_CALL_RECORDING] = true;
				} else infoReq = super.recorderInfo(<ControlSession>session);
				break;
			case CaseType.AUDIO_WRONG_MSML:
				infoReq = super.joinParticipantInfoWithWrongMSML(<UserSession>session);
				break;
			case CaseType.WITH_RECORDING_HEADER:
				infoReq.headers[Attributes.P_CALL_RECORDING] = true;
				infoReq.content = this.msmlFactory.message(
					<MsmlMsgType>{
						msgType: MsmlType.JOIN_WITHOUT_NAME,
						roomType: this.type,
					},
					session
				);
				break;
		}
		return infoReq;
	};

	protected leaveParticipantInfo = (session: UserSession) => {
		const infoReq: RequestDTO = super.leaveParticipantInfo(<UserSession>session);
		switch (this.caseType) {
			case CaseType.WITH_RECORDING_HEADER:
				infoReq.headers[Attributes.P_CALL_RECORDING] = true;
				break;
		}
		return infoReq;
	};

	protected destroyRoomInfo = (session: ControlSession | UserSession) => {
		const infoReq: RequestDTO = super.destroyRoomInfo(<UserSession>session);
		switch (this.caseType) {
			case CaseType.WITH_RECORDING_HEADER:
				infoReq.headers[Attributes.P_CALL_RECORDING] = true;
				break;
		}
		return infoReq;
	};

	protected destroyRoomBye = (session: ControlSession | UserSession) => {
		const infoReq: RequestDTO = super.destroyRoomBye(<UserSession>session);
		switch (this.caseType) {
			case CaseType.WITH_RECORDING_HEADER:
				infoReq.headers[Attributes.P_CALL_RECORDING] = true;
				break;
		}
		return infoReq;
	};

	protected leaveparticipantBye = (session: UserSession) => {
		const infoReq: RequestDTO = super.leaveparticipantBye(<UserSession>session);
		switch (this.caseType) {
			case CaseType.WITH_RECORDING_HEADER:
				infoReq.headers[Attributes.P_CALL_RECORDING] = true;
				break;
		}
		return infoReq;
	};

	protected createRoomInvite = (session: ControlSession) => {
		const inviteReq: RequestDTO = super.createRoomInvite(session);
		switch (this.caseType) {
			case CaseType.CREATE_ROOM_WITH_SDP:
				const sdp = stepUtils.sdpResolver(RoomType.AUDIO);
				inviteReq.content = this.sdpFactory.sdp(sdp, session);
				break;
			case CaseType.RECORD:
				if (session.caseTypeStatus) {
					inviteReq.headers[Attributes.P_CALL_RECORDING] = true;
				}
				break;
		}
		return inviteReq;
	};

	protected createRoomInfo = (session: ControlSession) => {
		const infoReq: RequestDTO = super.createRoomInfo(<ControlSession>session);
		switch (this.caseType) {
			case CaseType.RECORD:
			case CaseType.WITH_RECORDING_HEADER:
				infoReq.headers[Attributes.P_CALL_RECORDING] = true;
				infoReq.content = this.msmlFactory.message(
					<MsmlMsgType>{
						msgType: MsmlType.CREATE_CONF_WITHOUT_NAME,
						roomType: this.type,
					},
					session
				);
				break;
		}
		return infoReq;
	};

	// protected ack = (session: UserSession | ControlSession) => {
	// 	const ackReq: RequestDTO = super.ack(session);
	// 	switch (this.caseType) {
	// 		case CaseType.INVITE_WITHOUT_SDP:
	// 			let sdp = stepUtils.sdpResolver(RoomType.AUDIO, undefined ,CaseType.INVITE_WITHOUT_SDP );
	// 			ackReq.content = this.sdpFactory.sdp(sdp, session);
	// 			LOGGER.info(`%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%5 ${JSON.stringify(ackReq)}`);
	// 			break;
	// 	}
	// 	return ackReq;
	// };

	public longRstring = () => {
		const random = Math.floor(Math.random() * 1e8).toString();
		return random;
	};
}

import { CaseType, MessageFactory, RoomType, SipMethod } from "../messages/factory";
import { SdpFactory, SdpType } from "./sdp.factory";
import { ControlSession, UserSession } from "./dto/controlSession";
import { RequestDTO, ResponseDTO } from "./dto/infoDTO";
import { BaseSipClient } from "./base.sip.client";
import { validate } from "class-validator";
import { Validator } from "./validators/validator";
import { AbstractRoomFactory } from "../messages/abstract.room.factory";
import { strToRoomType } from "../utils";
import { NotStandardMessageFactory } from "../messages/not.standard.message.factory";
import * as stepUtils from "../../steps/common.steps.utils";
import { LOGGER } from "../logger.service";
import { Attributes, INVITE_WITHOUT_SDP, WITH_RECORDING_HEADER } from "../constants";

const ROOM_TYPE_AUDIO = "audio";
const ROOM_TYPE_VIDEO = "video";
const ROOM_TYPE_SCRSH = "screen-share";
//const ROOM_TYPE_DATA = "data-channel";
const ROOM_TYPE_WB = "white-board";

const DIALOG_TYPE_AV = 1;
const DIALOG_TYPE_SCRSH = 2;
const DIALOG_TYPE_WB = 3;

const MCU_DOMAIN = "mcu.com";

export class McuService {
	private factory: AbstractRoomFactory = new AbstractRoomFactory();
	private sdpFactory: SdpFactory;

	constructor(private client: BaseSipClient, private validator?: Validator) {
		this.sdpFactory = new SdpFactory();
	}

	//@duration
	public async createRoomInvite(session: ControlSession): Promise<ResponseDTO> {
		const typedErrorString = session.caseType as keyof typeof CaseType;
		const errType: CaseType = CaseType[typedErrorString];
		return await this.performAction(
			SipMethod.CREATE_ROOM_INVITE,
			session,
			session.caseType ? new NotStandardMessageFactory(errType) : undefined
		);
	}

	// @duration
	public async Ack(session: ControlSession | UserSession): Promise<void> {
		const msgFactory: MessageFactory<any, any> = this.factory.message(strToRoomType(session.roomType));
		const ackReq: RequestDTO = msgFactory.message(SipMethod.ACK, session);
		switch (session.caseType) {
			case INVITE_WITHOUT_SDP:
				const sdp = stepUtils.sdpResolver(RoomType.AUDIO, undefined, CaseType.INVITE_WITHOUT_SDP);
				ackReq.content = this.sdpFactory.sdp(sdp, session);
				delete ackReq.headers[Attributes.P_MEETING_ID];
				break;
			case WITH_RECORDING_HEADER:
				ackReq.headers[Attributes.P_CALL_RECORDING] = true;
				break;
			default:
				break;
		}
		this.client.send<ResponseDTO>(ackReq);
	}

	//@duration
	public async Prack(session: ControlSession | UserSession): Promise<ResponseDTO> {
		return await this.performAction(SipMethod.PRACK, session);
	}

	//@duration
	public async createRoomInfo(session: ControlSession | UserSession): Promise<ResponseDTO> {
		const typedErrorString = session.caseType as keyof typeof CaseType;
		const errType: CaseType = CaseType[typedErrorString];
		return await this.performAction(
			SipMethod.CREATE_ROOM_INFO,
			session,
			session.caseType ? new NotStandardMessageFactory(errType) : undefined
		);
	}

	//@duration
	public async joinParticipantInvite(session: UserSession, sdp: SdpType = SdpType.VideoSender): Promise<ResponseDTO> {
		session.sdp = this.sdpFactory.sdp(sdp, session);
		const typedErrorString = session.caseType as keyof typeof CaseType;
		const errType: CaseType = CaseType[typedErrorString];
		return await this.performAction(
			SipMethod.JOIN_PARTICIPANT_INVITE,
			session,
			session.caseType ? new NotStandardMessageFactory(errType) : undefined
		);
	}

	//@duration
	public async joinParticipantInfo(session: UserSession): Promise<ResponseDTO> {
		const typedErrorString = session.caseType as keyof typeof CaseType;
		const errType: CaseType = CaseType[typedErrorString];
		return await this.performAction(
			SipMethod.JOIN_PARTICIPANT_INFO,
			session,
			session.caseType ? new NotStandardMessageFactory(errType) : undefined
		);
	}

	//@duration
	public async destroyRoomInfo(session: ControlSession): Promise<ResponseDTO> {
		const typedErrorString = session.caseType as keyof typeof CaseType;
		const errType: CaseType = CaseType[typedErrorString];
		return await this.performAction(
			SipMethod.DESTROY_ROOM_INFO,
			session,
			session.caseType ? new NotStandardMessageFactory(errType) : undefined
		);
	}

	//@duration
	public async destroyRoomBye(session: ControlSession): Promise<ResponseDTO> {
		const typedErrorString = session.caseType as keyof typeof CaseType;
		const errType: CaseType = CaseType[typedErrorString];
		return await this.performAction(
			SipMethod.DESTROY_ROOM_BYE,
			session,
			session.caseType ? new NotStandardMessageFactory(errType) : undefined
		);
	}

	//@duration
	public async leaveParticipantInfo(session: UserSession): Promise<ResponseDTO> {
		const typedErrorString = session.caseType as keyof typeof CaseType;
		const errType: CaseType = CaseType[typedErrorString];
		return await this.performAction(
			SipMethod.LEAVE_PARTICIPANT_INFO,
			session,
			session.caseType ? new NotStandardMessageFactory(errType) : undefined
		);
	}

	public async mute(session: UserSession): Promise<ResponseDTO> {
		return await this.performAction(SipMethod.MUTE, session);
	}

	public async joinParticipantReInvite(
		session: UserSession,
		sdp: SdpType = SdpType.VideoSender
	): Promise<ResponseDTO> {
		session.sdp = this.sdpFactory.sdp(sdp, session);
		return await this.performAction(
			SipMethod.JOIN_PARTICIPANT_REINVITE,
			session,
			session.caseType ? new NotStandardMessageFactory(session.caseType) : undefined
		);
	}

	public async updateParticipant(session: UserSession, sdp: SdpType = SdpType.mrf): Promise<ResponseDTO> {
		session.sdp = this.sdpFactory.sdp(sdp, session);
		return await this.performAction(SipMethod.UPDATE, session);
	}

	public async muteAll(session: UserSession): Promise<ResponseDTO> {
		return await this.performAction(SipMethod.MUTEALL, session);
	}

	//@duration
	public async leaveParticipantBye(session: UserSession): Promise<ResponseDTO> {
		const typedErrorString = session.caseType as keyof typeof CaseType;
		const errType: CaseType = CaseType[typedErrorString];
		return await this.performAction(
			SipMethod.LEAVE_PARTICIPANT_BYE,
			session,
			session.caseType ? new NotStandardMessageFactory(errType) : undefined
		);
	}

	public async modifyStream(session: UserSession): Promise<ResponseDTO> {
		return await this.performAction(SipMethod.MODIFY_STREAM_INFO, session);
	}

	public async options(session: ControlSession): Promise<ResponseDTO> {
		const msgFactory: MessageFactory<any, any> = this.factory.message(<RoomType>-1);
		const request: RequestDTO = msgFactory.message(SipMethod.OPTIONS, <any>session);
		const response: ResponseDTO = await this.client.send<ResponseDTO>(request);
		return response;
	}

	public async hold(session: UserSession): Promise<ResponseDTO> {
		return await this.performAction(SipMethod.HOLD, session);
	}

	private async performAction(
		action: SipMethod,
		session: ControlSession | UserSession,
		msgFactory?: MessageFactory<any, any>
	): Promise<ResponseDTO> {
		await validate(session);
		const roomType: RoomType = strToRoomType(session.roomType);
		const factory: MessageFactory<any, any> = msgFactory ? msgFactory : this.factory.message(roomType);
		const request: RequestDTO = factory.message(action, <any>session, roomType);
		const response: ResponseDTO = await this.client.send<ResponseDTO>(request);
		if (this.validator) {
			if (Object.getOwnPropertyNames(this.validator).length > 0) {
				this.validator.validate(request, response, session);
			} else {
				LOGGER.warn({ action: "cannot perform validations..." });
			}
		}
		return response;
	}
}

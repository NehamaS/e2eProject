import { Context } from "../../context";
import { ControlSession, KafkaMessageParams, UserSession } from "../dto/controlSession";
import { KafkaEventType } from "../../../common/messages/factory";
import * as utils from "../../utils";
import { strToKafkaEvent, strToKafkaRoomType } from "../../utils";
import { LOGGER } from "../../logger.service";

export class ValidateKafka {
	public async buildKafkaMessage(
		session: ControlSession | UserSession,
		eventName: string,
		context: Context
	): Promise<KafkaMessageParams | undefined> {
		try {
			const kafkaMessageParams: KafkaMessageParams = {
				eventName: eventName,
				recordType: "CONF",
				meetingId: session.meetingId,
				sessionId: session.pMeetingSessionID,
				roomId: context.getRoomSession(utils.strToRoomType(session.roomType))?.to.params.tag, //to tag of Create room mandatory in 200 OK
				roomType: strToKafkaRoomType(session.roomType),
				responseStatusCode: this.statusCodeResolving(session, strToKafkaEvent(eventName)),
				responseStatusDescription: this.statusDescriptionResolving(session, strToKafkaEvent(eventName)),
				viaBranch: this.viaBranchResolving(session, strToKafkaEvent(eventName)),
				eventTime: "00:00",
				nodeId: "node1",
				mcuVersion: "1.0",
			};
			switch (strToKafkaEvent(eventName)) {
				case KafkaEventType.PARTICIPATE_REQUEST:
				case KafkaEventType.CAMERA_ON:
				case KafkaEventType.CAMERA_OFF:
				case KafkaEventType.SS_STARTS:
					kafkaMessageParams.callId = session.callId;
					kafkaMessageParams.userId = session.xCallerID;
					kafkaMessageParams.deviceId = session.xDeviceID;
					kafkaMessageParams.connId = session.to.params.tag;
					break;
				case KafkaEventType.JOIN_PARTICIPANT:
				case KafkaEventType.UNJOIN_PARTICIPANT:
				case KafkaEventType.SS_ENDS:
				case KafkaEventType.UNMUTE_PARTICIPANT:
				case KafkaEventType.MUTE_PARTICIPANT:
					kafkaMessageParams.callId = context.getRoomSession(utils.strToRoomType(session.roomType))?.callId;
					kafkaMessageParams.userId = session.xCallerID;
					kafkaMessageParams.connId = session.to.params.tag;
					break;
				case KafkaEventType.CREATE_CONF:
				case KafkaEventType.DESTROY_CONF:
					kafkaMessageParams.callId = context.getRoomSession(utils.strToRoomType(session.roomType))?.callId;
					break;
			}
			return kafkaMessageParams;
		} catch (e) {
			LOGGER.error({ test: context.currentTest, action: "validateKafka", data: e });
		}
	}

	public async validateKafka(
		session: ControlSession | UserSession,
		eventName: string,
		originKafkaMessage: KafkaMessageParams,
		context: Context
	): Promise<void> {
		try {
			const kafkaMessageParams: KafkaMessageParams = {
				eventName: eventName,
				recordType: "CONF",
				meetingId: session.meetingId,
				sessionId: session.pMeetingSessionID,
				roomId: context.getRoomSession(utils.strToRoomType(session.roomType))?.to.params.tag, //to tag of Create room mandatory in 200 OK
				roomType: strToKafkaRoomType(session.roomType),
				responseStatusCode: this.statusCodeResolving(session, strToKafkaEvent(eventName)),
				responseStatusDescription: this.statusDescriptionResolving(session, strToKafkaEvent(eventName)),
				viaBranch: this.viaBranchResolving(session, strToKafkaEvent(eventName)),
				eventTime: "00:00",
				nodeId: "node1",
				mcuVersion: "1.0",
			};
			switch (strToKafkaEvent(eventName)) {
				case KafkaEventType.PARTICIPATE_REQUEST:
				case KafkaEventType.CAMERA_ON:
				case KafkaEventType.CAMERA_OFF:
				case KafkaEventType.SS_STARTS:
					kafkaMessageParams.callId = session.callId;
					kafkaMessageParams.userId = session.xCallerID;
					kafkaMessageParams.deviceId = session.xDeviceID;
					kafkaMessageParams.connId = session.to.params.tag;
					break;
				case KafkaEventType.JOIN_PARTICIPANT:
				case KafkaEventType.UNMUTE_PARTICIPANT:
				case KafkaEventType.MUTE_PARTICIPANT:
				case KafkaEventType.UNJOIN_PARTICIPANT:
				case KafkaEventType.SS_ENDS:
					kafkaMessageParams.callId = context.getRoomSession(utils.strToRoomType(session.roomType))?.callId;
					kafkaMessageParams.userId = session.xCallerID;
					kafkaMessageParams.connId = session.to.params.tag;
					break;
				case KafkaEventType.CREATE_CONF:
				case KafkaEventType.DESTROY_CONF:
					kafkaMessageParams.callId = context.getRoomSession(utils.strToRoomType(session.roomType))?.callId;
					break;
			}
			await this.ValidateEvent(session, eventName, originKafkaMessage, kafkaMessageParams);
		} catch (e) {
			LOGGER.error({ test: context.currentTest, action: context.currentTest, err: e.message });
			console.assert(false, `[${context.currentTest}] validateKafka, error: ${e.message}`);
			expect(e).handleException();
		}
	}

	public statusCodeResolving(session: ControlSession | UserSession, kafkaEventType: KafkaEventType): number {
		switch (kafkaEventType) {
			case KafkaEventType.PARTICIPATE_REQUEST:
			case KafkaEventType.CREATE_CONF:
			case KafkaEventType.CAMERA_ON:
			case KafkaEventType.CAMERA_OFF:
			case KafkaEventType.SS_STARTS:
				return Number(session.createResponses.Invite.status);
			case KafkaEventType.JOIN_PARTICIPANT:
			case KafkaEventType.UNMUTE_PARTICIPANT:
			case KafkaEventType.MUTE_PARTICIPANT:
				return Number(session.createResponses.Info.status);
			case KafkaEventType.UNJOIN_PARTICIPANT:
			case KafkaEventType.SS_ENDS:
			case KafkaEventType.DESTROY_CONF:
				return Number(session.destroyResponses.Info.status);
			default:
				return Number(session.createResponses.Invite.status);
		}
	}

	public viaBranchResolving(session: ControlSession | UserSession, kafkaEventType: KafkaEventType): string {
		switch (kafkaEventType) {
			case KafkaEventType.CREATE_CONF:
			case KafkaEventType.PARTICIPATE_REQUEST:
			case KafkaEventType.CAMERA_ON:
			case KafkaEventType.CAMERA_OFF:
			case KafkaEventType.SS_STARTS:
				return session.createResponses.Invite.headers.via[0].params.branch;
			case KafkaEventType.JOIN_PARTICIPANT:
			case KafkaEventType.UNMUTE_PARTICIPANT:
			case KafkaEventType.MUTE_PARTICIPANT:
				return session.createResponses.Info.headers.via[0].params.branch;
			case KafkaEventType.UNJOIN_PARTICIPANT:
			case KafkaEventType.SS_ENDS:
			case KafkaEventType.DESTROY_CONF:
				return session.destroyResponses.Info.headers.via[0].params.branch;
			default:
				return session.createResponses.Invite.headers.via[0].params.branch;
		}
	}

	public statusDescriptionResolving(session: ControlSession | UserSession, kafkaEventType: KafkaEventType): string {
		switch (kafkaEventType) {
			case KafkaEventType.CREATE_CONF:
			case KafkaEventType.PARTICIPATE_REQUEST:
			case KafkaEventType.CAMERA_ON:
			case KafkaEventType.CAMERA_OFF:
			case KafkaEventType.SS_STARTS:
				return session.createResponses.Invite.reason;
			case KafkaEventType.JOIN_PARTICIPANT:
			case KafkaEventType.UNMUTE_PARTICIPANT:
			case KafkaEventType.MUTE_PARTICIPANT:
				return session.createResponses.Info.reason;
			case KafkaEventType.UNJOIN_PARTICIPANT:
			case KafkaEventType.SS_ENDS:
			case KafkaEventType.DESTROY_CONF:
				return session.destroyResponses.Info.reason;
			default:
				return session.createResponses.Invite.reason;
		}
	}

	public descriptionError(kafkaAttributeMessage: string, user: string, eventName: string): string {
		return `${kafkaAttributeMessage} isn't correct in kafka message event ${eventName} user ${user}`;
	}

	public async ValidateEvent(
		session: ControlSession | UserSession,
		eventName: string,
		originKafkaMessage: KafkaMessageParams,
		kafkaMessageParams: KafkaMessageParams
	): Promise<void> {
		let msg: string;
		expect(originKafkaMessage.eventName, this.descriptionError("eventName", session.from.user, eventName)).toEqual(
			kafkaMessageParams.eventName
		);
		expect(
			originKafkaMessage.recordType,
			this.descriptionError("recordType", session.from.user, eventName)
		).toEqual(kafkaMessageParams.recordType);
		expect(originKafkaMessage.meetingId, this.descriptionError("meetingId", session.from.user, eventName)).toEqual(
			kafkaMessageParams.meetingId
		);
		expect(originKafkaMessage.roomId, this.descriptionError("roomId", session.from.user, eventName)).toEqual(
			kafkaMessageParams.roomId
		);
		expect(originKafkaMessage.roomType, this.descriptionError("roomType", session.from.user, eventName)).toEqual(
			kafkaMessageParams.roomType
		);
		expect(
			originKafkaMessage.responseStatusCode,
			this.descriptionError("responseStatusCode", session.from.user, eventName)
		).toEqual(kafkaMessageParams.responseStatusCode);
		expect(
			originKafkaMessage.responseStatusDescription,
			this.descriptionError("responseStatusDescription", session.from.user, eventName)
		).toEqual(kafkaMessageParams.responseStatusDescription);
		expect(originKafkaMessage.callId, this.descriptionError("callId", session.from.user, eventName)).toEqual(
			kafkaMessageParams.callId
		);
		expect(originKafkaMessage.viaBranch, this.descriptionError("viaBranch", session.from.user, eventName)).toEqual(
			kafkaMessageParams.viaBranch
		);
		expect(originKafkaMessage.eventTime, this.descriptionError("eventTime", session.from.user, eventName)).toEqual(
			expect.any(String)
		);
		expect(originKafkaMessage.nodeId, this.descriptionError("nodeId", session.from.user, eventName)).toEqual(
			expect.any(String)
		);
		expect(
			originKafkaMessage.mcuVersion,
			this.descriptionError("mcuVersion", session.from.user, eventName)
		).toEqual(expect.any(String));
		switch (strToKafkaEvent(eventName)) {
			case KafkaEventType.PARTICIPATE_REQUEST:
			case KafkaEventType.CAMERA_ON:
			case KafkaEventType.CAMERA_OFF:
			case KafkaEventType.SS_STARTS:
				expect(
					originKafkaMessage.userId,
					this.descriptionError("userId", session.from.user, eventName)
				).toEqual(kafkaMessageParams.userId);
				expect(
					originKafkaMessage.deviceId,
					this.descriptionError("deviceId", session.from.user, eventName)
				).toEqual(kafkaMessageParams.deviceId);
				expect(
					originKafkaMessage.connId,
					this.descriptionError("connId", session.from.user, eventName)
				).toEqual(kafkaMessageParams.connId);
				break;
			case KafkaEventType.JOIN_PARTICIPANT:
			case KafkaEventType.UNMUTE_PARTICIPANT:
			case KafkaEventType.MUTE_PARTICIPANT:
			case KafkaEventType.UNJOIN_PARTICIPANT:
			case KafkaEventType.SS_ENDS:
				expect(
					originKafkaMessage.userId,
					this.descriptionError("userId", session.from.user, eventName)
				).toEqual(kafkaMessageParams.userId);
				expect(
					originKafkaMessage.connId,
					this.descriptionError("connId", session.from.user, eventName)
				).toEqual(kafkaMessageParams.connId);
				break;
		}
	}
}

import { Context } from "../../context";
import { NotificationMeta, UserSession } from "../dto/controlSession";
import { RequestDTO } from "../dto/infoDTO";
import {
	Attributes,
	DTMF,
	DTMF_USER,
	EMPTY_ROOM,
	EMPTY_ROOM_REASON,
	MSML_DIALOG_EXIT,
	DTMF_DETECT,
	MOML_EXIT,
	RECORDER,
	USER_INACTIVITY,
	USER_INACTIVITY_REASON,
} from "../../constants";
import * as utils from "../../utils";
import { strToRoomType } from "../../utils";
import { METHOD_BYE, METHOD_INFO } from "../../messages/audio.message.factory";
import { MsmlService } from "../msml.service";
import { LOGGER } from "../../logger.service";

export class ValidateNotify {
	public async validateNotify(notificationData: NotificationMeta, context: Context): Promise<void> {
		try {
			setTimeout(async () => {
				const receivedMessages: Map<string, Array<RequestDTO>> = global[Attributes.RECIEVED_MESSAGES];
				switch (notificationData.sessionType) {
					case USER_INACTIVITY:
						LOGGER.debug({
							test: context.currentTest,
							action: "validateNotify",
							data: `waiting ~ ${notificationData.interval} sec for UserInactivity ${notificationData.method} in room ${notificationData.roomType} for user ${notificationData.user}`,
						});
						await this.UserInactivity(notificationData, receivedMessages, context);
						break;
					case EMPTY_ROOM:
						LOGGER.debug({
							test: context.currentTest,
							action: "validateNotify",
							data: `waiting ~ ${notificationData.interval} sec for EmptyRoom ${notificationData.method} in room ${notificationData.roomType}`,
						});
						await this.EmptyRoom(notificationData, receivedMessages, context);
						break;
					case DTMF:
					case DTMF_USER:
						LOGGER.debug({
							test: context.currentTest,
							action: "validateNotify",
							data: `waiting ~ ${notificationData.interval} sec for DTMF ${notificationData.method} in room ${notificationData.roomType} for user ${notificationData.user}`,
						});
						await this.DTMF(notificationData, receivedMessages, context);
						break;
					case RECORDER:
						LOGGER.debug({
							test: context.currentTest,
							action: "validateNotify",
							data: `waiting ~ ${notificationData.interval} sec for Recorder ${notificationData.method} in room ${notificationData.roomType} for user ${notificationData.user}`,
						});
						await this.Recorder(notificationData, receivedMessages, context);
						break;
					default:
						throw new Error("unsupported!");
				}
			}, notificationData.interval * 1000 + 20);
		} catch (e) {
			LOGGER.error({ test: context.currentTest, action: "validateNotify", data: e });
		}
	}

	public async UserInactivity(notificationData: NotificationMeta, receivedMessages, context): Promise<void> {
		const userId = `${notificationData.user}_${strToRoomType(notificationData.roomType)}`;
		const reason = USER_INACTIVITY_REASON;
		const session = context.userSessions.get(userId);

		if (session && receivedMessages) {
			const request = receivedMessages.get(`${session.callId}_${METHOD_BYE}`)?.pop();
			await new Promise<void>((resolve, reject) => {
				expect(request).toBeDefined();
				if (request) {
					expect(request.headers[Attributes.CALL_ID]).toEqual(session.callId);
					expect(request.method).toEqual(METHOD_BYE);
					expect(request.headers[Attributes.P_REASON].includes(reason)).toBeTruthy();
					return resolve();
				} else {
					const errMsg = `Failed to receive UserInactivity ${notificationData.method} message for user ${notificationData.user}`;
					LOGGER.error({ test: context.currentTest, action: USER_INACTIVITY, err: errMsg });
					reject(new Error(errMsg));
				}
			});
		}
	}

	public async EmptyRoom(notificationData: NotificationMeta, receivedMessages, context): Promise<void> {
		const session = context.roomSessions.get(utils.strToRoomType(notificationData.roomType));
		const reason = EMPTY_ROOM_REASON;

		if (session && receivedMessages) {
			const request = receivedMessages.get(`${session.callId}_${METHOD_BYE}`)?.pop();
			await new Promise<void>((resolve, reject) => {
				expect(request).toBeDefined();
				if (request) {
					expect(request.headers[Attributes.CALL_ID]).toEqual(session.callId);
					expect(request.method).toEqual(METHOD_BYE);
					expect(request.headers[Attributes.P_REASON].includes(reason)).toBeTruthy();
					return resolve();
				} else {
					const errMsg = `Failed to receive EmptyRoom${notificationData.method} message for user ${notificationData.user}`;
					LOGGER.error({ test: context.currentTest, action: EMPTY_ROOM, err: errMsg });
					reject(new Error(errMsg));
				}
			});
		}
	}

	public async DTMF(notificationData: NotificationMeta, receivedMessages, context): Promise<void> {
		const userId = `${notificationData.user}_${strToRoomType(notificationData.roomType)}`;
		const session = context.getRoomSession(strToRoomType(notificationData.roomType))
			? context.getRoomSession(strToRoomType(notificationData.roomType))
			: context.getUserSession(userId);
		if (session && receivedMessages && notificationData) {
			const receivedMessagesArr: any = receivedMessages.get(`${session.callId}_${METHOD_INFO}`);
			const request = receivedMessagesArr[notificationData.messageIndex - 1];
			const msml: MsmlService = new MsmlService();
			const newMSML: any = await msml.xmlString2Object(request?.content);
			expect(request).toBeDefined();
			if (request) {
				expect(request.headers["call-id"]).toEqual(session.callId);
				expect(request.method).toEqual(METHOD_INFO);
				if (notificationData.dtmf.dtmfEnd == MSML_DIALOG_EXIT) {
					expect(newMSML.msml.event[0].$.name).toEqual(notificationData.dtmf.dtmfEnd);
				}
				if (notificationData.dtmf.dtmfEnd == MOML_EXIT || notificationData.dtmf.dtmfEnd == DTMF_DETECT) {
					if (notificationData.play) {
						expect(newMSML.msml.event[0].$.name).toEqual(notificationData.dtmf.dtmfEnd);
					} else expect(newMSML.msml.event[0].value[0]).toEqual(notificationData.dtmf.dtmfEnd);
				}
				if (notificationData.dtmf?.dtmfDigits) {
					expect(newMSML.msml.event[0].value[1]).toEqual(notificationData.dtmf.dtmfDigits);
				}
				if (notificationData.dtmf?.dtmfLen) {
					expect(newMSML.msml.event[0].value[2]).toEqual(notificationData.dtmf.dtmfLen);
				}
				if (notificationData.play?.playEnd) {
					expect(newMSML.msml.event[0].value[1]).toEqual(notificationData.play.playEnd);
				}
				if (notificationData.play?.playAmt) {
					const amt: number = parseInt(notificationData.play.playAmt.slice(1, 5));
					notificationData.play.playAmt.includes("<")
						? expect(parseInt(newMSML.msml.event[0].value[0])).toBeLessThan(amt)
						: expect(newMSML.msml.event[0].value[0]).toEqual(notificationData.play.playAmt);
				}
				if (session.infoType == "PLAY") {
					expect(newMSML.msml.event[0].value[1]).toEqual("[tts]: 407 Failure");
				}
				if (session.infoType == "PLAY_WRONG_FOUND") {
					expect(newMSML.msml.event[0].value[1]).toEqual("[play]: 13 Wave file not valid: error");
				}
				return;
			} else {
				const errMsg = `Failed to receive DTMF ${notificationData.method} message for user ${notificationData.user}`;
				LOGGER.error({ test: context.currentTest, action: "DTMF", err: errMsg });
				throw new Error(errMsg);
			}
		} else {
			const errMsg = `Failed to receive DTMF ${notificationData.method} message for user ${notificationData.user}`;
			LOGGER.error({ test: context.currentTest, action: "DTMF", err: errMsg });
			throw new Error(errMsg);
		}
	}

	public async Recorder(notificationData: NotificationMeta, receivedMessages, context): Promise<void> {
		let newMSML: any;
		const userId = `${notificationData.user}_${strToRoomType(notificationData.roomType)}`;
		const session: UserSession = context.getUserSession(userId);
		if (session && receivedMessages && notificationData) {
			const receivedMessagesArr: any = receivedMessages.get(
				`${session.room.callId ? session.room.callId : session.callId}_${METHOD_INFO}`
			);
			const request = receivedMessagesArr[notificationData.messageIndex - 1];
			const msml: MsmlService = new MsmlService();
			expect(request).toBeDefined();
			// await new Promise<void>((resolve, reject) => {
			if (request) {
				newMSML = await msml.xmlString2Object(request?.content);
				expect(request.headers[Attributes.CALL_ID]).toEqual(
					session.room.callId ? session.room.callId : session.callId
				);
				expect(request.method).toEqual(METHOD_INFO);
				if (
					notificationData.recorderAction.Action == "record" ||
					notificationData.recorderAction.Action == "start"
				) {
					expect(newMSML.msml.event[0].value[0]).toEqual(notificationData.recorderAction.End);
				} else if (notificationData.recorderAction.End == MSML_DIALOG_EXIT) {
					expect(newMSML.msml.event[0].$.name).toEqual(notificationData.recorderAction.End);
				} else {
					expect(newMSML.msml.event[0].value[1]).toEqual(notificationData.recorderAction.End);
				}
				return;
			} else {
				const errMsg = `Failed to receive Recorder ${notificationData.method} message for user ${notificationData.user}`;
				LOGGER.error({ test: context.currentTest, action: "Recorder", err: errMsg });
				throw new Error(errMsg);
			}
		} else {
			const errMsg = `Failed to receive Recorder ${notificationData.method} message for ${notificationData.recorderAction.Action} action for user ${notificationData.user}`;
			LOGGER.error({ test: context.currentTest, action: "Recorder", err: errMsg });
			throw new Error(errMsg);
		}
	}
}

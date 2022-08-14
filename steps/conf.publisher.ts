import { McuService } from "../common/sip/mcu.service";
import { Contact, CSEQ, RequestDTO, ResponseDTO } from "../common/sip/dto/infoDTO";
import { ValidateNotify } from "../common/sip/validators/notify.validator";
import { Context, LoadContext } from "../common/context";
import { KafkaAction } from "../common/kafka";
import {
	ContactDTO,
	ControlSession,
	NotificationMeta,
	Participant,
	KafkaEvent,
	RoomSession,
	UserSession,
	RecorderAction,
	Dtmf,
	Play,
	FailuresCounter,
} from "../common/sip/dto/controlSession";
import { METHOD_BYE, METHOD_INFO, METHOD_INVITE } from "../common/messages/audio.message.factory";
import * as utils from "../common/utils";
import {
	getAddress,
	strToCaseType,
	strToRoomType,
	strToSDPCaseType,
	strToStreamFile,
	strToUserType,
} from "../common/utils";
import { getMeetingId } from "./conf.room";
import { SdpType } from "../common/sip/sdp.factory";
import * as stepUtils from "./common.steps.utils";
import { SipAction } from "../common/sip/sipAction";
import { SdpService } from "../common/sip/sdp/sdp.service";
import { FilesActions } from "../common/sip/filesActions";
import { ValidateStream } from "../common/sip/validators/stream.validator";
import { ValidateRecorder } from "../common/sip/validators/recorder.validator";
import { MsmlService } from "../common/sip/msml.service";
import { CaseType, DeviceType, SDPCaseType, UserType, RoomType } from "../common/messages/factory";
import { SipStream } from "../common/sip/sip.stream";
import {
	AUDIO_WRONG_SDP,
	NOT_SUPPORTED_CODEC_IN_AUDIO_MID,
	MISSING_CALLER_ID,
	NOT_EXIST_MEETING,
	SENDRECV_DIRECTION_IN_VIDEO_RECVONLY_MID,
	ROOM_TYPE_AUDIO,
	MEDIA_DIRECTION_INACTIVE,
	NO_PUBLISHER_IN_SS_SDP,
	AUDIO_WRONG_MSML,
	ONE_MIN,
	START_MISSING_DEST,
	THREE_MIN,
	PlatformType,
	RECORDER,
	MRF_USER,
	INVITE_PSTN_ON_HOLD,
	DIAL_IN,
	DTMF,
	WITH_RECORDING_HEADER,
	USER_INACTIVITY,
	EMPTY_ROOM,
	ROOM_TYPE_VIDEO,
	Attributes,
	MEDIA_DIRECTION_SENDONLY,
	MEDIA_DIRECTION_RECVONLY,
	MEDIA_DIRECTION_SENDRECV,
	DTMF_USER,
	PSTN_DEVICE_TYPE,
} from "../common/constants";
import { editDestContact } from "./common.steps.utils";
import { LOGGER } from "../common/logger.service";

const sdpService: SdpService = new SdpService();
const validateStream = new ValidateStream();
const validateRecorder = new ValidateRecorder();
const validateNotify = new ValidateNotify();

const filesStream = new FilesActions();

const msmlService = new MsmlService();

const kafkaAction = new KafkaAction();

export const inviteParticipantInfo = async (participant: Participant, service: McuService, context: Context) => {
	//const userId = `${participant.Participant}_${strToRoomType(participant.roomType)}`;
	const userId = participant.deviceId
		? `${participant.Participant}_${strToRoomType(participant.roomType)}_${participant.deviceId}`
		: `${participant.Participant}_${strToRoomType(participant.roomType)}`;
	const userSession: UserSession | undefined = context.getUserSession(userId);
	try {
		if (userSession) {
			userSession.roomCseq.method = METHOD_INFO;
			//userSession.roomCseq.seq = ++userSession.roomCseq.seq;
			userSession.roomCseq.seq++;
			userSession.recorderInfoType = participant.recorderInfoType;
			if (context.caseType || participant.caseType) {
				userSession.caseType = participant.caseType ? participant.caseType : context.caseType;
			}
			userSession.recorderFileName = participant.recorderFileName;
			userSession.infoError = participant.infoError;
			userSession.infoType = participant.infoType ? participant.infoType : context.infoType;
			userSession.conf = context.conf;
			const info: ResponseDTO = await service.joinParticipantInfo(userSession);
			LOGGER.info({ test: context.currentTest, action: "after joinParticipantInfo => ", data: info });
			userSession.createResponses.Info = info;
			//const userId = `${participant.Participant}_${strToRoomType(participant.roomType)}`;
			const userId = participant.deviceId
				? `${participant.Participant}_${strToRoomType(participant.roomType)}_${participant.deviceId}`
				: `${participant.Participant}_${strToRoomType(participant.roomType)}`;
			context.setUserSession(userId, userSession);
		} else throw new Error(`User ${userId} not found`);
	} catch (e) {
		if (!context.failureMechanism) {
			LOGGER.error({ test: context.currentTest, action: "############# inviteParticipantInfo", data: e.message });
			console.assert(false, `[${context.currentTest}] joinParticipantInfo, error: ${e.message}`);
			expect(e).handleException();
		} else {
			//const userId = `${participant.Participant}_${strToRoomType(participant.roomType)}`;
			const userId = participant.deviceId
				? `${participant.Participant}_${strToRoomType(participant.roomType)}_${participant.deviceId}`
				: `${participant.Participant}_${strToRoomType(participant.roomType)}`;
			if (!context.failuresCountMap.joinParticipant.get(userId)) {
				context.failuresCountMap.joinParticipant.set(userId, true);
				LOGGER.info({
					test: context.currentTest,
					action: "==--==failure inviteParticipantInfo for user ",
					data: userId,
				});
			}
		}
	}
};

export const basicInviteParticipant = async (
	participant: Participant,
	service: McuService,
	context: Context,
	infoRequestHandler?: any
) => {
	LOGGER.info({ test: context.currentTest, action: "Add participant (basic)", data: participant });

	const control: ControlSession = <ControlSession>context.getRoomSession(utils.strToRoomType(participant.roomType));

	if (process.env.STREAM && process.env.STREAM.toUpperCase() == "TRUE") {
		filesStream.createFolder(`${context.StreamsOutputFilesPath}/${context.meetingId}/${participant.Participant}`);
	}
	const userSession: UserSession = new UserSession();
	userSession.cseq = <CSEQ>{ method: METHOD_INVITE, seq: 1 };
	userSession.env = context.env;
	userSession.from = new ContactDTO();
	userSession.from.user = participant.Participant;
	userSession.from.domain = getAddress();
	userSession.from.port = context.tls ? context.tlsPort : context.localPort;
	userSession.from.params = { tag: utils.rstring() };
	userSession.displayName = userSession.from.user.toUpperCase();
	userSession.to = new ContactDTO();
	userSession.to.user = "janus";
	userSession.to.domain = context.address();
	userSession.to.port = context.port();
	userSession.xDeviceID = participant.deviceId;
	userSession.meetingId = getMeetingId(context, participant.meetingID);
	//if (participant.deviceType == PSTN_DEVICE_TYPE && !(strToRoomType(participant.roomType) == RoomType.DATA_CHANNEL)) {
	if (participant.deviceType == PSTN_DEVICE_TYPE) {
		userSession.caseType = PSTN_DEVICE_TYPE;
	}
	if (control) {
		//Will not be initialzed in cae of "headless" meeting
		userSession.pMeetingSessionID = control.pMeetingSessionID;
	}
	if (context.caseType || participant.caseType) {
		userSession.caseType = context.caseType ? context.caseType : participant.caseType;
	}
	userSession.codecListInput = participant.codecListInput;
	userSession.codecOutPut = participant.codecOutPut;
	userSession.roomType = participant.roomType;
	userSession.userType = participant.userType;
	userSession.SDPcaseType = participant.SDPcaseType;
	userSession.deviceType = participant.deviceType;
	userSession.port = participant.port;
	userSession.infoType = participant.infoType;
	userSession.inviteError = participant.inviteError;
	userSession.srtp = participant.srtp;
	userSession.statusCode = participant.statusCode;
	userSession.StreamDTO.numOfStratMacmesh = 0;
	if (userSession.caseType == "WITH_RECORDING_HEADER" && context.callerId) {
		userSession.callerId = context.callerId;
	} else {
		userSession.callerId = participant.Participant + "@gmail.com";
		context.callerId = userSession.callerId;
	}
	if (control) {
		userSession.roomCseq = control.cseq;
		userSession.room = <RoomSession>{
			id: control.roomId,
			callId: control.callId,
			from: control.from,
			to: control.to,
		};
		userSession.tls = control.tls;
	}

	const sdp: SdpType = stepUtils.sdpResolver(
		strToRoomType(userSession.roomType),
		strToUserType(userSession.userType)
	);
	try {
		const invite: ResponseDTO = await service.joinParticipantInvite(userSession, sdp);
		LOGGER.info({ test: context.currentTest, action: "after joinParticipantInvite =>", data: invite });

		userSession.to.params.tag = invite.headers.to.params.tag;
		(userSession.xCallerID = invite.headers["X-Caller-Id"]), (userSession.cseq.seq = invite.headers.cseq.seq);
		userSession.callId = invite.headers["call-id"];
		userSession.connId = invite.headers.to.params.tag;
		userSession.createResponses.Invite = invite;
		userSession.via = invite.headers.via;
		userSession.status = invite.status;
		editDestContact(userSession, invite.headers.contact[0], context);
		if (
			(sdp == SdpType.VideoSender ||
				(sdp == SdpType.receiver && !userSession.SDPcaseType) ||
				sdp == SdpType.VideoMultiSender ||
				sdp == SdpType.oneAudioMid ||
				sdp == SdpType.pstn ||
				sdp == SdpType.video_sendrecv) &&
			!userSession.inviteError
		) {
			const sdpResponse: any = sdpService.toSDP(invite.content);
			userSession.StreamDTO.remoteIP = sdpResponse.media[0].connection.ip;
			userSession.StreamDTO.assrc_In = sdpResponse.media[0].ssrcs[0].id;

			if (
				sdp != SdpType.pstn &&
				!userSession.caseType &&
				sdp != SdpType.video_sendrecv &&
				sdp != SdpType.oneAudioMid
			) {
				const vssrc_array: string[] = [];
				for (let i = 1; i < 6; i++) {
					vssrc_array.push(sdpResponse.media[i].ssrcs[0].id);
				}
				userSession.StreamDTO.vssrc_In = vssrc_array;
			} else userSession.StreamDTO.vssrc_In = 0;

			userSession.StreamDTO.remotePort = sdpResponse.media[0].port;
		}

		let ack;
		if (userSession.userType == MRF_USER) {
			userSession.statusCode = 200;
			userSession.cseq.seq++;
			ack = await service.Prack(userSession);
			LOGGER.info({ test: context.currentTest, action: "after PRack =>", data: ack });
		} else {
			ack = await service.Ack(userSession);
			LOGGER.info({ test: context.currentTest, action: "after addAck =>", data: ack });
		}

		//const userId = `${participant.Participant}_${strToRoomType(participant.roomType)}`;
		const userId = participant.deviceId
			? `${participant.Participant}_${strToRoomType(participant.roomType)}_${participant.deviceId}`
			: `${participant.Participant}_${strToRoomType(participant.roomType)}`;
		context.setUserSession(userId, userSession);
	} catch (e) {
		if (!context.failureMechanism) {
			LOGGER.error({
				test: context.currentTest,
				action: "############# basicInviteParticipant",
				data: e.message,
			});
			console.assert(false, `[${context.currentTest}] basicInviteParticipant, error: ${e.message}`);
			expect(e).handleException();
		} else {
			//const userId = `${participant.Participant}_${strToRoomType(participant.roomType)}`;
			const userId = participant.deviceId
				? `${participant.Participant}_${strToRoomType(participant.roomType)}_${participant.deviceId}`
				: `${participant.Participant}_${strToRoomType(participant.roomType)}`;
			if (!context.failuresCountMap.joinParticipant.get(userId)) {
				context.failuresCountMap.joinParticipant.set(userId, true);
				LOGGER.info({
					test: context.currentTest,
					action: "==--==failure InviteParticipant for user ",
					data: userId,
				});
			}
		}
	}
};

export const inviteParticipant = async (participant: Participant, service: McuService, context: Context) => {
	await basicInviteParticipant(participant, service, context);
	if (!participant.inviteError) {
		await inviteParticipantInfo(participant, service, context);
	}
};

export const inviteParticipants = (and, service: McuService, context: Context) => {
	and(/add participant:/, async (participantList: Array<Participant>) => {
		await Promise.all(
			participantList.map(async (participant: Participant) => {
				await inviteParticipant(participant, service, context);
			})
		);
	});
};

export const inviteParticipantsWithoutSDP = (and, service: McuService, context: Context) => {
	and(
		/add participant (.*) with meetingID (.*) and roomType (.*) with caseType (.*)/,
		async (Participant, meetingID, roomType, caseType) => {
			const participant: Participant = <Participant>{
				meetingID: meetingID,
				Participant: Participant,
				roomType: roomType,
				caseType: caseType,
			};

			try {
				if (caseType == INVITE_PSTN_ON_HOLD) {
					await basicInviteParticipant(participant, service, context);
				} else {
					await inviteParticipant(participant, service, context);
				}
			} catch (e) {
				LOGGER.error({
					test: context.currentTest,
					action: "############# inviteParticipantsWithoutSDP",
					data: e.message,
				});
				console.assert(false, `[${context.currentTest}] inviteParticipantsWithoutSDP, error: ${e.message}`);
				expect(e).handleException();
			}
		}
	);
};

export const waitForNotify = (and, service: McuService, context: Context) => {
	and(/wait for notify/, async () => {
		LOGGER.debug({ test: context.currentTest, action: "waiting...." });
	});
};

export const inviteParticipantsWithDialogInUser = (and, service: McuService, context: Context) => {
	and(
		/add participant (.*) with meetingID (.*) with caseType (.*) and infoType (.*)/,
		async (Participant, meetingID, caseType, infoType) => {
			const participant: Participant = <Participant>{
				meetingID: meetingID,
				Participant: Participant,
				roomType: ROOM_TYPE_AUDIO,
				caseType: caseType,
				infoType: infoType,
			};
			try {
				await basicInviteParticipant(participant, service, context);
				if (caseType == DIAL_IN) await inviteParticipantInfo(participant, service, context);
			} catch (e) {
				LOGGER.error({
					test: context.currentTest,
					action: "############# inviteParticipantsWithDialogInUser",
					data: e.message,
				});
				console.assert(false, `[${context.currentTest}] inviteParticipantsWithDTMF, error: ${e.message}`);
				expect(e).handleException();
			}
		}
	);
};

export const inviteMRFParticipants = (and, service: McuService, context: Context) => {
	and(
		/add participant (.*) with meetingID (.*) with userType (.*) with statusCode (\d+)/,
		async (Participant, meetingID, userType, statusCode) => {
			const participant: Participant = <Participant>{
				meetingID: meetingID,
				Participant: Participant,
				roomType: ROOM_TYPE_AUDIO,
				userType: userType,
				statusCode: statusCode,
				caseType: userType,
			};

			try {
				await basicInviteParticipant(participant, service, context);
			} catch (e) {
				LOGGER.error({
					test: context.currentTest,
					action: "############# inviteMRFParticipants",
					data: e.message,
				});
				console.assert(false, `[${context.currentTest}] inviteMRFParticipants, error: ${e.message}`);
				expect(e).handleException();
			}
		}
	);
};

export const updateParticipant = (and, service: McuService, context: Context) => {
	and(/update (.*) with userType (.*) with infoType (.*)/, async (Participant, userType, infoType) => {
		const participant: Participant = <Participant>{
			Participant: Participant,
			roomType: ROOM_TYPE_AUDIO,
			userType: userType,
			infoType: infoType,
			caseType: userType,
		};
		//const userId = `${participant.Participant}_${strToRoomType(participant.roomType)}`;
		const userId = participant.deviceId
			? `${participant.Participant}_${strToRoomType(participant.roomType)}_${participant.deviceId}`
			: `${participant.Participant}_${strToRoomType(participant.roomType)}`;
		const userSession: UserSession = <UserSession>context.getUserSession(userId);
		userSession.userType = participant.userType;
		userSession.infoType = participant.infoType;
		userSession.caseType = participant.caseType;
		try {
			userSession.cseq.seq++;
			const update: ResponseDTO = await service.updateParticipant(userSession);
			LOGGER.info({ test: context.currentTest, action: "after update =>", data: update });
			await inviteParticipantInfo(participant, service, context);
		} catch (e) {
			LOGGER.error({ test: context.currentTest, action: "############# updateParticipant", data: e.message });
			console.assert(false, `[${context.currentTest}] updateParticipant, error: ${e.message}`);
			expect(e).handleException();
		}
	});
};

const timeOut = async (delay: number) => {
	await new Promise<void>((resolve) => {
		setTimeout(() => {
			return resolve();
		}, delay * 1000);
	});
};

export const dtmfNotifyInfoValidation = (then, service: McuService, context: Context, isControlSession = true) => {
	then(
		/^validate (.*) is received after (.*) sec for (.*) with messageIndex (.*) and name: (.*)(?: DTMFs: (.*) and (.*) digits)?$/,
		async (
			action: string,
			timeout: string,
			user: string,
			messageIndex: number,
			dtmfEnd: string,
			dtmfDigits?: string,
			dtmfLen?: number
		) => {
			const dtmf: Dtmf = <Dtmf>{
				dtmfEnd: dtmfEnd,
				dtmfLen: dtmfLen,
				dtmfDigits: dtmfDigits,
			};

			setImmediate(async () => {
				const data: NotificationMeta = <NotificationMeta>{
					interval: Number(timeout),
					method: action,
					roomType: ROOM_TYPE_AUDIO,
					user: user,
					sessionType: isControlSession ? DTMF : DTMF_USER,
					dtmf: dtmf,
					messageIndex: messageIndex,
				};

				await validateNotify.validateNotify(data, context);
			});
		}
	);
};

export const dtmfNotifyInfoValidationAMTSupport = (then, service: McuService, context: Context) => {
	then(
		/validate (.*) is received after (.*) sec for (.*) with messageIndex (.*) and name: (.*) play.amt: (.*) and play.end: (.*)/,
		async (
			action: string,
			timeout: string,
			user: string,
			messageIndex: number,
			dtmfEnd: string,
			playAmt?: string,
			playEnd?: string
		) => {
			const play: Play = <Play>{
				playAmt: playAmt,
				playEnd: playEnd,
			};
			const dtmf: Dtmf = <Dtmf>{
				dtmfEnd: dtmfEnd,
			};
			setImmediate(async () => {
				const data: NotificationMeta = <NotificationMeta>{
					interval: Number(timeout),
					method: action,
					roomType: ROOM_TYPE_AUDIO,
					user: user,
					sessionType: DTMF,
					dtmf: dtmf,
					play: play,
					messageIndex: messageIndex,
				};

				await validateNotify.validateNotify(data, context);
			});
		}
	);
};

export const inviteParticipantWithError = (and, service: McuService, context: Context) => {
	and(
		/add participant (.*) with meetingID (.*) and roomType (.*) with error (.*)/,
		async (Participant, meetingID, roomType, caseType) => {
			const participant: Participant = <Participant>{
				meetingID: meetingID,
				Participant: Participant,
				roomType: roomType,
				caseType: caseType,
				inviteError: true,
			};
			await inviteParticipant(participant, service, context);
		}
	);
};

export const inviteParticipantWithUnsupportedCodec = (and, service: McuService, context: Context) => {
	and(
		/add participant (.*) with meetingID (.*) and roomType (.*) with codecListInput (.*)/,
		async (Participant, meetingID, roomType, codecListInput) => {
			const participant: Participant = <Participant>{
				meetingID: meetingID,
				Participant: Participant,
				roomType: roomType,
				codecListInput: codecListInput,
				inviteError: true,
			};
			await inviteParticipant(participant, service, context);
		}
	);
};

export const infoParticipantWithError = (and, service: McuService, context: Context) => {
	and(
		/add participant (.*) with meetingID (.*) and roomType (.*) with error (.*)/,
		async (Participant, meetingID, roomType, caseType) => {
			const participant: Participant = <Participant>{
				meetingID: meetingID,
				Participant: Participant,
				roomType: roomType,
				caseType: caseType,
				infoError: true,
			};
			await inviteParticipant(participant, service, context);
		}
	);
};

export const leaveParticipantInfo = async (
	participant: Participant,
	service: McuService,
	context: Context,
	failed?: string
) => {
	LOGGER.info({ test: context.currentTest, action: "Leave participant (info)", data: participant });

	//const userId = `${participant.Participant}_${strToRoomType(participant.roomType)}`;
	const userId = participant.deviceId
		? `${participant.Participant}_${strToRoomType(participant.roomType)}_${participant.deviceId}`
		: `${participant.Participant}_${strToRoomType(participant.roomType)}`;
	const userSession: UserSession = <UserSession>context.getUserSession(userId);
	if (participant.caseType == WITH_RECORDING_HEADER) userSession.caseType = participant.caseType;

	if (failed) {
		try {
			await leavePaticipantAction(participant, service, context, userSession);
			fail("Any Error wasn't send on notValid leave participant");
		} catch (e) {
			LOGGER.info({
				test: context.currentTest,
				action: "&&&&&&&&&&&&&&&&&&&&&&&& Not valid leave participant",
				data: e.message,
			});
			expect(e.message.includes("503")).toBeTruthy();
		}
	} else {
		try {
			await leavePaticipantAction(participant, service, context, userSession);
		} catch (e) {
			if (!context.failureMechanism) {
				LOGGER.error({
					test: context.currentTest,
					action: "############# leaveParticipantInfo",
					data: e.message,
				});
				console.assert(false, `[${context.currentTest}] leaveParticipant, error: ${e.message}`);
				expect(e).handleException();
			} else {
				if (!context.failuresCountMap.leaveParticipant.get(userId))
					context.failuresCountMap.leaveParticipant.set(userId, true);
				LOGGER.info({
					test: context.currentTest,
					action: "==--==failure leaveParticipantInfo for user ",
					data: userId,
				});
			}
		}
	}
};

export const leavePaticipantAction = async (
	participant: Participant,
	service: McuService,
	context: Context,
	userSession
) => {
	userSession.roomCseq.seq++;
	const info: ResponseDTO = await service.leaveParticipantInfo(userSession);
	LOGGER.info({ test: context.currentTest, action: "after leaveParticipantInfo =>", data: info });

	userSession.destroyResponses.Info = info;

	//const userId = `${participant.Participant}_${strToRoomType(participant.roomType)}`;
	const userId = participant.deviceId
		? `${participant.Participant}_${strToRoomType(participant.roomType)}_${participant.deviceId}`
		: `${participant.Participant}_${strToRoomType(participant.roomType)}`;
	context.setUserSession(userId, userSession);
};

export const leaveParticipantBye = async (participant: Participant, service: McuService, context: Context) => {
	LOGGER.info({ test: context.currentTest, action: "Leave participant (bye)", data: participant });

	//const userId = `${participant.Participant}_${strToRoomType(participant.roomType)}`;
	const userId = participant.deviceId
		? `${participant.Participant}_${strToRoomType(participant.roomType)}_${participant.deviceId}`
		: `${participant.Participant}_${strToRoomType(participant.roomType)}`;
	const userSession: UserSession = <UserSession>context.getUserSession(userId);

	try {
		const bye: ResponseDTO = await service.leaveParticipantBye(userSession);
		LOGGER.info({ test: context.currentTest, action: "after leaveParticipantBye =>", data: bye });

		userSession.destroyResponses.Bye = bye;
		//const userId = `${participant.Participant}_${strToRoomType(participant.roomType)}`;
		const userId = participant.deviceId
			? `${participant.Participant}_${strToRoomType(participant.roomType)}_${participant.deviceId}`
			: `${participant.Participant}_${strToRoomType(participant.roomType)}`;
		context.setUserSession(userId, userSession);
	} catch (e) {
		if (!context.failureMechanism) {
			LOGGER.error({ test: context.currentTest, action: "############# leavePaticipantAction", data: e.message });
			console.assert(false, `[${context.currentTest}] leaveParticipant, error: ${e.message}`);
			expect(e).handleException();
		} else {
			if (!context.failuresCountMap.leaveParticipant.get(userId))
				context.failuresCountMap.leaveParticipant.set(userId, true);
			LOGGER.info({
				test: context.currentTest,
				action: "==--==failure leaveParticipantBye for user ",
				data: userId,
			});
		}
	}
};

export const leaveParticipant = async (
	participant: Participant,
	service: McuService,
	context: Context,
	failed?: string
) => {
	await leaveParticipantInfo(participant, service, context, failed);
	await leaveParticipantBye(participant, service, context);
};

export const recorderNotifyInfoValidationAction = async (
	then,
	service: McuService,
	context: Context,
	data: NotificationMeta
) => {
	try {
		setImmediate(async () => {
			await validateNotify.validateNotify(data, context);
		});
	} catch (e) {
		console.error(context.currentTest, "#############", e.message);
		console.assert(false, `[${context.currentTest}] recorderInfo, error: ${e.message}`);
		expect(e).handleException();
	}
};

export const recorderNotifyInfoValidation = async (then, service: McuService, context: Context) => {
	then(
		/^validate NOTIFY (.*) for (.*) (.*) is received after (.*) sec for (.*) with messageIndex (.*) and (.*)End: (.*)(?: and valid transferLocation)?$/,
		async (
			status: string,
			method: string,
			action1: string,
			timeout: number,
			user: string,
			messageIndex: number,
			action2: string,
			End: string
		) => {
			const recorderAction: RecorderAction = <RecorderAction>{
				End: End,
				Action: action2,
			};

			const data: NotificationMeta = <NotificationMeta>{
				interval: timeout,
				method: method,
				roomType: ROOM_TYPE_AUDIO,
				user: user,
				sessionType: RECORDER,
				recorderAction: recorderAction,
				messageIndex: messageIndex,
			};
			await recorderNotifyInfoValidationAction(then, service, context, data);
		}
	);
};

export const bulkRecorderNotifyInfoValidation = (then, service: McuService, loadContext: LoadContext) => {
	then(
		/validate NOTIFY (.*) for (.*) (.*) is received after (.*) sec for user0 in all rooms With (.*)End: (.*)/,
		async (status: string, method: string, action1: string, timeout: number, action2: string, End: string) => {
			const recorderAction: RecorderAction = <RecorderAction>{
				End: End,
				Action: action2,
			};

			const recorderInfoList: Array<Promise<void>> = new Array<Promise<void>>();
			for (let roomID = 1; roomID < Number(loadContext.loadRooms) + 1; roomID++) {
				const roomIDName = loadContext.roomPrefix + roomID;

				const data: NotificationMeta = <NotificationMeta>{
					interval: timeout,
					method: method,
					roomType: ROOM_TYPE_AUDIO,
					user: `user_${roomIDName}_0`,
					sessionType: RECORDER,
					recorderAction: recorderAction,
				};
				recorderInfoList.push(
					recorderNotifyInfoValidationAction(then, service, loadContext.MultiContext[roomID], data)
				);
			}
			await Promise.all(recorderInfoList);
		}
	);
};

export const noRTPUserNotifyInfoValidation = (when, service: McuService, context: Context) => {
	when(/validate participant (.*?) (.*?) in (.*?) room$/, async (user: string, action: string, roomType: string) => {
		setImmediate(async () => {
			LOGGER.info({ test: context.currentTest, action: `Stating timer ${ONE_MIN} min... ` });
			const data: NotificationMeta = <NotificationMeta>{
				interval: ONE_MIN,
				method: action,
				roomType: roomType,
				user: user,
				sessionType: USER_INACTIVITY,
			};
			await validateNotify.validateNotify(data, context);
		});
	});
};

export const noRTPRoomNotifyInfoValidation = (when, service: McuService, context: Context) => {
	when(/validate (.*?) room (.*?)$/, async (roomType: string, action: string) => {
		setImmediate(async () => {
			LOGGER.info({ test: context.currentTest, action: `Stating timer ${THREE_MIN} min... ` });
			const data: NotificationMeta = <NotificationMeta>{
				interval: THREE_MIN,
				method: action,
				roomType: roomType,
				sessionType: EMPTY_ROOM,
			};
			await validateNotify.validateNotify(data, context);
		});
	});
};

export const leaveParticipantsWithDTMF = (and, service: McuService, context: Context) => {
	and(/leave participant:/, async (participantList: Array<Participant>) => {
		await Promise.all(
			participantList.map(async (participant: Participant) => {
				await leaveParticipantBye(participant, service, context);
			})
		);
	});
};

export const mute = (and, service: McuService, context: Context) => {
	and(/(.*) (.*)/, async (mute, participant) => {
		//const userId = `${participant}_${strToRoomType("audio")}`;
		const userId = participant.deviceId
			? `${participant}_${strToRoomType("audio")}_${participant.deviceId}`
			: `${participant}_${strToRoomType("audio")}`;
		const userSession: UserSession = <UserSession>context.getUserSession(userId);
		userSession.userAction = mute;

		try {
			userSession.roomCseq.seq++;
			const muteR: ResponseDTO = await service.mute(userSession);
			LOGGER.info({ test: context.currentTest, action: `after ${mute} => `, data: muteR });
			userSession.createResponses.Info = muteR;
		} catch (e) {
			LOGGER.info({ test: context.currentTest, action: "mute", data: e });
		}
	});
};

export const muteAll = (and, service: McuService, context: Context) => {
	and(/(.*) (.*)/, async (participant, mute) => {
		//const userId = `${participant}_${strToRoomType(ROOM_TYPE_AUDIO)}`;
		const userId = participant.deviceId
			? `${participant}_${strToRoomType(ROOM_TYPE_AUDIO)}_${participant.deviceId}`
			: `${participant}_${strToRoomType(ROOM_TYPE_AUDIO)}`;
		const userSession: UserSession = <UserSession>context.getUserSession(userId);
		userSession.userAction = mute == "muteAll" ? "mute" : "unmute";
		try {
			userSession.roomCseq.seq++;
			const muteAll: ResponseDTO = await service.muteAll(userSession);
			LOGGER.info({ test: context.currentTest, action: `after ${mute} =>`, data: muteAll });

			if (mute == "muteAll") {
				userSession.userAction = "unmute";
				userSession.roomCseq.seq++;
				const muteSelf: ResponseDTO = await service.mute(userSession);
				LOGGER.info({ test: context.currentTest, action: "after mute =>", data: muteSelf });
			}
		} catch (e) {
			LOGGER.info({ test: context.currentTest, action: "muteAll", data: e });
		}
	});
};

export const inviteParticipantWithCorruptHeader = (and, service: McuService, context: Context) => {
	and(
		/add participant (.*) in meetingID (.*) with roomType (.*) with header error (.*)/,
		async (Participant, meetingID, roomType, caseType) => {
			const participant: Participant = <Participant>{
				meetingID: meetingID,
				Participant: Participant,
				roomType: roomType,
				caseType: caseType,
				inviteError: true,
			};
			await inviteParticipant(participant, service, context);
		}
	);
};

export const inviteParticipantWithCorruptSDP = (and, service: McuService, context: Context) => {
	and(
		/add participant (.*) in meetingID (.*) with roomType (.*) with sdp error (.*)/,
		async (Participant, meetingID, roomType, SDPcaseType: string) => {
			const participant: Participant = <Participant>{
				meetingID: meetingID,
				Participant: Participant,
				roomType: roomType,
				SDPcaseType: strToSDPCaseType(SDPcaseType),
				userType: "receiver",
				inviteError: true,
			};

			await inviteParticipant(participant, service, context);
		}
	);
};

export const inviteParticipantWithoutConference = (and, service: McuService, context: Context) => {
	and(
		/^INVITE participant (.*) with meetingId (.*) and (.*) roomType(?: caseType (.*))?$/,
		async (Participant, meetingID, roomType, caseType) => {
			const participant: Participant = <Participant>{
				meetingID: meetingID,
				Participant: Participant,
				roomType: roomType,
				userType: MEDIA_DIRECTION_SENDRECV,
				caseType: strToCaseType(caseType),
			};

			switch (participant.caseType) {
				case CaseType.SDP_VIDEO_RECVONLY:
					delete participant.userType;
					break;
				case CaseType.SDP_VIDEO_SENDRECV:
					participant.userType = "video_sendrecv";
					break;
			}

			try {
				await basicInviteParticipant(participant, service, context);
			} catch (e) {
				LOGGER.error({
					test: context.currentTest,
					action: "############# inviteParticipantWithoutConference",
					data: e.message,
				});
				console.assert(
					false,
					`[${context.currentTest}] inviteParticipantWithoutConference, error: ${e.message}`
				);
				expect(e).handleException();
			}
		}
	);
};

export const inviteParticipantWithoutConferenceWithCodecList = (and, service: McuService, context: Context) => {
	and(
		/INVITE participant (.*) with meetingId (.*) and (.*) roomType with codecListInput (.*) server selects (.*)/,
		async (Participant, meetingID, roomType, codecListInput, codecOutput) => {
			const participant: Participant = <Participant>{
				meetingID: meetingID,
				Participant: Participant,
				roomType: roomType,
				userType: MEDIA_DIRECTION_SENDRECV,
				codecListInput: codecListInput,
				codecOutPut: codecOutput,
			};

			try {
				await basicInviteParticipant(participant, service, context);
			} catch (e) {
				LOGGER.error({
					test: context.currentTest,
					action: "############# inviteParticipantWithoutConferenceWithCodecList",
					data: e.message,
				});
				console.assert(
					false,
					`[${context.currentTest}] inviteParticipantWithoutConferenceWithCodecList, error: ${e.message}`
				);
				expect(e).handleException();
			}
		}
	);
};

export const infoParticipantCreateConference = (and, service: McuService, context: Context) => {
	and(/participant (.*) send create conference INFO on (.*) room/, async (Participant, roomType) => {
		const participant: Participant = <Participant>{
			Participant: Participant,
			roomType: roomType,
		};

		try {
			//const userId = `${participant.Participant}_${strToRoomType(participant.roomType)}`;
			const userId = participant.deviceId
				? `${participant.Participant}_${strToRoomType(participant.roomType)}_${participant.deviceId}`
				: `${participant.Participant}_${strToRoomType(participant.roomType)}`;
			const userSession: UserSession = <UserSession>context.getUserSession(userId);
			userSession.cseq.method = METHOD_INFO;
			userSession.cseq.seq++;
			const info: ResponseDTO = await service.createRoomInfo(userSession);
			const objInfo = await msmlService.xmlString2Object(info.content);
			const conf = objInfo.msml.result[0].confid[0].split(":");
			context.conf = conf[1];
			context.setUserSession(userId, userSession);
		} catch (e) {
			LOGGER.error({
				test: context.currentTest,
				action: "############# infoParticipantCreateConference",
				data: e.message,
			});
			console.assert(false, `[${context.currentTest}] infoParticipantCreateConference, error: ${e.message}`);
			expect(e).handleException();
		}
	});
};

export const infoParticipantJoin = (and, service: McuService, context: Context) => {
	and(/JOIN participant (.*) with meetingId (.*) and roomType (.*)/, async (Participant, meetingID, roomType) => {
		const participant: Participant = <Participant>{
			meetingID: meetingID,
			Participant: Participant,
			roomType: roomType,
		};

		try {
			await inviteParticipantInfo(participant, service, context);
		} catch (e) {
			LOGGER.error({
				test: context.currentTest,
				action: "############# infoParticipantJoin",
				data: e.message,
			});
			console.assert(false, `[${context.currentTest}] infoParticipantJoin, error: ${e.message}`);
			expect(e).handleException();
		}
	});
};

export const NonStandartInviteHeader = (and, service: McuService, context: Context) => {
	and(
		/^add non-standart participant (.*) in meetingID (.*)(?: with userType (.*) and deviceType (.*)) with header case (.*)?$/,
		async (
			Participant: string,
			meetingID: string,
			userType?: UserType,
			deviceType?: DeviceType,
			caseType?: CaseType
		) => {
			const participant: Participant = <Participant>{
				meetingID: meetingID,
				Participant: Participant,
				roomType: ROOM_TYPE_AUDIO,
				caseType: caseType,
				deviceType: deviceType,
				userType: userType,
			};

			try {
				await inviteParticipant(participant, service, context);
			} catch (e) {
				LOGGER.error({
					test: context.currentTest,
					action: "############# NonStandartInviteHeader",
					data: e.message,
				});
				console.assert(false, `[${context.currentTest}] NonStandartInviteHeader, error: ${e.message}`);
				expect(e).handleException();
			}
		}
	);
};

export const NonStandartInviteSDP = (and, service: McuService, context: Context) => {
	and(
		/add participant (.*) in meetingID (.*) with roomType (.*) with sdp case (.*)/,
		async (Participant: string, meetingID: string, roomType: string, SDPcaseType: string) => {
			const participant: Participant = <Participant>{
				meetingID: meetingID,
				Participant: Participant,
				roomType: roomType,
				SDPcaseType: strToSDPCaseType(SDPcaseType),
				userType: "receiver",
			};

			try {
				await inviteParticipant(participant, service, context);
			} catch (e) {
				LOGGER.error({
					test: context.currentTest,
					action: "############# NonStandartInviteSDP",
					data: e.message,
				});
				console.assert(false, `[${context.currentTest}] NonStandartInviteSDP, error: ${e.message}`);
				expect(e).handleException();
			}
		}
	);
};

export const recorderInfoAction = async (
	participant: Participant,
	service: McuService,
	context: Context,
	delay?: number
) => {
	await timeOut(delay ? delay : 0);

	if (
		participant.recorderInfoType == "START_MISSING_DEST" ||
		participant.recorderInfoType == "TRANSFER_AFTER_3_FAILURES"
	) {
		try {
			await inviteParticipantInfo(participant, service, context);
			fail("Any Error wasn't send for " + participant.recorderInfoType);
		} catch (e) {
			switch (participant.recorderInfoType) {
				case START_MISSING_DEST:
					expect(e.message.includes("400")).toBeTruthy();
					expect(e.message.includes("Bad Request")).toBeTruthy();
					expect(e.message.includes("missing mandatory param in msml")).toBeTruthy();
					break;
			}
		}
	} else {
		try {
			await inviteParticipantInfo(participant, service, context);
		} catch (e) {
			LOGGER.error({ test: context.currentTest, action: "############# recorderInfoAction", data: e.message });
			console.assert(false, `[${context.currentTest}] recorderInfo, error: ${e.message}`);
			expect(e).handleException();
		}
	}
};

export const recorderInfo = (and, service: McuService, context: any) => {
	and(
		/^(.*) (.*) (.*) (.*) in (.*) meetingID(?: skipError (.*))?$/,
		async (
			Participant: string,
			recorderInfoType: string,
			infoType,
			recorderFileName: string,
			meetingID: string,
			infoError: boolean
		) => {
			const participant: Participant = <Participant>{
				meetingID: meetingID,
				Participant:
					Participant.split("_")[0] == "user"
						? `user_${context.roomPrefix + meetingID.split("_")[1]}_${Participant.split("_")[2]}`
						: Participant,
				roomType: ROOM_TYPE_AUDIO,
				caseType: RECORDER,
				recorderInfoType: recorderInfoType,
				recorderFileName: recorderFileName,
				infoType: infoType,
				infoError: infoError,
			};
			await recorderInfoAction(
				participant,
				service,
				participant.meetingID.split("_")[0] == "room"
					? context.MultiContext[Number(participant.meetingID.split("_")[1])]
					: context
			);
		}
	);
};

export const leaveParticipants = (and, service: McuService, context: Context) => {
	and(
		/^(?:(.*))leave participant:?$/,
		async (
			failed: string,
			participantList: Array<{
				Participant: string;
				meetingID: string;
				roomType: string;
				caseType: string;
			}>
		) => {
			await Promise.all(
				participantList.map(async (participant) => {
					await leaveParticipant(participant, service, context, failed);
				})
			);
		}
	);
};

export const startStreams = (and, service: McuService, context: Context) => {
	and(/start stream in case (.*) set to TRUE:/, async (stream: string, participantList: Array<Participant>) => {
		if (process.env[stream] == "TRUE" || process.env[stream] == "true") {
			await Promise.all(
				participantList.map(async (participant: Participant) => {
					await startStream(participant, service, context);
				})
			);
		}
	});
};

export const stopStreams = (and, service: McuService, context: Context) => {
	and(/stop stream in case (.*) set to TRUE:/, async (stream: string, participantList: Array<Participant>) => {
		if (process.env[stream] == "TRUE" || process.env[stream] == "true") {
			await Promise.all(
				participantList.map(async (participant: Participant) => {
					await stopStream(participant, service, context);
				})
			);
		}
	});
};

export const streamsValidate = (and, service: McuService, context: Context) => {
	and(/validate stream in case (.*) set to TRUE:/, async (stream: string, participantList: Array<Participant>) => {
		if (process.env[stream] == "TRUE" || process.env[stream] == "true") {
			await Promise.all(
				participantList.map(async (participant: Participant) => {
					await streamValidate(participant, service, context);
				})
			);
		}
	});
};

export const reInviteParticipantWithDeviceId = (and, service: McuService, context: Context) => {
	and(
		/(.*) reInvite in (.*) roomType as (.*) and deviceId (.*)/,
		async (Participant, roomType, userType, deviceId) => {
			const participant: Participant = <Participant>{
				Participant: Participant,
				roomType: roomType,
				userType: userType,
				deviceId: deviceId,
			};
			await basicReInvite(participant, service, context);
		}
	);
};

export const reInviteParticipantWithCodecList = (and, service: McuService, context: Context) => {
	and(
		/(.*) reInvite in (.*) roomType as (.*) with codecListInput (.*) server selects (.*)/,
		async (Participant, roomType, userType, codecListInput, codecOutput) => {
			const participant: Participant = <Participant>{
				Participant: Participant,
				roomType: roomType,
				userType: userType,
				codecListInput: codecListInput,
				codecOutPut: codecOutput,
			};
			await basicReInvite(participant, service, context);
		}
	);
};

export const basicReInvite = async (participant: Participant, service: McuService, context: Context) => {
	//const userId = `${participant}_${strToRoomType(roomType)}`;
	const userId = participant.deviceId
		? `${participant.Participant}_${strToRoomType(participant.roomType)}_${participant.deviceId}`
		: `${participant.Participant}_${strToRoomType(participant.roomType)}`;

	const userSession: UserSession = <UserSession>context.getUserSession(userId);
	const sdp: SdpType = stepUtils.sdpResolver(
		strToRoomType(participant.roomType),
		strToUserType(participant.userType)
	);
	try {
		userSession.cseq.seq++;
		userSession.userType = participant.userType;
		userSession.caseType = context.caseType ? context.caseType : null;
		userSession.codecListInput = participant.codecListInput;
		userSession.codecOutPut = participant.codecOutPut;
		//userSession.newPort = participant.newPort;
		const reInvite: ResponseDTO = await service.joinParticipantReInvite(userSession, sdp);
		LOGGER.info({ test: context.currentTest, action: "after reInvite =>", data: reInvite });
		if (
			sdp == SdpType.VideoSender ||
			sdp == SdpType.receiver ||
			sdp == SdpType.VideoMultiSender ||
			sdp == SdpType.oneAudioMid
		) {
			const sdpResponse: any = sdpService.toSDP(reInvite.content);
			userSession.StreamDTO.remoteIP = sdpResponse.media[0].connection.ip;
			userSession.StreamDTO.remotePort = sdpResponse.media[0].port;
			//wait for ssrc in alex response
			if (participant.userType == MEDIA_DIRECTION_SENDRECV && sdpResponse.media[0].ssrcs) {
				// userType == MEDIA_DIRECTION_SENDONLY
				// 	? (userSession.StreamDTO.assrc_In = "0") :
				userSession.StreamDTO.assrc_In = sdpResponse.media[0].ssrcs[0].id;
			}
			if (!(sdp == 10)) {
				const vssrc_array: string[] = [];
				for (let i = 1; i < 6; i++) {
					vssrc_array.push(sdpResponse.media[i].ssrcs[0].id);
				}
				userSession.StreamDTO.vssrc_In = vssrc_array;
			}
		}
		const ack = await service.Ack(userSession);
		LOGGER.info({ test: context.currentTest, action: "after reInvite addAck =>", data: ack });
		userSession.roomCseq.method = METHOD_INFO;
		//userSession.roomCseq.seq = ++userSession.roomCseq.seq;
		userSession.roomCseq.seq++;

		//const info: ResponseDTO = await service.joinParticipantInfo(userSession);
		//LOGGER.info({ test: context.currentTest, action: "after reInvite joinParticipantInfo =>", data: info });
		// } catch (e) {
		// 	LOGGER.error({ test: context.currentTest, action: "############# reInviteParticipant", data: e });
		// }
	} catch (e) {
		if (!context.failureMechanism) {
			LOGGER.error({
				test: context.currentTest,
				action: "############# basicReInvite",
				data: e.message,
			});
			console.assert(false, `[${context.currentTest}] basicReInvite, error: ${e.message}`);
			expect(e).handleException();
		} else {
			//const userId = `${participant.Participant}_${strToRoomType(participant.roomType)}`;
			const userId = participant.deviceId
				? `${participant.Participant}_${strToRoomType(participant.roomType)}_${participant.deviceId}`
				: `${participant.Participant}_${strToRoomType(participant.roomType)}`;
			if (!context.failuresCountMap.joinParticipant.get(userId)) {
				context.failuresCountMap.joinParticipant.set(userId, true);
				LOGGER.info({
					test: context.currentTest,
					action: "==--==failure InviteParticipant for user ",
					data: userId,
				});
			}
		}
	}
};

export const reInviteParticipant = (and, service: McuService, context: Context) => {
	and(
		/^(.*) reInvite in (.*) roomType as (.*)(?: updatedIp (.*))?$/,
		async (participant, roomType, userType, newIp) => {
			const userId = `${participant}_${strToRoomType(roomType)}`;
			const userSession: UserSession = <UserSession>context.getUserSession(userId);
			const sdp: SdpType = stepUtils.sdpResolver(strToRoomType(roomType), strToUserType(userType));
			try {
				userSession.cseq.seq++;
				userSession.userType = userType;
				userSession.caseType = context.caseType ? context.caseType : null;
				userSession.newIp = newIp;
				const reInvite: ResponseDTO = await service.joinParticipantReInvite(userSession, sdp);
				LOGGER.info({ test: context.currentTest, action: "after reInvite =>", data: reInvite });
				userSession.createResponses.Invite = reInvite;
				if (
					sdp == SdpType.VideoSender ||
					sdp == SdpType.receiver ||
					sdp == SdpType.VideoMultiSender ||
					sdp == SdpType.oneAudioMid
				) {
					const sdpResponse: any = sdpService.toSDP(reInvite.content);
					userSession.StreamDTO.remoteIP = sdpResponse.media[0].connection.ip;
					userSession.StreamDTO.remotePort = sdpResponse.media[0].port;
					//wait for ssrc in alex response
					if (userType == MEDIA_DIRECTION_SENDRECV) {
						// userType == MEDIA_DIRECTION_SENDONLY
						// 	? (userSession.StreamDTO.assrc_In = "0") :
						userSession.StreamDTO.assrc_In = sdpResponse.media[0].ssrcs[0].id;
					}
					if (!(sdp == 10)) {
						const vssrc_array: string[] = [];
						for (let i = 1; i < 6; i++) {
							vssrc_array.push(sdpResponse.media[i].ssrcs[0].id);
						}
						userSession.StreamDTO.vssrc_In = vssrc_array;
					}
				}
				const ack = await service.Ack(userSession);
				LOGGER.info({ test: context.currentTest, action: "after reInvite addAck =>", data: ack });
				userSession.roomCseq.method = METHOD_INFO;
				//userSession.roomCseq.seq = ++userSession.roomCseq.seq;
				userSession.roomCseq.seq++;

				//const info: ResponseDTO = await service.joinParticipantInfo(userSession);
				//LOGGER.info({ test: context.currentTest, action: "after reInvite joinParticipantInfo =>", data: info });
			} catch (e) {
				LOGGER.error({ test: context.currentTest, action: "############# reInviteParticipant", data: e });
			}
		}
	);
};

export const startStream = async (participant: Participant, service: McuService, context: Context) => {
	LOGGER.info({ test: context.currentTest, action: "start stream", data: participant });
	const sipStream = new SipStream();
	try {
		//const userId = `${participant.Participant}_${strToRoomType(participant.roomType)}`;
		const userId = participant.deviceId
			? `${participant.Participant}_${strToRoomType(participant.roomType)}_${participant.deviceId}`
			: `${participant.Participant}_${strToRoomType(participant.roomType)}`;
		const userSession: UserSession = <UserSession>context.getUserSession(userId);

		userSession.StreamDTO.numOfStratMacmesh++;
		userSession.StreamDTO.streamFile = strToStreamFile(participant.streamFile);

		if (!userSession.StreamDTO.isUserStream) {
			userSession.StreamDTO.isUserStream = true;
		} else {
			const fileToCopy = `${context.StreamsOutputFilesPath}${context.meetingId}/${participant.Participant}/${userSession.port}.mkv`;
			filesStream.copyFile(fileToCopy);
		}

		if (
			participant.streamFile &&
			participant.streamFile.includes(ROOM_TYPE_VIDEO) &&
			!userSession.StreamDTO.isUserStreamVideo
		) {
			context.numOfVideoPubUsers++;
			userSession.StreamDTO.isUserStreamVideo = true;
		}

		if (await sipStream.checkMacmeshStatus(userSession)) {
			await sipStream.stopMacmesh(userSession);
		}
		await sipStream.startMacmesh(userSession, context, strToStreamFile(participant.streamFile));
	} catch (e) {
		if (!context.failureMechanism) {
			LOGGER.error({ test: context.currentTest, action: "############# startStream", data: e.message });
			console.assert(false, `[${context.currentTest}] start stream, error: ${e.message}`);
			expect(e).handleException();
		} else {
			LOGGER.info({
				test: context.currentTest,
				action: "==--== failure startStream for user ",
				data: participant.Participant,
			});
			context.failuresCountMap.startStream.set(participant.Participant, true);
		}
	}
};

export const stopStream = async (participant: Participant, service: McuService, context: Context) => {
	LOGGER.info({ test: context.currentTest, action: "stop stream", data: participant });
	const sipStream = new SipStream();
	try {
		//const userId = `${participant.Participant}_${strToRoomType(participant.roomType)}`;
		const userId = participant.deviceId
			? `${participant.Participant}_${strToRoomType(participant.roomType)}_${participant.deviceId}`
			: `${participant.Participant}_${strToRoomType(participant.roomType)}`;
		const userSession: UserSession = <UserSession>context.getUserSession(userId);

		await sipStream.stopMacmesh(userSession);
	} catch (e) {
		if (!context.failureMechanism) {
			LOGGER.error({ test: context.currentTest, action: "############# stopStream", data: e.message });
			console.assert(false, `[${context.currentTest}] stop stream, error: ${e.message}`);
			expect(e).handleException();
		} else {
			context.failuresCountMap.stopStream.set(participant.Participant, true);
			LOGGER.info({
				test: context.currentTest,
				action: "==--==failure stopStream for user ",
				data: participant.Participant,
			});
		}
	}
};

export const streamValidate = async (participant: Participant, service: McuService, context: Context) => {
	LOGGER.info({ test: context.currentTest, action: "stream validate", data: participant });

	//const userId = `${participant.Participant}_${strToRoomType(participant.roomType)}`;
	const userId = participant.deviceId
		? `${participant.Participant}_${strToRoomType(participant.roomType)}_${participant.deviceId}`
		: `${participant.Participant}_${strToRoomType(participant.roomType)}`;
	const userSession: UserSession = <UserSession>context.getUserSession(userId);

	await validateStream.validateStreamFilesAmount(participant.Participant, userSession, context);
};

export const modifyStream = async (
	participant: Participant,
	service: McuService,
	context: Context,
	action: SipAction
) => {
	LOGGER.info({ test: context.currentTest, action: "Modify stream", data: participant });

	const control: ControlSession = <ControlSession>context.getRoomSession(utils.strToRoomType(participant.roomType));
	//const userId = `${participant.Participant}_${strToRoomType(participant.roomType)}`;
	const userId = participant.deviceId
		? `${participant.Participant}_${strToRoomType(participant.roomType)}_${participant.deviceId}`
		: `${participant.Participant}_${strToRoomType(participant.roomType)}`;
	const userSession: UserSession = <UserSession>context.getUserSession(userId);

	userSession.cseq.seq++;

	userSession.action = action;

	try {
		const invite: ResponseDTO = await service.modifyStream(userSession);
		LOGGER.info({ test: context.currentTest, action: "after modifyStream =>", data: invite });

		userSession.cseq.seq = invite.headers.cseq.seq;

		//const userId = `${participant.Participant}_${strToRoomType(participant.roomType)}`;
		const userId = participant.deviceId
			? `${participant.Participant}_${strToRoomType(participant.roomType)}_${participant.deviceId}`
			: `${participant.Participant}_${strToRoomType(participant.roomType)}`;
		context.setUserSession(userId, userSession);
	} catch (e) {
		LOGGER.error({ test: context.currentTest, action: "############# modifyStream", data: e.message });
		console.assert(false, `[${context.currentTest}] modifyStream, error: ${e.message}`);
		expect(e).handleException();
	}
};

export const hold = (and, service: McuService, context: Context) => {
	and(
		/(.*) (.*) interface typ: (.*)/,
		async (
			holdAction: "mute" | "unmute" | "muteAll" | "unmuteAll" | "hold" | "unhold",
			participant: string,
			type: "sip" | "sdp" = "sdp"
		) => {
			if (type == "sdp") {
				const user: Participant = {
					Participant: participant,
					meetingID: context.meetingId,
					roomType: ROOM_TYPE_AUDIO,
					userType: holdAction == "hold" ? MEDIA_DIRECTION_INACTIVE : MEDIA_DIRECTION_SENDRECV,
				};

				await basicInviteParticipant(user, service, context);
			} else {
				const userId = `${participant}_${strToRoomType("audio")}`;
				const userSession: UserSession = <UserSession>context.getUserSession(userId);
				userSession.userAction = holdAction;

				try {
					userSession.roomCseq.seq++;
					const muteR: ResponseDTO = await service.hold(userSession);
					LOGGER.info({ test: context.currentTest, action: `after ${hold} => `, data: muteR });
				} catch (e) {
					LOGGER.error({ test: context.currentTest, action: "############# hold", data: e.message });
					console.assert(false, `[${context.currentTest}] modifyStream, error: ${e.message}`);
					expect(e).handleException();
				}
			}
		}
	);
};

export const validateRecorderFile = (and, service: McuService, context: Context) => {
	and(/validate recorder file in (.*) meetingID/, async (meetingID: string) => {
		try {
			await validateRecorder.srmrValidate(getMeetingId(context, meetingID), context);
		} catch (e) {
			LOGGER.error({
				test: context.currentTest,
				action: "############# validateRecorderFile",
				data: e.message,
			});
			console.assert(false, `[${context.currentTest}] recorderInfo, error: ${e.message}`);
			expect(e).handleException();
		}
	});
};

export const validateRecorderFileSize = (and, service: McuService, context: any) => {
	and(/validate recorder file size in (.*) meetingID/, async (meetingID: string) => {
		try {
			await validateRecorder.fileSizeValidate(
				meetingID.split("_")[0] == "room" ? context.MultiContext[Number(meetingID.split("_")[1])] : context
			);
		} catch (e) {
			LOGGER.error({
				test: context.currentTest,
				action: "############# validateRecorderFileSize",
				data: e.message,
			});
			console.assert(false, `[${context.currentTest}] recorderInfo, error: ${e.message}`);
			expect(e).handleException();
		}
	});
};

export const bulkInviteParticipants = (and, service: McuService, context: Context) => {
	and(/bulk add (.*) participant:/, async (count: number, participantList: Array<Participant>) => {
		const MAX_DURATION: any = process.env.MAX_DURATION;
		try {
			process.env.MAX_DURATION = "32000";
			const inviteList: Array<Promise<void>> = new Array<Promise<void>>();
			const template: Participant | undefined = participantList.pop();
			for (let i = 0; i < count; i++) {
				const tmp: Participant = Object.assign({}, template);
				tmp.Participant = `${tmp.Participant}${i}`;
				inviteList.push(inviteParticipant(tmp, service, context));
			}

			await Promise.all(inviteList);
		} finally {
			if (MAX_DURATION) {
				process.env.MAX_DURATION = MAX_DURATION;
			} else {
				delete process.env.MAX_DURATION;
			}
		}
	});
};

export const bulkRecorderInfo = (and, service: McuService, context: Context) => {
	and(
		/^(.*) users (.*) records in (.*) meetingID (?:with delay of (.*) seconds)?$/,
		async (count: number, recorderInfoType: string, meetingID: string, delay: number) => {
			const recorderInfoList: Array<Promise<void>> = new Array<Promise<void>>();
			for (let i = 0; i < count; i++) {
				const participant: Participant = <Participant>{
					meetingID: meetingID,
					Participant: `user${i}`,
					roomType: ROOM_TYPE_AUDIO,
					caseType: RECORDER,
					recorderInfoType: recorderInfoType,
					recorderFileName: `record${i}`,
					delay: delay,
				};
				recorderInfoList.push(recorderInfoAction(participant, service, context, delay * i));
			}
			await Promise.all(recorderInfoList);
		}
	);
};

export const BulkValidateRecorderFile = (and, service: McuService, loadContext: LoadContext) => {
	and(/validate recorders file in all rooms/, async () => {
		const recorderList: Array<Promise<void>> = new Array<Promise<void>>();
		for (let roomID = 1; roomID < Number(loadContext.loadRooms) + 1; roomID++) {
			const roomIDName = loadContext.roomPrefix + roomID;
			recorderList.push(
				validateRecorder.srmrValidate(
					getMeetingId(loadContext.MultiContext[roomID], roomIDName),
					loadContext.MultiContext[roomID]
				)
			);
		}
		await Promise.all(recorderList);
	});
};

export const bulkLeaveParticipants = (and, service: McuService, context: Context) => {
	and(/bulk leave (.*) participant:/, async (count: number, participantList: Array<Participant>) => {
		const MAX_DURATION: any = process.env.MAX_DURATION;
		try {
			process.env.MAX_DURATION = "32000";
			const inviteList: Array<Promise<void>> = new Array<Promise<void>>();
			const template: Participant | undefined = participantList.pop();
			for (let i = 0; i < count; i++) {
				const tmp: Participant = Object.assign({}, template);
				tmp.Participant = `${tmp.Participant}${i}`;
				inviteList.push(leaveParticipant(tmp, service, context));
			}

			await Promise.all(inviteList);
		} finally {
			if (MAX_DURATION) {
				process.env.MAX_DURATION = MAX_DURATION;
			} else {
				delete process.env.MAX_DURATION;
			}
		}
	});
};

export const verifyInviteResponseCode = (and, service: McuService, context: Context) => {
	and(
		/^(.*) should get errorCode: (\d+), errorReason: (.*) response on INVITE (.*) roomType/,
		async (participant: string, errorCode: number, errorReason: string, roomType: string) => {
			const userId = `${participant}_${strToRoomType(roomType)}`;
			const userSession: UserSession = <UserSession>context.getUserSession(userId);
			expect(userSession.status).toEqual(Number(errorCode));
			expect(String(userSession.createResponses.Invite.headers[Attributes.P_ERROR_DESCRIPTION])).toEqual(
				errorReason
			);
		}
	);
};

export const verifyInfoResponseCode = (and, service: McuService, context: Context) => {
	and(
		/^(.*) should get errorCode: (\d+) response on INFO (.*) roomType/,
		async (participant: string, errorCode: number, roomType: string) => {
			const userId = `${participant}_${strToRoomType(roomType)}`;
			const userSession: UserSession = <UserSession>context.getUserSession(userId);
			expect(userSession.createResponses.Info.status).toEqual(Number(errorCode));
		}
	);
};

export const verifyInfoResponseCodeInMultiRoom = (and, service: McuService, loadContext: LoadContext) => {
	and(
		/^(.*) should get errorCode: (\d+) response on INFO (.*) roomType in (.*) meetingId/,
		async (participant: string, errorCode: number, roomType: string, meetingId: string) => {
			const participantName = `user_${loadContext.roomPrefix + meetingId.split("_")[1]}_${
				participant.split("_")[2]
			}`;
			const userId = `${participantName}_${strToRoomType(roomType)}`;
			const userSession: UserSession = <UserSession>(
				loadContext.MultiContext[Number(meetingId.split("_")[1])].getUserSession(userId)
			);

			expect(userSession.createResponses.Info.status).toEqual(Number(errorCode));
		}
	);
};

export const verifyDiffToTag = (and, service: McuService, context: Context) => {
	and(
		/verify To tag is diff between (.*) devcieId and (.*) deviceId for user (.*)/,
		async (deviceId1: string, deviceId2: string, participant: string) => {
			const userId1 = `${participant}_${strToRoomType("audio-video")}_${deviceId1}`;
			const userId2 = `${participant}_${strToRoomType("audio-video")}_${deviceId2}`;
			const userSession1: UserSession = <UserSession>context.getUserSession(userId1);
			const userSession2: UserSession = <UserSession>context.getUserSession(userId2);
			expect(userSession1.createResponses.Invite.headers.to.params.tag).not.toEqual(
				userSession2.createResponses.Invite.headers.to.params.tag
			);
		}
	);
};

export const sendInfo = (and, service: McuService, context: Context) => {
	and(
		/participant (.*) send INFO with meetingID (.*) with caseType (.*) and infoType (.*)/,
		async (Participant, meetingID, caseType, infoType) => {
			const participant: Participant = <Participant>{
				meetingID: meetingID,
				Participant: Participant,
				roomType: ROOM_TYPE_AUDIO,
				caseType: caseType,
				infoType: infoType,
			};
			try {
				await inviteParticipantInfo(participant, service, context);
			} catch (e) {
				LOGGER.error({
					test: context.currentTest,
					action: "############# sendInfo",
					data: e.message,
				});
				console.assert(false, `[${context.currentTest}] sendInfo, error: ${e.message}`);
				expect(e).handleException();
			}
		}
	);
};

export const KafkaConcumeMessages = (and, service: McuService, context: Context) => {
	and(
		/(.*) message is in kafka under context topic:/,
		async (eventName: string, ParticipantList: Array<Participant>) => {
			for (let i = 0; i < ParticipantList.length; i++) {
				const participant = ParticipantList[i];
				const event: KafkaEvent = <KafkaEvent>{
					eventName: eventName,
					offset: participant.offset,
				};
				delete participant.offset;
				await basicKafkaConcumeMessage(event, participant, context);
			}
		}
	);
};

export const KafkaConcumeMessage = (and, service: McuService, context: Context) => {
	and(
		/(.*) message for (.*) participant in (.*) room is in kafka under context topic offset (.*)/,
		async (eventName: string, Participant: string, roomType: string, offset: string) => {
			const participant: Participant = <Participant>{
				Participant: Participant,
				roomType: roomType,
			};
			const event: KafkaEvent = <KafkaEvent>{
				eventName: eventName,
				offset: offset,
			};
			await basicKafkaConcumeMessage(event, participant, context);
		}
	);
};

export const KafkaConcumeInviteMessages = (and, service: McuService, context: Context) => {
	and(
		/(.*) and (.*) messages is in kafka under context topic:/,
		async (InviteEventName: string, InfoEventName: string, ParticipantList: Array<Participant>) => {
			for (let i = 0; i < ParticipantList.length; i++) {
				const participant = ParticipantList[i];
				const inviteEvent: KafkaEvent = <KafkaEvent>{
					eventName: InviteEventName,
					offset: participant.offset,
				};
				const infoEvent: KafkaEvent = <KafkaEvent>{
					eventName: InfoEventName,
					offset: (Number(participant.offset) + 1).toString(),
				};
				delete participant.offset;
				await basicKafkaConcumeMessage(inviteEvent, participant, context);
				await basicKafkaConcumeMessage(infoEvent, participant, context);
			}
		}
	);
};

export const basicKafkaConcumeMessage = async (event: KafkaEvent, participant: Participant, context: Context) => {
	const userId = participant.deviceId
		? `${participant.Participant}_${strToRoomType(participant.roomType)}_${participant.deviceId}`
		: `${participant.Participant}_${strToRoomType(participant.roomType)}`;
	const userSession: UserSession = <UserSession>context.getUserSession(userId);
	try {
		await kafkaAction.kafkaProducer(context.meetingId, userSession, event, context);
		await kafkaAction.kafkaConsumer(userSession, event, context);
	} catch (e) {
		LOGGER.error({
			test: context.currentTest,
			action: "############# KafkaConcumeMessage",
			data: e.message,
		});
		console.assert(false, `[${context.currentTest}] KafkaProducdeMessage, error: ${e.message}`);
		expect(e).handleException();
	}
};

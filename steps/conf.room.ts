import { McuService } from "../common/sip/mcu.service";
import { CSEQ, ResponseDTO } from "../common/sip/dto/infoDTO";
import { StreamFile } from "../common/messages/factory";
import { Context } from "../common/context";
import { KafkaAction } from "../common/kafka";
import { ContactDTO, ControlSession, KafkaEvent, Session, UserSession } from "../common/sip/dto/controlSession";
import { METHOD_INFO, METHOD_INVITE } from "../common/messages/audio.message.factory";
import * as utils from "../common/utils";
import { getAddress, lookup, strToRoomType } from "../common/utils";
import * as fs from "fs";
import {
	Attributes,
	DEV_ENV_K8S,
	DEV_ENV_SWARM,
	DTMF_USER,
	ENVIRONMENTS,
	PlatformType,
	TestEnviroment,
	WITH_RECORDING_HEADER,
} from "../common/constants";

import { FilesActions } from "../common/sip/filesActions";
import { editDestContact } from "./common.steps.utils";
import { LOGGER } from "../common/logger.service";

const filesStream = new FilesActions();
const kafkaAction = new KafkaAction();

export const createConferenceRoomAction = async (
	service: McuService,
	context: Context,
	options: {
		roomType: string;
		meetingId: string;
		host: string;
		caseType?: string;
		inviteError?: boolean;
		caseTypeStatus?: boolean;
	}
): Promise<ControlSession> => {
	LOGGER.info({
		test: context.currentTest,
		action: "createConferenceRoomAction",
		data: `create ${options.roomType} room ${options.meetingId} for host ${options.host}`,
	});

	if (process.env.STREAM && process.env.STREAM.toUpperCase() == "TRUE") {
		filesStream.createFolder(`${context.RecorderFilesPath}/${context.meetingId}/`);
	}
	const roomSession = new ControlSession();
	roomSession.cseq = <CSEQ>{ method: METHOD_INVITE, seq: 1 };
	// const contact: ContactDTO = new ContactDTO();
	// contact.user = options.host /*"chandler"*/;
	// contact.port = context.localPort;
	// contact.domain = getAddress();

	//	roomSession.destContact.push(contact);
	roomSession.from = new ContactDTO();
	roomSession.from.user = options.host;
	roomSession.from.domain = getAddress();
	roomSession.from.port = context.tls ? context.tlsPort : context.localPort;
	roomSession.from.params = { tag: utils.rstring() };
	roomSession.to = new ContactDTO();
	roomSession.to.user = "janus" /*janus*/;
	roomSession.to.domain = context.address();
	roomSession.to.port = context.port();
	roomSession.meetingId = getMeetingId(context, options.meetingId);
	roomSession.pMeetingSessionID = generateSessionId(roomSession.meetingId);
	roomSession.roomType = options.roomType;
	roomSession.caseType = options.caseType;
	roomSession.inviteError = options.inviteError;
	roomSession.caseTypeStatus = options.caseTypeStatus;
	context.setRoomSession(utils.strToRoomType(options.roomType), roomSession);

	try {
		const invite: ResponseDTO = await service.createRoomInvite(roomSession);
		LOGGER.info({ test: context.currentTest, action: "after createRoomInvite =>", data: invite });
		//const inviteVer: void = await validator.validate(invite, roomSession);

		//validate.validate(boj);

		editDestContact(roomSession, invite.headers.contact[0], context);
		roomSession.to.params.tag = invite.headers.to.params.tag;
		roomSession.cseq.seq = invite.headers.cseq.seq;
		roomSession.callId = invite.headers[Attributes.CALL_ID];
		roomSession.roomId = invite.headers.to.params.tag;
		roomSession.createResponses.Invite = invite;
		roomSession.via = invite.headers.via;
		roomSession.status = invite.status;

		const ack = await service.Ack(roomSession);
		LOGGER.info({ test: context.currentTest, action: "after createRoomAck => ", data: ack });
		roomSession.cseq.method = METHOD_INFO;
		roomSession.cseq.seq++;

		const info: ResponseDTO = await service.createRoomInfo(roomSession);
		LOGGER.info({ test: context.currentTest, action: "after createRoomInfo => ", data: info });
		//const infoVer: void = await validator.validate(info, roomSession);

		roomSession.createResponses.Info = info;
		context.setRoomSession(utils.strToRoomType(roomSession.roomType), roomSession);
	} catch (e) {
		if (!context.failureMechanism) {
			LOGGER.error({
				test: context.currentTest,
				action: "############# createConferenceRoomAction",
				data: e.message,
			});
			console.assert(false, `[${context.currentTest}] createConferenceRoom, error: ${e.message}`);
			expect(e).handleException();
		} else {
			if (!context.failuresCountMap.openRoom.get(utils.strToRoomType(options.roomType)))
				context.failuresCountMap.openRoom.set(utils.strToRoomType(options.roomType), true);
			LOGGER.info({ test: context.currentTest, action: "==--==failure create room " });
		}
	}
	return roomSession;
};

export const createConferenceRoom = (when, service: McuService, context: Context) => {
	when(/create (.*?) room(?:(.*))? for host (.*?)$/, async (roomType: string, meetingId = "", userHost: string) => {
		await createConferenceRoomAction(service, context, {
			roomType: roomType,
			meetingId: getMeetingId(context, meetingId),
			host: userHost,
		});
	});
};

export const createConferenceRoomWithError = (when, service: McuService, context: Context) => {
	when(
		/create (.*) room(.*) for host (.*) with error (.*)/,
		async (roomType: string, meetingId = "", userHost: string, caseType: string) => {
			await createConferenceRoomAction(service, context, {
				roomType: roomType,
				meetingId: getMeetingId(context, meetingId),
				host: userHost,
				caseType: caseType,
				inviteError: true,
			});
		}
	);
};

export const createConferenceRoomWithHeader = (when, service: McuService, context: Context) => {
	when(
		/create (.*) room(.*) for host (.*) with header (.*) is (.*)/,
		async (roomType: string, meetingId = "", userHost: string, caseType: string, caseTypeStatus: boolean) => {
			await createConferenceRoomAction(service, context, {
				roomType: roomType,
				meetingId: getMeetingId(context, meetingId),
				host: userHost,
				caseType: caseType,
				caseTypeStatus: caseTypeStatus,
			});
		}
	);
};

export const verifyInfoConfId = (and, service: McuService, context: Context) => {
	and(/verify (.*) roomId (.*) received in INFO/, async (roomType: string, isCheck: string) => {
		const roomContext = context.getRoomSession(utils.strToRoomType(roomType));
		if (roomContext) {
			expect(roomContext.createResponses.Info).toBeDefined;
			if (isCheck == "NOT") {
				expect(roomContext.createResponses.Info.content).toBeNull;
			}
			if (isCheck == "DO") {
				expect(roomContext.createResponses.Info.content).toContain(`conf:${roomContext.roomId}`);
			}
		} else {
			LOGGER.error({
				test: context.currentTest,
				action: "############# verifyInfoConfId",
				data: "roomContext don't define!!",
			});
			console.assert(false, `[${context.currentTest}] verifyInfoConfId, error: roomContext don't define!!`);
		}
	});
};

export const createConferenceRooms = (and, service: McuService, context: Context) => {
	and(
		/create rooms:/,
		async (
			roomList: Array<{
				roomType: string;
				conference: string;
				Participant: string;
			}>
		) => {
			await Promise.all(
				roomList.map(async (room) => {
					await createConferenceRoomAction(service, context, {
						meetingId: room.conference,
						roomType: room.roomType,
						host: room.Participant,
					});
				})
			);
		}
	);
};

export const destroyConferenceRoomAction = async (
	service: McuService,
	context: Context,
	options: { roomType: string; meetingId: string; userName?: string; caseType?: string },
	runningReason?: string
) => {
	LOGGER.info({
		test: context.currentTest,
		action: "destroyConferenceRoomAction",
		data: `destroy ${options.roomType} room ${getMeetingId(context, options.meetingId)}`,
	});

	let session: Session;
	switch (context.caseType) {
		case WITH_RECORDING_HEADER:
		case DTMF_USER: {
			const userId = `${options.userName}_${strToRoomType(options.roomType)}`;
			session = <UserSession>context.getUserSession(userId);
			break;
		}
		default:
			session = <ControlSession>context.getRoomSession(utils.strToRoomType(options.roomType));
	}
	if (runningReason) {
		try {
			session.inviteError = true;
			await destroyConferenceRoomActions(service, context, options, session);
			if (runningReason) {
				verifyError(session);
			}
		} catch (e) {
			LOGGER.info({
				test: context.currentTest,
				action: "&&&&&&&&&&&&&&&&&&&&&&&& Not valid destroy room",
				data: e.message,
			});
			expect(e.message.includes("503")).toBeTruthy();
		}
	} else {
		try {
			await destroyConferenceRoomActions(service, context, options, session);
		} catch (e) {
			if (!context.failureMechanism) {
				LOGGER.error({
					test: context.currentTest,
					action: "############# destroyConferenceRoomAction",
					data: e.message,
				});
				console.assert(false, `[${context.currentTest}] destroyConferenceRoom, error: ${e.message}`);
				expect(e).handleException();
			} else {
				if (!context.failuresCountMap.closeRoom.get(utils.strToRoomType(options.roomType)))
					context.failuresCountMap.closeRoom.set(utils.strToRoomType(options.roomType), true);
				LOGGER.info({ test: context.currentTest, action: "==--==failure close room" });
			}
		}
	}
};

export const destroyConferenceRoomActions = async (
	service: McuService,
	context: Context,
	options: { roomType: string; meetingId: string; userName?: string },
	session
) => {
	if (context.caseType) {
		session.roomId = session.conf;
	}
	session.cseq.seq++;
	const info: ResponseDTO = await service.destroyRoomInfo(session);
	LOGGER.info({ test: context.currentTest, action: "after destroyRoomInfo => ", data: info });
	//const infoVer: void = await validator.validate(info, roomSession);

	session.destroyResponses.Info = info;
	session.cseq.seq++;

	const bye: ResponseDTO = await service.destroyRoomBye(session);
	LOGGER.info({ test: context.currentTest, action: "after destroyRoomBye => ", data: bye });
	//const byeVer: void = await validator.validate(bye, roomSession);

	session.destroyResponses.Bye = bye;
	//context.roomSessions.set(utils.strToRoomType(roomType), roomSession);
};

export const destroyConferenceRoom = (and, service: McuService, context: Context) => {
	and(/^(?:(.*))destroy (.*?) room(?:(.*))?$/, async (runningReason: string, roomType: string, meetingId: string) => {
		await destroyConferenceRoomAction(
			service,
			context,
			{ roomType: roomType, meetingId: getMeetingId(context, meetingId) },
			runningReason
		);
	});
};

export const destroyConferenceRoomWithoutControllSession = (and, service: McuService, context: Context) => {
	and(
		/^destroy (.*?) room with meetingId (.*) for host (.*)?$/,
		async (roomType: string, meetingId: string, userName: string) => {
			await destroyConferenceRoomAction(service, context, {
				roomType: roomType,
				meetingId: getMeetingId(context, meetingId),
				userName: userName,
			});
		}
	);
};

export const setConferenceId = (given: any, context: Context) => {
	//    given(/^System is running on \b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b$/, async address => {
	given(/create conference (.*?)$/, async (meetingId) => {
		if (process.env.RANDOMIZE_MEETING_ID == "FALSE" || process.env.RANDOMIZE_MEETING_ID == "false") {
			context.meetingId = meetingId;
		} else {
			const timestamp = new Date().getTime();
			context.meetingId = `${meetingId}${timestamp}`;
		}
		LOGGER.info({ test: context.currentTest, action: "Create conference ", data: context.meetingId });
		await prepareMediaForTest(context, context.meetingId);
	});
};

export const setCaseType = (given: any, context: Context) => {
	given(/caseType is (.*)$/, async (caseType) => {
		context.caseType = caseType;
		LOGGER.info({ test: context.currentTest, action: "Set caseType to ", data: context.caseType });
	});
};

export const setInfoType = (given: any, context: Context) => {
	given(/infoType is (.*)$/, async (infoType) => {
		context.infoType = infoType;
		LOGGER.info({ test: context.currentTest, action: "Set infoType to ", data: context.infoType });
	});
};

export const streamSleep = (then: any) => {
	then(/Sleep (.*) sec in case (.*) set to TRUE/, async (delay: string, stream: string) => {
		if (process.env[stream] == "TRUE" || process.env[stream] == "true") {
			await new Promise<void>((resolve) => {
				setTimeout(() => {
					return resolve();
				}, Number(delay) * 1000);
			});
		}
	});
};

export const getTestEnvironment = async (name: string, cotext: Context): Promise<TestEnviroment> => {
	const result: TestEnviroment = <TestEnviroment>{
		name: "temp env",
		sip: {
			host: "",
			port: process.env.SIP_PORT || 5060,
		},
		monitor: {
			host: "",
			port: process.env.SIP_PORT || cotext.platform == PlatformType.SWARM ? 3443 : 443,
		},
	};

	const address: string = process.env[name] || name;

	const env: Array<TestEnviroment> = ENVIRONMENTS.filter(
		(env) => address == env.name || env.sip.host.includes(address)
	);
	if (env && env.length > 0) {
		cotext.platform = env[0].type;
		return env[0];
	}

	try {
		const mcuHome: string = await lookup(address);
		result.sip.host = [mcuHome];
		result.monitor.host = [mcuHome];
		result.isPrivate = true;
	} catch (e) {
		switch (cotext.platform) {
			case PlatformType.SWARM: {
				result.sip.host = DEV_ENV_SWARM.sip.host;
				result.monitor.host = DEV_ENV_SWARM.monitor.host;
				break;
			}
			default: {
				result.sip.host = DEV_ENV_K8S.sip.host;
				result.monitor.host = DEV_ENV_K8S.monitor.host;
			}
		}
	}

	return result;
};

export const prepareMediaForTest = async (context: Context, meetingId: string) => {
	if (process.env.STREAM && process.env.STREAM.toUpperCase() == "TRUE") {
		//continue
		LOGGER.debug({
			test: context.currentTest,
			action: "prepareMediaForTest",
			data: "Preparing steaming data...",
		});
	} else {
		LOGGER.info({
			test: context.currentTest,
			action: "prepareMediaForTest",
			data: "Stream is not enabled....",
		});
		return;
	}

	//const dirName=filesStream.getParentdFolder(__dirname)
	const dirName = __dirname + "/../";
	context.StreamsInputFilesPath = `${dirName}/StreamFiles/Input/`;
	context.StreamsOutputFilesPath = `${dirName}/StreamFiles/Output/`;
	context.RecorderFilesPath = `${dirName}/RecorderFiles/`;
	context.ClaudRecordingFilesPath = `${dirName}/uploads/`;

	filesStream.createFolder(`${dirName}/StreamFiles`);
	filesStream.createFolder(context.StreamsOutputFilesPath);
	filesStream.createFolder(context.StreamsInputFilesPath);
	filesStream.createFolder(context.RecorderFilesPath);
	filesStream.deleteFolder(`${context.StreamsOutputFilesPath}/${meetingId}`);
	filesStream.deleteFolder(`${context.RecorderFilesPath}/${meetingId}`);

	const Files_Array: Array<Promise<void>> = [];

	for (let i = 0; i < Object.keys(StreamFile).length / 2; i++) {
		const fileName = `${StreamFile[i]}.mkv`;
		if (!fs.existsSync(`${context.StreamsInputFilesPath}${fileName}`)) {
			Files_Array.push(
				filesStream.downLoadFile(`${context.minioURLStreamFiles}${fileName}`, context.StreamsInputFilesPath)
			);
		}
	}
	LOGGER.info({
		test: context.currentTest,
		action: "prepareMediaForTest",
		data: "stream files are downloading now, be patient...",
	});
	await Promise.all(Files_Array);
};

export const systemSetup = (given: any, localPort: number, context: Context) => {
	//    given(/^System is running on \b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b$/, async address => {
	given(/System is running on (.*?)$/, async (address) => {
		context.platform = PlatformType.SWARM;
		const env: TestEnviroment = await getTestEnvironment(address, context);
		context.localPort = localPort;
		context.env = env;
		LOGGER.info({
			test: context.currentTest,
			action: "mMCU is running on ",
			mcu: { address: context.address(), port: context.port() },
		});
	});
};

export const systemPlatformSetup = (given: any, localPort: number, context: Context) => {
	given(/System is platform (.*) running on (.*)$/, async (platform, address) => {
		//context.platform = PlatformType[<keyof typeof PlatformType>(process.env[platform] || platform)];
		context.platform = PlatformType[PlatformType[(process.env[platform] || platform).toUpperCase()]];
		const env: TestEnviroment = await getTestEnvironment(address, context);

		context.localPort = localPort;
		context.env = env;
		LOGGER.info({
			test: context.currentTest,
			action: "systemPlatformSetup",
			data: `mMCU (${context.platform}) is running on ${context.address()}: ${context.port()}`,
		});
	});
};

export const getMeetingId = (context: Context, alternateMeetingId: string) => {
	const id: string = alternateMeetingId ? alternateMeetingId.trim() : "";
	switch (id) {
		case "context":
		case "":
			return context.meetingId;
		default:
			return id;
	}
	return "NA";
};

export const generateSessionId = (meetingId: string | undefined) => {
	return `${meetingId ? meetingId : Math.floor(1000 + (100000 - 1000) * Math.random())}D${new Date().toISOString()}`;
};

export const wait = (then) => {
	then(/Sleep (\d+) sec/, async (delay) => {
		await new Promise<void>((resolve) => {
			setTimeout(() => {
				LOGGER.debug({ action: `sleeping ${delay} sec` });
				return resolve();
			}, delay * 1000);
		});
	});
};

export const verifyError = (session) => {
	expect(session.destroyResponses.Info.status).toEqual(503);
};

export const verifyRoomInviteResponseCode = (and, service: McuService, context: Context) => {
	and(
		/^(.*) should get errorCode: (\d+), errorReason: (.*) response on INVITE (.*) roomType/,
		async (participant: string, errorCode: number, errorReason: string, roomType: string) => {
			const roomSession: ControlSession | undefined = context.getRoomSession(utils.strToRoomType(roomType));
			if (roomSession) {
				expect(roomSession.status).toEqual(Number(errorCode));
				expect(String(roomSession.createResponses.Invite.headers[Attributes.P_ERROR_DESCRIPTION])).toEqual(
					errorReason
				);
			}
		}
	);
};

export const KafkaConcumeRoomMessage = (when, service: McuService, context: Context) => {
	when(
		/(.*) message for (.*) room is in kafka under context topic offset (.*)/,
		async (eventName: string, roomType: string, offset: string) => {
			const options = { roomType: roomType, meetingId: context.meetingId };
			const event: KafkaEvent = <KafkaEvent>{
				eventName: eventName,
				offset: offset,
			};
			const roomSession = <ControlSession>context.getRoomSession(utils.strToRoomType(options.roomType));
			try {
				await kafkaAction.kafkaProducer(context.meetingId, roomSession, event, context);
				await kafkaAction.kafkaConsumer(roomSession, event, context);
			} catch (e) {
				LOGGER.error({
					test: context.currentTest,
					action: "############# KafkaConcumeMessage",
					data: e.message,
				});
				console.assert(false, `[${context.currentTest}] KafkaProducdeMessage, error: ${e.message}`);
				expect(e).handleException();
			}
		}
	);
};

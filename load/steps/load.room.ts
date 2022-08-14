import { McuService } from "../../common/sip/mcu.service";
import { Context, LoadContext } from "../../common/context";

import { PlatformType } from "../../common/constants";

import { Participant } from "../../common/sip/dto/controlSession";
import { strToRoomType, strToStreamFile } from "../../common/utils";
import {
	createConferenceRoomAction,
	destroyConferenceRoomAction,
	prepareMediaForTest,
	getTestEnvironment,
	systemSetup,
} from "../../steps/conf.room";
import { loadMuteParticipant } from "./load.user";
import {
	startStream,
	stopStream,
	leaveParticipant,
	inviteParticipant,
	streamValidate,
	recorderInfo,
	recorderInfoAction,
} from "../../steps/conf.publisher";
import { TestEnviroment } from "../../common/constants";
import { RoomType } from "../../common/messages/factory";
import * as fs from "fs";
import { LOGGER } from "../../common/logger.service";
import { PORT_RANGE } from "../../common/sip/sdp.factory";

export const loadSystemSetup = async (context: Context, address: string) => {
	context.platform = PlatformType.SWARM;
	const env: TestEnviroment = await getTestEnvironment(address, context);
	context.env = env;
	LOGGER.info({ test: context.currentTest, action: "mMCU is running on ", data: context.address() });
};

export const setLoadValues = async (when, service: McuService, loadContext: LoadContext): Promise<void> => {
	when(
		/^set: ADDRESS (.*), USERS (.*), ROOMS (.*) -(?:, SPEAK_USERS (.*), VIDEO_PUB_USERS (.*), FAILURE_MECHANISM (.*))?$/,
		async (
			ADDRESS: string,
			USERS: number,
			ROOMS: number,
			SPEAK_USERS: number,
			VIDEO_PUB_USERS: number,
			FAILURE_MECHANISM: string
		) => {
			try {
				loadContext.loadAddress = ADDRESS;
				loadContext.loadRooms = process.env.ROOMS ? Number(process.env.ROOMS) : ROOMS;
				loadContext.loadUsers = process.env.USERS ? Number(process.env.USERS) : USERS;
				loadContext.loadSpeakUsers = process.env.SPEAK_USERS ? Number(process.env.SPEAK_USERS) : SPEAK_USERS;
				loadContext.loadVideoPubUsers = process.env.VIDEO_PUB_USERS
					? Number(process.env.VIDEO_PUB_USERS)
					: VIDEO_PUB_USERS;
				loadContext.failureMechanism = process.env.FAILURE_MECHANISM
					? process.env.FAILURE_MECHANISM
					: FAILURE_MECHANISM;
				loadContext.roomPrefix = shortRstring();
				LOGGER.info("bulk operation:", {
					users: USERS,
					rooms: ROOMS,
					speaker: SPEAK_USERS,
					publishers: VIDEO_PUB_USERS,
					stopOnFailure: FAILURE_MECHANISM,
				});
			} catch (e) {
				LOGGER.error({ test: loadContext.currentTest, action: "############# setLoadValues", data: e.message });
				expect(e).handleException();
			}
		}
	);
};

export const openRoomsWithParticipantsMuteAndStream = async (
	and,
	service: McuService,
	loadContext: LoadContext
): Promise<void> => {
	and(
		/^open (.*) rooms with participants and stream and mute NOT SPEAK_USERS(?: with delay of (.*) seconds between rooms and (.*) seconds between users)?$/,
		async (roomType: string, roomsDelay: string, usersDelay: string) => {
			async function openRoom(roomID): Promise<void> {
				await timeOut(process.env.roomsDelay ? Number(process.env.roomsDelay) : Number(roomsDelay), roomID);
				const roomIDName = loadContext.roomPrefix + roomID;

				if (strToRoomType(roomType) == RoomType.AUDIO_VIDEO) {
					const context: Context = new Context();
					loadContext.MultiContext[roomID] = context;
					await loadSystemSetup(loadContext.MultiContext[roomID], loadContext.loadAddress);
					loadContext.MultiContext[roomID].meetingId = `${roomIDName}111`;
					if (loadContext.failureMechanism == "true" || loadContext.failureMechanism == "TRUE") {
						LOGGER.info({ test: context.currentTest, action: "failureMechanism true" });
						loadContext.MultiContext[roomID].failureMechanism = true;
					}
					await prepareMediaForTest(loadContext.MultiContext[roomID], `${roomIDName}111`);
				}

				await createConferenceRoomAction(service, loadContext.MultiContext[roomID], {
					roomType: roomType,
					meetingId: `${roomIDName}111`,
					host: `user_${roomIDName}_0`,
				});

				for (let userID = 0; userID < loadContext.loadUsers; userID++) {
					let participant: Participant = <Participant>{
						roomType: roomType,
						meetingID: `${roomIDName}111`,
						Participant: `user_${roomIDName}_${userID}`,
						deviceType: "LOAD_PSTN",
						userType:
							userID < loadContext.loadVideoPubUsers && strToRoomType(roomType) == RoomType.AUDIO_VIDEO
								? "sender"
								: "receiver",
						port: `1${userID}` + (roomID > 9 ? roomID : `0${roomID}`) + (userID > 9 ? "" : "0"),
					};
					await inviteParticipant(participant, service, loadContext.MultiContext[roomID]);
					if (userID >= loadContext.loadSpeakUsers) {
						await loadMuteParticipant(
							service,
							loadContext.MultiContext[roomID],
							`user_${roomIDName}_${userID}`,
							"mute"
						);
					}
					participant = <Participant>{
						meetingID: `${roomIDName}111`,
						Participant: `user_${roomIDName}_${userID}`,
						roomType: "audio",
						streamFile: getStreamFile(userID, loadContext.loadVideoPubUsers, loadContext.loadSpeakUsers),
					};
					await startStream(participant, service, loadContext.MultiContext[roomID]);
					await timeOut(process.env.usersDelay ? Number(process.env.usersDelay) : Number(usersDelay), roomID);
				}
			}
			try {
				const Rooms_Array: Array<Promise<any>> = [];
				for (let roomID = 1; roomID < Number(loadContext.loadRooms) + 1; roomID++) {
					Rooms_Array.push(openRoom(roomID));
				}

				await Promise.all(Rooms_Array);
			} catch (e) {
				LOGGER.error({
					test: loadContext.currentTest,
					action: "############# openRoomsWithParticipantsMuteAndStream",
					data: e.message,
				});
				expect(e).handleException();
			}
		}
	);
};

export const loadSleep = (then: any) => {
	then(/Sleep (.*) sec/, async (delay: string) => {
		await new Promise<void>((resolve) => {
			setTimeout(() => {
				return resolve();
			}, Number(process.env[delay]) * 1000);
		});
	});
};

export const multiRecorderInfo = (and, service: McuService, loadContext: LoadContext) => {
	and(
		/user0 (.*) record in each room with delay of (.*) seconds between rooms/,
		async (action: string, delay: string) => {
			async function recorderAction(roomID) {
				const roomIDName = loadContext.roomPrefix + roomID;
				const participant: Participant = <Participant>{
					meetingID: roomIDName,
					Participant: `user_${roomIDName}_0`,
					roomType: "audio",
					caseType: "RECORDER",
					recorderInfoType: action,
					recorderFileName: "record" + roomID,
				};
				await recorderInfoAction(participant, service, loadContext.MultiContext[roomID]);
			}
			try {
				const Rooms_Array: Array<Promise<any>> = [];
				for (let roomID = 1; roomID < Number(loadContext.loadRooms) + 1; roomID++) {
					Rooms_Array.push(recorderAction(roomID));
				}

				await Promise.all(Rooms_Array);
			} catch (e) {
				console.error("#############", e.message);
				expect(e).handleException();
			}
		}
	);
};

export const openRoomsWithParticipants = async (and, service: McuService, loadContext: LoadContext): Promise<void> => {
	and(
		/^open (.*) rooms with participants(?: with delay of (.*) seconds between rooms)?$/,
		async (roomType: string, delay: number) => {
			async function openRoom(roomID): Promise<void> {
				await timeOut(delay, roomID);
				const roomIDName = loadContext.roomPrefix + roomID;

				if (strToRoomType(roomType) == RoomType.AUDIO_VIDEO) {
					const context: Context = new Context();
					loadContext.MultiContext[roomID] = context;
					await loadSystemSetup(loadContext.MultiContext[roomID], loadContext.loadAddress);
					loadContext.MultiContext[roomID].meetingId = `${roomIDName}111`;
					if (loadContext.failureMechanism == "true") {
						loadContext.MultiContext[roomID].failureMechanism = true;
					}
					await prepareMediaForTest(loadContext.MultiContext[roomID], `${roomIDName}111`);
				}

				await createConferenceRoomAction(service, loadContext.MultiContext[roomID], {
					roomType: roomType,
					meetingId: `${roomIDName}111`,
					host: `user_${roomIDName}_0`,
				});

				const AddInvite_Array: Array<Promise<any>> = new Array<Promise<void>>();
				for (let userID = 0; userID < loadContext.loadUsers; userID++) {
					const participant: Participant = <Participant>{
						roomType: roomType,
						meetingID: `${roomIDName}111`,
						Participant: `user_${roomIDName}_${userID}`,
						deviceType: "LOAD_PSTN",
						userType:
							userID < loadContext.loadVideoPubUsers && strToRoomType(roomType) == RoomType.AUDIO_VIDEO
								? "sender"
								: "receiver",
						//port: `${userID}` + (roomID > 9 ? roomID : `0${roomID}`) + (userID > 9 ? "1" : "00"),
						port: (
							Math.floor(Math.random() * (PORT_RANGE.max - PORT_RANGE.min + 1)) + PORT_RANGE.min
						).toString(),
					};
					AddInvite_Array.push(inviteParticipant(participant, service, loadContext.MultiContext[roomID]));
				}
				const AddInvite_ResponseCode_Array: any[] = await Promise.all(AddInvite_Array);
			}
			const MAX_DURATION: any = process.env.MAX_DURATION;
			try {
				process.env.MAX_DURATION = "320000";
				const Rooms_Array: Array<Promise<any>> = [];
				for (let roomID = 1; roomID < Number(loadContext.loadRooms) + 1; roomID++) {
					Rooms_Array.push(openRoom(roomID));
				}

				await Promise.all(Rooms_Array);
			} finally {
				if (MAX_DURATION) {
					process.env.MAX_DURATION = MAX_DURATION;
				} else {
					delete process.env.MAX_DURATION;
				}
			}
		}
	);
};

export const destroyRoomWithParticipants = async (
	and,
	service: McuService,
	loadContext: LoadContext
): Promise<void> => {
	and(
		/^close (.*) rooms with participants(?: with delay of (.*) seconds between rooms)?$/,
		async (roomType: string, delay: string) => {
			async function closeRoom(roomID) {
				await timeOut(process.env.delay ? Number(process.env.delay) : Number(delay));
				const roomIDName = loadContext.roomPrefix + roomID;

				const AddInvite_Array: Array<Promise<any>> = [];
				for (let userID = 0; userID < loadContext.loadUsers; userID++) {
					const participant: Participant = <Participant>{
						meetingID: `${roomIDName}111`,
						Participant: `user_${roomIDName}_${userID}`,
						roomType: roomType,
					};
					AddInvite_Array.push(leaveParticipant(participant, service, loadContext.MultiContext[roomID]));
				}

				const AddInvite_ResponseCode_Array: any[] = await Promise.all(AddInvite_Array);
				await destroyConferenceRoomAction(service, loadContext.MultiContext[roomID], {
					roomType: roomType,
					meetingId: `${roomIDName}111`,
				});
			}
			const MAX_DURATION: any = process.env.MAX_DURATION;
			try {
				process.env.MAX_DURATION = "32000";
				const Rooms_Array: Array<Promise<any>> = [];
				for (let roomID = 1; roomID < Number(loadContext.loadRooms) + 1; roomID++) {
					Rooms_Array[roomID - 1] = closeRoom(roomID);
				}

				await Promise.all(Rooms_Array);
			} finally {
				if (MAX_DURATION) {
					process.env.MAX_DURATION = MAX_DURATION;
				} else {
					delete process.env.MAX_DURATION;
				}
			}
		}
	);
};

export const destroyRoomWithParticipantsAndStopStream = async (
	and,
	service: McuService,
	loadContext: LoadContext
): Promise<void> => {
	and(
		/^close (.*) rooms with participants and stop stream(?: with delay of (.*) seconds between rooms)?$/,
		async (roomType: string, delay: number) => {
			async function closeRoom(roomID) {
				await timeOut(delay, roomID);
				const roomIDName = loadContext.roomPrefix + roomID;

				for (let userID = 0; userID < loadContext.loadUsers; userID++) {
					const participant: Participant = <Participant>{
						meetingID: `${roomIDName}111`,
						Participant: `user_${roomIDName}_${userID}`,
						roomType: roomType,
					};
					await stopStream(participant, service, loadContext.MultiContext[roomID]);
					await leaveParticipant(participant, service, loadContext.MultiContext[roomID]);
				}

				await destroyConferenceRoomAction(service, loadContext.MultiContext[roomID], {
					roomType: roomType,
					meetingId: `${roomIDName}111`,
				});
			}
			try {
				const Rooms_Array: Array<Promise<any>> = [];
				for (let roomID = 1; roomID < Number(loadContext.loadRooms) + 1; roomID++) {
					Rooms_Array[roomID - 1] = closeRoom(roomID);
				}

				await Promise.all(Rooms_Array);
			} catch (e) {
				LOGGER.error({
					test: loadContext.currentTest,
					action: "############# destroyRoomWithParticipantsAndStopStream",
					data: e.message,
				});
				expect(e).handleException();
			}
		}
	);
};

export const muteNotSpeakParticipants = async (and, service: McuService, loadContext: LoadContext): Promise<void> => {
	and(/^mute NOT SPEAK_USERS(?: with delay of (.*) seconds between rooms)?$/, async (delay: number) => {
		async function muteUsers(roomID): Promise<void> {
			await timeOut(delay, roomID);
			const roomIDName = loadContext.roomPrefix + roomID;

			const mute_Participant_Array: Array<Promise<any>> = new Array<Promise<boolean>>();
			for (let userID = loadContext.loadSpeakUsers; userID < loadContext.loadUsers; userID++) {
				mute_Participant_Array.push(
					loadMuteParticipant(
						service,
						loadContext.MultiContext[roomID],
						`user_${roomIDName}_${userID}`,
						"mute"
					)
				);
			}

			const AddInvite_ResponseCode_Array: any[] = await Promise.all(mute_Participant_Array);
		}
		try {
			const mute_Rooms_Array: Array<Promise<any>> = [];
			for (let roomID = 1; roomID < Number(loadContext.loadRooms) + 1; roomID++) {
				mute_Rooms_Array.push(muteUsers(roomID));
			}

			await Promise.all(mute_Rooms_Array);
		} catch (e) {
			LOGGER.error({
				test: loadContext.currentTest,
				action: "############# muteNotSpeakParticipants",
				data: e.message,
			});
			expect(e).handleException();
		}
	});
};

export const loadStopStreams = async (and, service: McuService, loadContext: LoadContext): Promise<void> => {
	and(
		/^stop stream(?: with delay of (.*) seconds between rooms in case (.*) set to TRUE)?$/,
		async (delay: string, stream: string) => {
			async function stopStreams(roomID): Promise<void> {
				await timeOut(process.env.delay ? Number(process.env.delay) : Number(delay), roomID);
				const roomIDName = loadContext.roomPrefix + roomID;

				const Streams_Participant_Array: Array<Promise<any>> = new Array<Promise<boolean>>();
				for (let userID = 0; userID < loadContext.loadUsers; userID++) {
					const participant: Participant = <Participant>{
						meetingID: `${roomIDName}111`,
						Participant: `user_${roomIDName}_${userID}`,
						roomType: "audio",
					};

					Streams_Participant_Array.push(stopStream(participant, service, loadContext.MultiContext[roomID]));
				}

				const AddInvite_ResponseCode_Array: any[] = await Promise.all(Streams_Participant_Array);
			}
			try {
				if (process.env[stream] == "TRUE" || process.env[stream] == "true") {
					const Streams_Rooms_Array: Array<Promise<any>> = [];
					for (let roomID = 1; roomID < Number(loadContext.loadRooms) + 1; roomID++) {
						Streams_Rooms_Array.push(stopStreams(roomID));
					}

					await Promise.all(Streams_Rooms_Array);
				}
			} catch (e) {
				LOGGER.error({
					test: loadContext.currentTest,
					action: "############# loadStopStreams",
					data: e.message,
				});
				expect(e).handleException();
			}
		}
	);
};

export const loadStartStreams = async (and, service: McuService, loadContext: LoadContext): Promise<void> => {
	and(
		/^start stream(?: with delay of (.*) seconds between rooms in case (.*) set to TRUE)?$/,
		async (delay: number, stream: string) => {
			async function startStreams(roomID): Promise<void> {
				await timeOut(delay, roomID);
				const roomIDName = loadContext.roomPrefix + roomID;

				const Streams_Participant_Array: Array<Promise<any>> = new Array<Promise<boolean>>();
				for (let userID = 0; userID < loadContext.loadUsers; userID++) {
					const participant: Participant = <Participant>{
						meetingID: `${roomIDName}111`,
						Participant: `user_${roomIDName}_${userID}`,
						roomType: "audio",
						streamFile: getStreamFile(userID, loadContext.loadVideoPubUsers, loadContext.loadSpeakUsers),
					};
					Streams_Participant_Array.push(startStream(participant, service, loadContext.MultiContext[roomID]));
				}

				const AddInvite_ResponseCode_Array: any[] = await Promise.all(Streams_Participant_Array);
			}
			try {
				if (process.env[stream] == "TRUE" || process.env[stream] == "true") {
					const Streams_Rooms_Array: Array<Promise<any>> = [];
					for (let roomID = 1; roomID < Number(loadContext.loadRooms) + 1; roomID++) {
						Streams_Rooms_Array.push(startStreams(roomID));
					}

					await Promise.all(Streams_Rooms_Array);
				}
			} catch (e) {
				LOGGER.error({
					test: loadContext.currentTest,
					action: "############# loadStartStreams",
					data: e.message,
				});
				expect(e).handleException();
			}
		}
	);
};

export const checkFailuresThreshold = async (and, service: McuService, loadContext: LoadContext): Promise<void> => {
	and(
		/validate failures threshold less then (.*)% in case FAILURE_MECHANISM set to TRUE/,
		async (Percent: string) => {
			async function countNumOfFailures(roomID): Promise<void> {
				const roomIDName = loadContext.roomPrefix + roomID;
				if (loadContext.MultiContext[roomID].failuresCountMap.openRoom.get(RoomType.AUDIO_VIDEO)) {
					loadContext.failuresCountSummary.allFailures++;
					loadContext.failuresCountSummary.openRoom++;
				}

				if (loadContext.MultiContext[roomID].failuresCountMap.closeRoom.get(RoomType.AUDIO_VIDEO)) {
					loadContext.failuresCountSummary.allFailures++;
					loadContext.failuresCountSummary.closeRoom++;
				}

				// if (loadContext.MultiContext[roomID].failuresCountMap.openRoom.get(RoomType.DATA_CHANNEL)) {
				// 	loadContext.failuresCountSummary.allFailures++;
				// 	loadContext.failuresCountSummary.openRoom++;
				// }
				//
				// if (loadContext.MultiContext[roomID].failuresCountMap.closeRoom.get(RoomType.DATA_CHANNEL)) {
				// 	loadContext.failuresCountSummary.allFailures++;
				// 	loadContext.failuresCountSummary.closeRoom++;
				// }
				for (let userID = 0; userID < loadContext.loadUsers; userID++) {
					if (
						loadContext.MultiContext[roomID].failuresCountMap.leaveParticipant.get(
							`user_${roomIDName}_${userID}_0`
						)
					) {
						loadContext.failuresCountSummary.allFailures++;
						loadContext.failuresCountSummary.leaveParticipant++;
					}

					if (
						loadContext.MultiContext[roomID].failuresCountMap.joinParticipant.get(
							`user_${roomIDName}_${userID}_0`
						)
					) {
						loadContext.failuresCountSummary.allFailures++;
						loadContext.failuresCountSummary.joinParticipant++;
					}

					if (
						loadContext.MultiContext[roomID].failuresCountMap.leaveParticipant.get(
							`user_${roomIDName}_${userID}_2`
						)
					) {
						loadContext.failuresCountSummary.allFailures++;
						loadContext.failuresCountSummary.leaveParticipant++;
					}

					if (
						loadContext.MultiContext[roomID].failuresCountMap.joinParticipant.get(
							`user_${roomIDName}_${userID}_2`
						)
					) {
						loadContext.failuresCountSummary.allFailures++;
						loadContext.failuresCountSummary.joinParticipant++;
					}

					if (loadContext.MultiContext[roomID].failuresCountMap.mute.get(`user_${roomIDName}_${userID}`)) {
						loadContext.failuresCountSummary.allFailures++;
						loadContext.failuresCountSummary.mute++;
					}

					if (
						loadContext.MultiContext[roomID].failuresCountMap.startStream.get(
							`user_${roomIDName}_${userID}`
						)
					) {
						loadContext.failuresCountSummary.allFailures++;
						loadContext.failuresCountSummary.startStream++;
					}

					if (
						loadContext.MultiContext[roomID].failuresCountMap.validateStream.get(
							`user_${roomIDName}_${userID}`
						)
					) {
						loadContext.failuresCountSummary.allFailures++;
						loadContext.failuresCountSummary.validateStream++;
					}

					if (
						loadContext.MultiContext[roomID].failuresCountMap.stopStream.get(`user_${roomIDName}_${userID}`)
					) {
						loadContext.failuresCountSummary.allFailures++;
						loadContext.failuresCountSummary.stopStream++;
					}
				}
			}
			try {
				if (loadContext.failureMechanism == "true") {
					const percent = Number(process.env[Percent]) / 100;

					loadContext.failuresCountSummary.joinParticipant = 0;
					loadContext.failuresCountSummary.leaveParticipant = 0;
					loadContext.failuresCountSummary.mute = 0;
					loadContext.failuresCountSummary.startStream = 0;
					loadContext.failuresCountSummary.stopStream = 0;
					loadContext.failuresCountSummary.openRoom = 0;
					loadContext.failuresCountSummary.closeRoom = 0;
					loadContext.failuresCountSummary.validateStream = 0;
					loadContext.failuresCountSummary.allFailures = 0;

					const failures_Rooms_Array: Array<Promise<any>> = [];
					for (let roomID = 1; roomID < Number(loadContext.loadRooms) + 1; roomID++) {
						failures_Rooms_Array.push(countNumOfFailures(roomID));
					}

					await Promise.all(failures_Rooms_Array);

					let numOfActionPerRoom: number =
						loadContext.loadUsers * 4 + (loadContext.loadUsers - loadContext.loadSpeakUsers);
					if (process.env["STREAM"] == "TRUE" || process.env["STREAM"] == "true") {
						numOfActionPerRoom = numOfActionPerRoom + loadContext.loadUsers * 3;
					}

					const numOfAction: number = numOfActionPerRoom * loadContext.loadRooms + loadContext.loadRooms * 4;

					LOGGER.info({ test: loadContext.currentTest, action: "numOfAction: ", data: numOfAction });
					LOGGER.info({
						test: loadContext.currentTest,
						action: "loadContext.failuresCountSummary.allFailures: ",
						data: loadContext.failuresCountSummary.allFailures,
					});

					expect(loadContext.failuresCountSummary.allFailures / numOfAction).toBeLessThan(percent);
				}
			} catch (e) {
				LOGGER.error({
					test: loadContext.currentTest,
					action: "############# checkFailuresThreshold",
					data: e.message,
				});
				expect(e).handleException();
			}
		}
	);
};

export const validateNumOfStreamFiles = async (and, service: McuService, loadContext: LoadContext): Promise<void> => {
	and(/validate num of streams files for each participant in case (.*) set to TRUE/, async (stream: string) => {
		async function numFilesStreamsValidate(roomID): Promise<void> {
			const roomIDName = loadContext.roomPrefix + roomID;
			const Streams_Participant_Array: Array<Promise<any>> = new Array<Promise<any>>();
			for (let userID = 0; userID < loadContext.loadUsers; userID++) {
				const participant: Participant = <Participant>{
					meetingID: `${roomIDName}111`,
					Participant: `user_${roomIDName}_${userID}`,
					roomType: "audio",
				};
				Streams_Participant_Array.push(streamValidate(participant, service, loadContext.MultiContext[roomID]));
			}
			const AddInvite_ResponseCode_Array: any[] = await Promise.all(Streams_Participant_Array);
		}
		try {
			if (process.env[stream] == "TRUE" || process.env[stream] == "true") {
				const Streams_Rooms_Array: Array<Promise<any>> = [];
				for (let roomID = 1; roomID < Number(loadContext.loadRooms) + 1; roomID++) {
					Streams_Rooms_Array.push(numFilesStreamsValidate(roomID));
				}

				await Promise.all(Streams_Rooms_Array);
			}
		} catch (e) {
			LOGGER.error({
				test: loadContext.currentTest,
				action: "############# validateNumOfStreamFiles",
				data: e.message,
			});
			expect(e).handleException();
		}
	});
};

export const validateStreamFilesSize = async (and, service: McuService, loadContext: LoadContext): Promise<void> => {
	and(
		/validate streams file size sd is less then (.*) MB in case (.*) set to TRUE/,
		async (sd: string, stream: string) => {
			function calculateFileSizeAVGPerRoom(roomID: number): number {
				const roomIDName = loadContext.roomPrefix + roomID;
				const StreamsFileAVGSizePerUser: Array<number> = [];
				for (let userID = Number(loadContext.loadVideoPubUsers); userID < loadContext.loadUsers; userID++) {
					const folder = `${loadContext.MultiContext[roomID].StreamsOutputFilesPath}${loadContext.MultiContext[roomID].meetingId}/user_${roomIDName}_${userID}`;
					LOGGER.info({ test: loadContext.currentTest, action: "folderr: ", data: folder });
					StreamsFileAVGSizePerUser.push(calculateFileSizeAVGPerUser(folder));
				}
				LOGGER.info({
					test: loadContext.currentTest,
					action: "==StreamsFileAVGSizePerUser: ",
					data: StreamsFileAVGSizePerUser,
				});
				if (loadContext.loadUsers - loadContext.loadVideoPubUsers > 1) {
					LOGGER.info({
						test: loadContext.currentTest,
						action: "standardDeviationPerUser: ",
						data: getStandardDevitation(StreamsFileAVGSizePerUser),
					});
					expect(getStandardDevitation(StreamsFileAVGSizePerUser)).toBeLessThan(
						Number(Number(process.env[sd]) * 1000000)
					);
				}

				return getMean(StreamsFileAVGSizePerUser);
			}
			function calculateFileSizeAVGPerUser(folder: string): number {
				const StreamsFileAVGSizePerFile: Array<number> = [];

				const files = fs.readdirSync(folder);
				files.forEach((element) => {
					if (element.split("_")[1]) {
						const stats = fs.statSync(`${folder}/${element}`);
						StreamsFileAVGSizePerFile.push(stats["size"]);
					}
				});

				LOGGER.info({
					test: loadContext.currentTest,
					action: "StreamsFileAVGSizePerFile: ",
					data: StreamsFileAVGSizePerFile,
				});

				return getMean(StreamsFileAVGSizePerFile);
			}
			try {
				if (process.env[stream] == "TRUE" || process.env[stream] == "true") {
					const StreamsFileAVGSizePerRoom: Array<number> = [];
					for (let roomID = 1; roomID < Number(loadContext.loadRooms) + 1; roomID++) {
						StreamsFileAVGSizePerRoom.push(calculateFileSizeAVGPerRoom(roomID));
					}

					if (Number(loadContext.loadRooms) > 1) {
						LOGGER.info({
							test: loadContext.currentTest,
							action: "standardDeviationPerRoom: ",
							data: getStandardDevitation(StreamsFileAVGSizePerRoom),
						});
						expect(getStandardDevitation(StreamsFileAVGSizePerRoom)).toBeLessThan(
							Number(Number(process.env[sd]) * 1000000)
						);
					}
				}
			} catch (e) {
				LOGGER.error({
					test: loadContext.currentTest,
					action: "############# validateStreamFilesSize",
					data: e.message,
				});
				expect(e).handleException();
			}
		}
	);
};

const timeOut = async (delay: number, roomID?: number) => {
	await new Promise<void>((resolve) => {
		setTimeout(() => {
			return resolve();
		}, delay * 1000 * (roomID ? roomID : 1));
	});
};

const getStreamFile = (userId: number, loadVideoPubUsers: number, loadSpeakUsers: number): string => {
	const streamFileType: string = userId < loadVideoPubUsers ? "video" : "audio";
	const streamFileNumber: number =
		userId < loadVideoPubUsers
			? userId < 4
				? userId + 1
				: 4
			: userId - loadVideoPubUsers < 5
			? userId - loadVideoPubUsers + 1
			: 5;
	return streamFileType + streamFileNumber;
};

const getStandardDevitation = (data) => {
	const m = getMean(data);
	return Math.sqrt(
		data.reduce(function (sq, n) {
			return sq + Math.pow(n - m, 2);
		}, 0) /
			(data.length - 1)
	);
};

const getMean = (data) => {
	return (
		data.reduce(function (a, b) {
			return Number(a) + Number(b);
		}) / data.length
	);
};

const shortRstring = () => {
	const random = Math.floor(Math.random() * 1e4).toString();
	return random;
};

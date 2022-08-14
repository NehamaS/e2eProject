import { defineFeature, loadFeature } from "jest-cucumber";
import {
	createConferenceRoom,
	destroyConferenceRoom,
	setConferenceId,
	streamSleep,
	systemSetup,
	wait,
} from "../../steps/conf.room";
import {
	inviteParticipants,
	leaveParticipants,
	reInviteParticipant,
	inviteParticipant,
	startStreams,
	recorderInfo,
	recorderNotifyInfoValidation,
	stopStreams,
	validateRecorderFileSize,
} from "../../steps/conf.publisher";
import { McuService } from "../../common/sip/mcu.service";
import { Context } from "../../common/context";
import { Participant } from "../../common/sip/dto/controlSession";
import { SipClient } from "../../common/sip/sipClient";
import { SipValidator } from "../../common/sip/validators/sip.validator";
import { calcSipClientPort, skipByEnvironment } from "../../steps/common.steps.utils";
import { MANUAL_SIP_PORT, ROOM_TYPE_SCRSH, SCREEN_SHARE_SIP_PORT } from "../../common/constants";
import { LOGGER } from "../../common/logger.service";

const audioFeature = loadFeature("manual/features/conference-manual.feature");

jest.setTimeout(500000);

defineFeature(audioFeature, (test) => {
	const sipClient: SipClient = new SipClient(calcSipClientPort(MANUAL_SIP_PORT, true));
	const sipService: McuService = new McuService(sipClient, new SipValidator());

	beforeAll(() => {
		sipClient.start();
	});
	afterAll(() => {
		sipClient.stop();
	});

	const doScreenShare = async (user: string, type: string, context: Context) => {
		LOGGER.debug({ action: `${user} is ${type}` });
		const publisher: Participant = <Participant>{
			meetingID: "context",
			Participant: user,
			roomType: ROOM_TYPE_SCRSH,
		};
		await inviteParticipant(publisher, sipService, context);
	};

	const BASIC_TEST = "close room cleanup";
	test(BASIC_TEST, ({ given, when, and, then }) => {
		const context: Context = new Context();
		context.currentTest = BASIC_TEST;
		systemSetup(given, sipClient.getPort(), context);
		setConferenceId(given, context);
		createConferenceRoom(when, sipService, context);
		inviteParticipants(and, sipService, context);
		then(/Sleep (\d+) sec/, async (delay) => {
			await new Promise<void>((resolve) => {
				setTimeout(() => {
					LOGGER.debug("sleeping 5 sec");
					return resolve();
				}, delay * 1000);
			});
		});
		createConferenceRoom(when, sipService, context);
		destroyConferenceRoom(and, sipService, context);
	});

	const METRICS_TEST = "metrics test";
	test(METRICS_TEST, ({ given, when, then, and }) => {
		const context: Context = new Context();
		context.currentTest = METRICS_TEST;
		//Get mMCU home
		systemSetup(given, sipClient.getPort(), context);
		setConferenceId(given, context);
		createConferenceRoom(when, sipService, context);
		inviteParticipants(and, sipService, context);
		//createConferenceRoom(when, sipService, context);
		inviteParticipants(and, sipService, context);
		wait(then);
		leaveParticipants(and, sipService, context);
		//destroyConferenceRoom(and, sipService, context);
		destroyConferenceRoom(and, sipService, context);
	});

	const SS_RECONNECT = "Screen share reconnect";
	test(SS_RECONNECT, ({ given, when, then, and }) => {
		const context: Context = new Context();
		context.currentTest = SS_RECONNECT;

		systemSetup(given, sipClient.getPort(), context);
		setConferenceId(given, context);
		createConferenceRoom(when, sipService, context);
		inviteParticipants(and, sipService, context);
		createConferenceRoom(when, sipService, context);
		then(/(.*?) is (.*?)$/, async (user: string, type: string) => {
			await doScreenShare(user, type, context);
		});
		reInviteParticipant(and, sipService, context);
		leaveParticipants(and, sipService, context);
		//Screen share
		destroyConferenceRoom(and, sipService, context);
		//Audio
		destroyConferenceRoom(and, sipService, context);
	});

	const MANUAL_CLOUD_RECORDER_REMOVE_CLIENT = "remove recorder client while recording";
	test(MANUAL_CLOUD_RECORDER_REMOVE_CLIENT, ({ given, when, then, and }) => {
		const context: Context = new Context();
		context.currentTest = MANUAL_CLOUD_RECORDER_REMOVE_CLIENT;
		systemSetup(given, sipClient.getPort(), context);
		skipByEnvironment(then, context);
		setConferenceId(given, context);
		createConferenceRoom(when, sipService, context);
		inviteParticipants(and, sipService, context);
		startStreams(and, sipService, context);
		recorderInfo(and, sipService, context);
		streamSleep(then);
		// manually remone the recorder client pod the record that meeting
		// verify other recorder client continue the recording
		recorderInfo(and, sipService, context);
		recorderNotifyInfoValidation(then, sipService, context);
		recorderNotifyInfoValidation(then, sipService, context);
		streamSleep(then);
		recorderInfo(and, sipService, context);
		recorderNotifyInfoValidation(then, sipService, context);
		recorderNotifyInfoValidation(then, sipService, context);
		streamSleep(then);
		stopStreams(and, sipService, context);
		// validateRecorderFileSize(then, sipService, context);
		leaveParticipants(and, sipService, context);
		destroyConferenceRoom(and, sipService, context);
	});

	const MANUAL_CLOUD_RECORDER_REMOVE_CONTROLLER = "remove recorder controller while record";
	test(MANUAL_CLOUD_RECORDER_REMOVE_CLIENT, ({ given, when, then, and }) => {
		const context: Context = new Context();
		context.currentTest = MANUAL_CLOUD_RECORDER_REMOVE_CONTROLLER;
		systemSetup(given, sipClient.getPort(), context);
		skipByEnvironment(then, context);
		setConferenceId(given, context);
		createConferenceRoom(when, sipService, context);
		inviteParticipants(and, sipService, context);
		startStreams(and, sipService, context);
		recorderInfo(and, sipService, context);
		streamSleep(then);
		// remove recorder controller pod
		// verify record file exist on recorder client memory
		stopStreams(and, sipService, context);
		leaveParticipants(and, sipService, context);
		destroyConferenceRoom(and, sipService, context);
	});

	const CLOUD_RECORDER_RECORD_LIMIT_TIME = "record more then the record limit time";
	test(CLOUD_RECORDER_RECORD_LIMIT_TIME, ({ given, when, then, and }) => {
		const context: Context = new Context();
		context.currentTest = CLOUD_RECORDER_RECORD_LIMIT_TIME;
		systemSetup(given, sipClient.getPort(), context);
		skipByEnvironment(then, context);
		setConferenceId(given, context);
		createConferenceRoom(when, sipService, context);
		inviteParticipants(and, sipService, context);
		startStreams(and, sipService, context);
		recorderInfo(and, sipService, context);
		streamSleep(then);
		stopStreams(and, sipService, context);
		validateRecorderFileSize(then, sipService, context);
		leaveParticipants(and, sipService, context);
		destroyConferenceRoom(and, sipService, context);
	});
});

import { Context } from "../../common/context";
import {
	createConferenceRoom,
	destroyConferenceRoom,
	setConferenceId,
	systemSetup,
	streamSleep,
	wait,
	setCaseType,
	setInfoType,
	destroyConferenceRoomWithoutControllSession,
} from "../conf.room";
import {
	inviteParticipantsWithDialogInUser,
	leaveParticipantsWithDTMF,
	startStreams,
	stopStreams,
	streamsValidate,
	dtmfNotifyInfoValidation,
	inviteParticipants,
	sendInfo,
	leaveParticipants,
	dtmfNotifyInfoValidationAMTSupport,
	reInviteParticipant,
	inviteParticipantWithoutConference,
	infoParticipantJoin,
} from "../conf.publisher";
import { defineFeature, loadFeature } from "jest-cucumber";
import { SipClient } from "../../common/sip/sipClient";
import { McuService } from "../../common/sip/mcu.service";
import { SipValidator } from "../../common/sip/validators/sip.validator";
import { calcSipClientPort, skipByEnvironment } from "../common.steps.utils";
import { DTMF_SIP_PORT } from "../../common/constants";
import { NotificationMeta } from "../../common/sip/dto/controlSession";

const audioFeature = loadFeature("features/DTMF/conference-DTMF.feature");

jest.setTimeout(500000);

defineFeature(audioFeature, (test) => {
	const sipClient: SipClient = new SipClient(calcSipClientPort(DTMF_SIP_PORT));
	const sipService: McuService = new McuService(sipClient, new SipValidator());

	beforeAll(() => {
		sipClient.start();
	});
	afterAll(() => {
		sipClient.stop();
	});

	const DTMF_USER = "add user via DTMF";
	test(DTMF_USER, ({ given, when, and, then }) => {
		const context: Context = new Context();
		context.currentTest = DTMF_USER;
		systemSetup(given, sipClient.getPort(), context);
		setConferenceId(given, context);
		createConferenceRoom(when, sipService, context);
		inviteParticipantsWithDialogInUser(and, sipService, context);
		leaveParticipantsWithDTMF(and, sipService, context);
		destroyConferenceRoom(then, sipService, context);
	});

	const PLAY_COLLECT = "user dial-in to conference, infoType PLAY_COLLECT";
	test(PLAY_COLLECT, ({ given, when, and, then }) => {
		const context: Context = new Context();
		context.currentTest = PLAY_COLLECT;
		systemSetup(given, sipClient.getPort(), context);
		setConferenceId(given, context);
		createConferenceRoom(when, sipService, context);
		inviteParticipantsWithDialogInUser(and, sipService, context);
		startStreams(and, sipService, context);
		dtmfNotifyInfoValidation(then, sipService, context);
		dtmfNotifyInfoValidation(then, sipService, context);
		streamSleep(then);
		streamsValidate(and, sipService, context);
		stopStreams(and, sipService, context);
		leaveParticipantsWithDTMF(and, sipService, context);
		destroyConferenceRoom(then, sipService, context);
	});

	//
	// test("user dial-in to conference", ({ given, when, and, then }) => {
	// 	const context: Context = new Context();
	// 	systemSetup(given, sipClient.getPort(), context);
	// 	setConferenceId(given, context);
	// 	createConferenceRoom(when, sipService, context);
	// 	inviteParticipantsWithDTMF(and, sipService, context);
	// 	leaveParticipantsWithDTMF(and, sipService, context);
	// 	destroyConferenceRoom(then, sipService, context);
	// });

	const PLAY_NOT_EXIST_PROMPT = "user dial-in to conference, infoType PLAY_NOT_EXIST_PROMPT";
	test(PLAY_NOT_EXIST_PROMPT, ({ given, when, and, then }) => {
		const context: Context = new Context();
		context.currentTest = PLAY_NOT_EXIST_PROMPT;
		systemSetup(given, sipClient.getPort(), context);
		setConferenceId(given, context);
		createConferenceRoom(when, sipService, context);
		inviteParticipantsWithDialogInUser(and, sipService, context);
		startStreams(and, sipService, context);
		dtmfNotifyInfoValidation(then, sipService, context);
		streamSleep(then);
		destroyConferenceRoom(then, sipService, context);
	});

	const COLLECT_NOINPUT = "user dial-in to conference, infoType COLLECT_NOINPUT";
	test(COLLECT_NOINPUT, ({ given, when, and, then }) => {
		const context: Context = new Context();
		context.currentTest = COLLECT_NOINPUT;
		systemSetup(given, sipClient.getPort(), context);
		setConferenceId(given, context);
		createConferenceRoom(when, sipService, context);
		inviteParticipantsWithDialogInUser(and, sipService, context);
		startStreams(and, sipService, context);
		dtmfNotifyInfoValidation(then, sipService, context);
		dtmfNotifyInfoValidation(then, sipService, context);
		streamSleep(then);
		destroyConferenceRoom(then, sipService, context);
	});

	const COLLECT_NOMATCH = "user dial-in to conference, infoType COLLECT_NOMATCH";
	test(COLLECT_NOMATCH, ({ given, when, and, then }) => {
		const context: Context = new Context();
		context.currentTest = COLLECT_NOMATCH;
		systemSetup(given, sipClient.getPort(), context);
		setConferenceId(given, context);
		createConferenceRoom(when, sipService, context);
		inviteParticipantsWithDialogInUser(and, sipService, context);
		startStreams(and, sipService, context);
		dtmfNotifyInfoValidation(then, sipService, context);
		dtmfNotifyInfoValidation(then, sipService, context);
		streamSleep(then);
		destroyConferenceRoom(then, sipService, context);
	});

	const PLAY_WRONG_FOUND = "user dial-in to conference, infoType PLAY_WRONG_FOUND";
	test.skip(PLAY_WRONG_FOUND, ({ given, when, and, then }) => {
		const context: Context = new Context();
		context.currentTest = PLAY_WRONG_FOUND;
		systemSetup(given, sipClient.getPort(), context);
		setConferenceId(given, context);
		createConferenceRoom(when, sipService, context);
		inviteParticipantsWithDialogInUser(and, sipService, context);
		startStreams(and, sipService, context);
		dtmfNotifyInfoValidation(then, sipService, context);
		streamSleep(then);
		destroyConferenceRoom(then, sipService, context);
	});

	const MUTE_PSTN = "mute PSTN user";
	test(MUTE_PSTN, ({ given, when, then, and }) => {
		const context: Context = new Context();
		context.currentTest = MUTE_PSTN;
		systemSetup(given, sipClient.getPort(), context);
		setConferenceId(given, context);
		createConferenceRoom(when, sipService, context);
		inviteParticipants(and, sipService, context);
		startStreams(and, sipService, context);
		streamSleep(then);
		sendInfo(and, sipService, context);
		startStreams(and, sipService, context);
		dtmfNotifyInfoValidation(then, sipService, context);
		dtmfNotifyInfoValidation(then, sipService, context);
		streamSleep(then);
		streamsValidate(and, sipService, context);
		stopStreams(and, sipService, context);
		leaveParticipants(and, sipService, context);
		destroyConferenceRoom(and, sipService, context);
	});

	const PLAY_AMT = "support play.amt";
	test(PLAY_AMT, ({ given, when, and, then }) => {
		const context: Context = new Context();
		context.currentTest = PLAY_AMT;
		systemSetup(given, sipClient.getPort(), context);
		setConferenceId(given, context);
		createConferenceRoom(when, sipService, context);
		inviteParticipantsWithDialogInUser(and, sipService, context);
		startStreams(and, sipService, context);
		dtmfNotifyInfoValidationAMTSupport(then, sipService, context);
		dtmfNotifyInfoValidation(then, sipService, context);
		streamSleep(then);
		streamsValidate(and, sipService, context);
		stopStreams(and, sipService, context);
		leaveParticipantsWithDTMF(and, sipService, context);
		destroyConferenceRoom(then, sipService, context);
	});

	const HOLD_PLAY = "play in HOLD user";
	test(HOLD_PLAY, ({ given, when, then, and }) => {
		const context: Context = new Context();
		context.currentTest = HOLD_PLAY;
		systemSetup(given, sipClient.getPort(), context);
		setConferenceId(given, context);
		createConferenceRoom(when, sipService, context);
		inviteParticipants(and, sipService, context);
		reInviteParticipant(and, sipService, context);
		reInviteParticipant(and, sipService, context);
		// startStreams(and, sipService, context);
		// streamSleep(then);
		sendInfo(and, sipService, context);
		dtmfNotifyInfoValidationAMTSupport(then, sipService, context);
		dtmfNotifyInfoValidation(then, sipService, context);
		streamSleep(then);
		// streamsValidate(and, sipService, context);
		// stopStreams(and, sipService, context);
		leaveParticipants(and, sipService, context);
		destroyConferenceRoom(and, sipService, context);
	});

	const PSTN_NO_CONTROLL_SESSION = "PSTN user without controll session";
	test(PSTN_NO_CONTROLL_SESSION, ({ given, when, and, then }) => {
		const context: Context = new Context();
		context.currentTest = PSTN_NO_CONTROLL_SESSION;
		systemSetup(given, sipClient.getPort(), context);
		skipByEnvironment(then, context);
		setConferenceId(given, context);
		setCaseType(given, context);
		setInfoType(given, context);
		inviteParticipantWithoutConference(when, sipService, context);
		infoParticipantJoin(and, sipService, context);
		startStreams(and, sipService, context);
		dtmfNotifyInfoValidation(then, sipService, context, false);
		dtmfNotifyInfoValidation(then, sipService, context, false);
		streamSleep(then);
		stopStreams(and, sipService, context);
		leaveParticipantsWithDTMF(and, sipService, context);
	});

	const PLAY_COLLECT_STOP = "user dial-in to conference, infoType PLAY_COLLECT and stop";
	test(PLAY_COLLECT_STOP, ({ given, when, and, then }) => {
		const context: Context = new Context();
		context.currentTest = PLAY_COLLECT_STOP;
		systemSetup(given, sipClient.getPort(), context);
		setConferenceId(given, context);
		createConferenceRoom(when, sipService, context);
		inviteParticipantsWithDialogInUser(and, sipService, context);
		sendInfo(and, sipService, context);
		startStreams(and, sipService, context);
		//dtmfNotifyInfoValidation(then, sipService, context);
		//dtmfNotifyInfoValidation(then, sipService, context);
		streamSleep(then);
		streamsValidate(and, sipService, context);
		stopStreams(and, sipService, context);
		leaveParticipantsWithDTMF(and, sipService, context);
		destroyConferenceRoom(then, sipService, context);
	});

	const PLAY_AMT_STOP = "user dial-in to conference, infoType PLAY and STOP";
	test(PLAY_AMT_STOP, ({ given, when, and, then }) => {
		const context: Context = new Context();
		context.currentTest = PLAY_AMT_STOP;
		systemSetup(given, sipClient.getPort(), context);
		setConferenceId(given, context);
		createConferenceRoom(when, sipService, context);
		inviteParticipantsWithDialogInUser(and, sipService, context);
		sendInfo(and, sipService, context);
		startStreams(and, sipService, context);
		dtmfNotifyInfoValidationAMTSupport(then, sipService, context);
		dtmfNotifyInfoValidation(then, sipService, context);
		streamSleep(then);
		streamsValidate(and, sipService, context);
		stopStreams(and, sipService, context);
		leaveParticipantsWithDTMF(and, sipService, context);
		destroyConferenceRoom(then, sipService, context);
	});
});

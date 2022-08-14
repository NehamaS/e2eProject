import { defineFeature, loadFeature } from "jest-cucumber";
import {
	createConferenceRoom,
	createConferenceRooms,
	createConferenceRoomWithError,
	destroyConferenceRoom,
	setConferenceId,
	streamSleep,
	systemSetup,
	verifyRoomInviteResponseCode,
	createConferenceRoomWithHeader,
	destroyConferenceRoomWithoutControllSession,
	verifyInfoConfId,
	setCaseType,
} from "./conf.room";
import {
	bulkInviteParticipants,
	bulkLeaveParticipants,
	hold,
	inviteParticipants,
	inviteParticipantsWithoutSDP,
	inviteParticipantWithCorruptHeader,
	inviteParticipantWithCorruptSDP,
	inviteParticipantWithError,
	infoParticipantWithError,
	leaveParticipants,
	mute,
	muteAll,
	NonStandartInviteHeader,
	reInviteParticipant,
	reInviteParticipantWithDeviceId,
	startStreams,
	stopStreams,
	streamsValidate,
	verifyInviteResponseCode,
	verifyInfoResponseCode,
	inviteParticipantWithoutConference,
	infoParticipantCreateConference,
	infoParticipantJoin,
	recorderInfo,
	sendInfo,
	dtmfNotifyInfoValidationAMTSupport,
	dtmfNotifyInfoValidation,
	recorderNotifyInfoValidation,
	inviteParticipantWithUnsupportedCodec,
	verifyDiffToTag,
} from "./conf.publisher";
import { McuService } from "../common/sip/mcu.service";
import { Context, LoadContext } from "../common/context";
import { SipClient } from "../common/sip/sipClient";
import { SipValidator } from "../common/sip/validators/sip.validator";
import { calcSipClientPort, skipByEnvironment } from "./common.steps.utils";
import { destroyRoomWithParticipants, openRoomsWithParticipants, setLoadValues } from "../load/steps/load.room";
import { AUDIO_PSTN_SIP_PORT } from "../common/constants";

const audioFeature = loadFeature("features/audio-pstn.feature");

jest.setTimeout(500000);

defineFeature(audioFeature, (test) => {
	const sipClient: SipClient = new SipClient(calcSipClientPort(AUDIO_PSTN_SIP_PORT));
	const sipService: McuService = new McuService(sipClient, new SipValidator());

	beforeAll(() => {
		sipClient.start();
	});
	afterAll(() => {
		sipClient.stop();
	});

	const BASIC_PSTN = "basic audio conference room PSTN users";
	test(BASIC_PSTN, ({ given, when, then, and }) => {
		const context: Context = new Context();
		context.currentTest = BASIC_PSTN;
		//Get mMCU home
		systemSetup(given, sipClient.getPort(), context);
		setConferenceId(given, context);
		createConferenceRoom(when, sipService, context);
		inviteParticipants(and, sipService, context);
		startStreams(and, sipService, context);
		streamSleep(then);
		leaveParticipants(and, sipService, context);
		streamsValidate(and, sipService, context);
		stopStreams(and, sipService, context);
		destroyConferenceRoom(and, sipService, context);
	});

	const PSTN_MISSING_HEADER =
		"add PSTN participant with missingCallerID - Expected to get succeed response on header";
	test(PSTN_MISSING_HEADER, ({ given, when, then, and }) => {
		const context: Context = new Context();
		context.currentTest = PSTN_MISSING_HEADER;
		//Get mMCU home
		systemSetup(given, sipClient.getPort(), context);
		setConferenceId(given, context);
		createConferenceRoom(when, sipService, context);
		inviteParticipants(and, sipService, context);
		NonStandartInviteHeader(and, sipService, context);
		leaveParticipants(and, sipService, context);
		destroyConferenceRoom(and, sipService, context);
	});

	// const PSTN_DATA_CHANNEL = "add PSTN user to data-channel room";
	// test(PSTN_DATA_CHANNEL, ({ given, when, then, and }) => {
	// 	const context: Context = new Context();
	// 	context.currentTest = PSTN_DATA_CHANNEL;
	// 	systemSetup(given, sipClient.getPort(), context);
	// 	setConferenceId(given, context);
	// 	createConferenceRoom(when, sipService, context);
	// 	createConferenceRoom(when, sipService, context);
	// 	inviteParticipants(and, sipService, context);
	// 	leaveParticipants(and, sipService, context);
	// 	destroyConferenceRoom(and, sipService, context);
	// 	destroyConferenceRoom(and, sipService, context);
	// });

	const SELF_MUTE_PSTN = "audio conference - PSTN user self mute";
	test(SELF_MUTE_PSTN, ({ given, when, then, and }) => {
		const context: Context = new Context();
		context.currentTest = "audio conference - PSTN user self mute";
		//Get mMCU home
		systemSetup(given, sipClient.getPort(), context);
		setConferenceId(given, context);
		createConferenceRoom(when, sipService, context);
		inviteParticipants(and, sipService, context);
		startStreams(and, sipService, context);
		mute(and, sipService, context);
		streamSleep(then);
		mute(and, sipService, context);
		streamSleep(then);
		leaveParticipants(and, sipService, context);
		streamsValidate(and, sipService, context);
		stopStreams(and, sipService, context);
		destroyConferenceRoom(and, sipService, context);
	});

	const MUTEALL_PSTN = "audio conference - mute all include PSTN user";
	test(MUTEALL_PSTN, ({ given, when, then, and }) => {
		const context: Context = new Context();
		context.currentTest = "audio conference - mute all include PSTN user";
		//Get mMCU home
		systemSetup(given, sipClient.getPort(), context);
		setConferenceId(given, context);
		createConferenceRoom(when, sipService, context);
		inviteParticipants(and, sipService, context);
		startStreams(and, sipService, context);
		muteAll(and, sipService, context);
		streamSleep(then);
		muteAll(and, sipService, context);
		streamSleep(then);
		leaveParticipants(and, sipService, context);
		streamsValidate(and, sipService, context);
		stopStreams(and, sipService, context);
		destroyConferenceRoom(and, sipService, context);
	});

	const PSTN_ON_HOLD = "add pstn user on hold";
	test(PSTN_ON_HOLD, ({ given, when, and, then }) => {
		const context: Context = new Context();
		context.currentTest = "add pstn user on hold";
		systemSetup(given, sipClient.getPort(), context);
		setConferenceId(given, context);
		createConferenceRoom(when, sipService, context);
		inviteParticipantsWithoutSDP(and, sipService, context);
		reInviteParticipant(and, sipService, context);
		leaveParticipants(and, sipService, context);
		destroyConferenceRoom(then, sipService, context);
	});

	const NO_DISCONNECT_AFTER_PSTN_LEAVE = "Users are not disconnect after PSTN user leave the meeting";
	test(NO_DISCONNECT_AFTER_PSTN_LEAVE, ({ given, when, then, and }) => {
		const context: Context = new Context();
		context.currentTest = NO_DISCONNECT_AFTER_PSTN_LEAVE;
		systemSetup(given, sipClient.getPort(), context);
		setConferenceId(given, context);
		createConferenceRoom(when, sipService, context);
		inviteParticipants(and, sipService, context);
		leaveParticipants(and, sipService, context);
		streamSleep(then);
		leaveParticipants(and, sipService, context);
		destroyConferenceRoom(and, sipService, context);
	});
});

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
import { AUDIO_ONE_ON_ONE_SIP_PORT } from "../common/constants";

const audioFeature = loadFeature("features/audio-one-on-one.feature");

jest.setTimeout(500000);

defineFeature(audioFeature, (test) => {
	const sipClient: SipClient = new SipClient(calcSipClientPort(AUDIO_ONE_ON_ONE_SIP_PORT));
	const sipService: McuService = new McuService(sipClient, new SipValidator());

	beforeAll(() => {
		sipClient.start();
	});
	afterAll(() => {
		sipClient.stop();
	});

	const WITH_NAME_HEADER = "create conference with name header";
	test(WITH_NAME_HEADER, ({ given, when, then, and }) => {
		const context: Context = new Context();
		context.currentTest = WITH_NAME_HEADER;
		systemSetup(given, sipClient.getPort(), context);
		setConferenceId(given, context);
		createConferenceRoom(when, sipService, context);
		verifyInfoConfId(and, sipService, context);
	});

	const WITH_RECORD_HEADER = "create conference without name header and with record headers";
	test(WITH_RECORD_HEADER, ({ given, when, then, and }) => {
		const context: Context = new Context();
		context.currentTest = WITH_RECORD_HEADER;
		systemSetup(given, sipClient.getPort(), context);
		setConferenceId(given, context);
		createConferenceRoomWithHeader(when, sipService, context);
		verifyInfoConfId(and, sipService, context);
	});

	const WITHOUT_RECORD_HEADER = "create conference without name header and without record headers";
	test(WITHOUT_RECORD_HEADER, ({ given, when, then, and }) => {
		const context: Context = new Context();
		context.currentTest = WITHOUT_RECORD_HEADER;
		systemSetup(given, sipClient.getPort(), context);
		setConferenceId(given, context);
		createConferenceRoomWithHeader(when, sipService, context);
		verifyInfoConfId(and, sipService, context);
	});

	const INVITE_WITHOUT_NAME = "add users without create conference with recording header";
	test(INVITE_WITHOUT_NAME, ({ given, when, then, and }) => {
		const context: Context = new Context();
		context.currentTest = INVITE_WITHOUT_NAME;
		systemSetup(given, sipClient.getPort(), context);
		setConferenceId(given, context);
		setCaseType(given, context);
		inviteParticipantWithoutConference(when, sipService, context);
		infoParticipantCreateConference(and, sipService, context);
		infoParticipantJoin(and, sipService, context);
		inviteParticipantWithoutConference(when, sipService, context);
		infoParticipantJoin(and, sipService, context);
		streamSleep(then);
		destroyConferenceRoomWithoutControllSession(and, sipService, context);
	});
	const INVITE_WITHOUT_NAME_WITH_LEAVE =
		"add users without create conference with recording header with leave participants";
	test(INVITE_WITHOUT_NAME_WITH_LEAVE, ({ given, when, then, and }) => {
		const context: Context = new Context();
		context.currentTest = INVITE_WITHOUT_NAME_WITH_LEAVE;
		systemSetup(given, sipClient.getPort(), context);
		setConferenceId(given, context);
		setCaseType(given, context);
		inviteParticipantWithoutConference(when, sipService, context);
		infoParticipantCreateConference(and, sipService, context);
		infoParticipantJoin(and, sipService, context);
		inviteParticipantWithoutConference(when, sipService, context);
		infoParticipantJoin(and, sipService, context);
		streamSleep(then);
		leaveParticipants(and, sipService, context);
		destroyConferenceRoomWithoutControllSession(and, sipService, context);
	});

	const ONE_ON_ONE_USER_HOLD_RESUME = "one on one - one user hold resume";
	test(ONE_ON_ONE_USER_HOLD_RESUME, ({ given, when, then, and }) => {
		const context: Context = new Context();
		context.currentTest = ONE_ON_ONE_USER_HOLD_RESUME;
		systemSetup(given, sipClient.getPort(), context);
		skipByEnvironment(then, context);
		setConferenceId(given, context);
		setCaseType(given, context);
		inviteParticipantWithoutConference(when, sipService, context);
		infoParticipantCreateConference(and, sipService, context);
		infoParticipantJoin(and, sipService, context);
		startStreams(and, sipService, context);
		streamSleep(then);
		reInviteParticipant(and, sipService, context);
		reInviteParticipant(and, sipService, context);
		reInviteParticipant(and, sipService, context);
		reInviteParticipant(and, sipService, context);
		destroyConferenceRoomWithoutControllSession(and, sipService, context);
	});

	const ONE_ON_ONE_USER_MOH = "one on one - one user play music on hold";
	test(ONE_ON_ONE_USER_MOH, ({ given, when, then, and }) => {
		const context: Context = new Context();
		context.currentTest = ONE_ON_ONE_USER_MOH;
		systemSetup(given, sipClient.getPort(), context);
		skipByEnvironment(then, context);
		setConferenceId(given, context);
		setCaseType(given, context);
		inviteParticipantWithoutConference(when, sipService, context);
		infoParticipantCreateConference(and, sipService, context);
		infoParticipantJoin(and, sipService, context);
		startStreams(and, sipService, context);
		streamSleep(then);
		reInviteParticipant(and, sipService, context);
		sendInfo(and, sipService, context);
		dtmfNotifyInfoValidationAMTSupport(then, sipService, context);
		dtmfNotifyInfoValidation(then, sipService, context);
		streamSleep(then);
		reInviteParticipant(and, sipService, context);
		reInviteParticipant(and, sipService, context);
		sendInfo(and, sipService, context);
		dtmfNotifyInfoValidationAMTSupport(then, sipService, context);
		dtmfNotifyInfoValidation(then, sipService, context);
		streamSleep(then);
		reInviteParticipant(and, sipService, context);
		destroyConferenceRoomWithoutControllSession(and, sipService, context);
	});

	const ONE_ON_ONE_USER_MOH_DONT_WAIT_TO_END = "one on one - one user play music on hold not wait to end";
	test(ONE_ON_ONE_USER_MOH_DONT_WAIT_TO_END, ({ given, when, then, and }) => {
		const context: Context = new Context();
		context.currentTest = ONE_ON_ONE_USER_MOH_DONT_WAIT_TO_END;
		systemSetup(given, sipClient.getPort(), context);
		skipByEnvironment(then, context);
		setConferenceId(given, context);
		setCaseType(given, context);
		inviteParticipantWithoutConference(when, sipService, context);
		infoParticipantCreateConference(and, sipService, context);
		infoParticipantJoin(and, sipService, context);
		startStreams(and, sipService, context);
		streamSleep(then);
		reInviteParticipant(and, sipService, context);
		sendInfo(and, sipService, context);
		streamSleep(then);
		reInviteParticipant(and, sipService, context);
		dtmfNotifyInfoValidationAMTSupport(then, sipService, context);
		dtmfNotifyInfoValidation(then, sipService, context);
		streamSleep(then);
		reInviteParticipant(and, sipService, context);
		sendInfo(and, sipService, context);
		dtmfNotifyInfoValidationAMTSupport(then, sipService, context);
		dtmfNotifyInfoValidation(then, sipService, context);
		streamSleep(then);
		reInviteParticipant(and, sipService, context);
		destroyConferenceRoomWithoutControllSession(and, sipService, context);
	});

	const ONE_ON_ONE_TWO_USERS_MOH = "one on one - two users play music on hold";
	test(ONE_ON_ONE_TWO_USERS_MOH, ({ given, when, then, and }) => {
		const context: Context = new Context();
		context.currentTest = ONE_ON_ONE_TWO_USERS_MOH;
		systemSetup(given, sipClient.getPort(), context);
		skipByEnvironment(then, context);
		setConferenceId(given, context);
		setCaseType(given, context);
		inviteParticipantWithoutConference(when, sipService, context);
		infoParticipantCreateConference(and, sipService, context);
		infoParticipantJoin(and, sipService, context);
		inviteParticipantWithoutConference(when, sipService, context);
		infoParticipantJoin(and, sipService, context);
		startStreams(and, sipService, context);
		streamSleep(then);
		reInviteParticipant(and, sipService, context);
		reInviteParticipant(and, sipService, context);
		sendInfo(and, sipService, context);
		streamSleep(then);
		reInviteParticipant(and, sipService, context);
		dtmfNotifyInfoValidationAMTSupport(then, sipService, context);
		dtmfNotifyInfoValidation(then, sipService, context);
		streamSleep(then);
		reInviteParticipant(and, sipService, context);
		destroyConferenceRoomWithoutControllSession(and, sipService, context);
	});
});

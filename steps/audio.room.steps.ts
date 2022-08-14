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

const audioFeature = loadFeature("features/conference-audio.feature");

jest.setTimeout(500000);

defineFeature(audioFeature, (test) => {
	const sipClient: SipClient = new SipClient(calcSipClientPort());
	const sipService: McuService = new McuService(sipClient, new SipValidator());

	beforeAll(() => {
		sipClient.start();
	});
	afterAll(() => {
		sipClient.stop();
	});

	const BASIC_TEST = "basic audio conference room";
	test(BASIC_TEST, ({ given, when, then, and }) => {
		const context: Context = new Context();
		context.currentTest = BASIC_TEST;
		//Get mMCU home
		systemSetup(given, sipClient.getPort(), context);
		setConferenceId(given, context);
		createConferenceRoom(when, sipService, context);
		inviteParticipants(and, sipService, context);
		//	createConferenceRoom(when, sipService, context);
		inviteParticipants(and, sipService, context);
		leaveParticipants(and, sipService, context);
		destroyConferenceRoom(and, sipService, context);
		//	destroyConferenceRoom(and, sipService, context);
	});

	const HEADER_ERROR = "audio conference room, missing caller id - return Error on header";
	test(HEADER_ERROR, async ({ given, when, and }) => {
		const context: Context = new Context();
		context.currentTest = HEADER_ERROR;
		systemSetup(given, sipClient.getPort(), context);
		setConferenceId(given, context);
		createConferenceRoom(when, sipService, context);
		inviteParticipantWithCorruptHeader(and, sipService, context);
		verifyInviteResponseCode(and, sipService, context);
		destroyConferenceRoom(and, sipService, context);
	});

	const ADD_USER_TEST = "add user to not exist meeting";
	test(ADD_USER_TEST, async ({ given, when, and }) => {
		const context: Context = new Context();
		context.currentTest = ADD_USER_TEST;
		systemSetup(given, sipClient.getPort(), context);
		setConferenceId(given, context);
		createConferenceRoom(when, sipService, context);
		inviteParticipantWithError(and, sipService, context);
		verifyInviteResponseCode(and, sipService, context);
		destroyConferenceRoom(and, sipService, context);
	});

	const WRONG_SDP = "add user with wrong SDP";
	test(WRONG_SDP, async ({ given, when, and }) => {
		const context: Context = new Context();
		context.currentTest = WRONG_SDP;
		systemSetup(given, sipClient.getPort(), context);
		setConferenceId(given, context);
		createConferenceRoom(when, sipService, context);
		inviteParticipantWithError(and, sipService, context);
		verifyInviteResponseCode(and, sipService, context);
		destroyConferenceRoom(and, sipService, context);
	});

	const WRONG_MSML = "add user with wrong msml";
	test(WRONG_MSML, async ({ given, when, and }) => {
		const context: Context = new Context();
		context.currentTest = WRONG_MSML;
		systemSetup(given, sipClient.getPort(), context);
		setConferenceId(given, context);
		createConferenceRoom(when, sipService, context);
		infoParticipantWithError(and, sipService, context);
		verifyInfoResponseCode(and, sipService, context);
		destroyConferenceRoom(and, sipService, context);
	});

	// const PARALLEL_ROOM_CREATION = "open audio and DC rooms in parallel";
	// test(PARALLEL_ROOM_CREATION, ({ given, when, then, and }) => {
	// 	const context: Context = new Context();
	// 	context.currentTest = PARALLEL_ROOM_CREATION;
	// 	//Get mMCU home
	// 	systemSetup(given, sipClient.getPort(), context);
	// 	setConferenceId(given, context);
	// 	createConferenceRooms(when, sipService, context);
	// 	inviteParticipants(and, sipService, context);
	// 	leaveParticipants(and, sipService, context);
	// 	destroyConferenceRoom(and, sipService, context);
	// 	destroyConferenceRoom(and, sipService, context);
	// });

	const MUTE_UN_MUTE = "audio conference room, mute and unmute";
	test(MUTE_UN_MUTE, ({ given, when, then, and }) => {
		const context: Context = new Context();
		context.currentTest = "audio conference room, mute and unmute";
		//Get mMCU home
		systemSetup(given, sipClient.getPort(), context);
		setConferenceId(given, context);
		createConferenceRoom(when, sipService, context);
		inviteParticipants(and, sipService, context);
		//	createConferenceRoom(when, sipService, context);
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
		//destroyConferenceRoom(and, sipService, context);
	});

	const UNMUTE_ALL = "audio conference room, muteAll and unmuteAll";
	test(UNMUTE_ALL, ({ given, when, then, and }) => {
		const context: Context = new Context();
		context.currentTest = UNMUTE_ALL;
		//Get mMCU home
		systemSetup(given, sipClient.getPort(), context);
		setConferenceId(given, context);
		createConferenceRoom(when, sipService, context);
		inviteParticipants(and, sipService, context);
		//	createConferenceRoom(when, sipService, context);
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
		//	destroyConferenceRoom(and, sipService, context);
	});

	const CODEC_NOT_SUPPORTED = "not supported codec in audio mid - return Error on SDP";
	test(CODEC_NOT_SUPPORTED, ({ given, when, then, and }) => {
		const context: Context = new Context();
		context.currentTest = CODEC_NOT_SUPPORTED;
		//Get mMCU home
		systemSetup(given, sipClient.getPort(), context);
		setConferenceId(given, context);
		createConferenceRoom(when, sipService, context);
		inviteParticipantWithCorruptSDP(and, sipService, context);
		verifyInviteResponseCode(and, sipService, context);
		destroyConferenceRoom(and, sipService, context);
	});

	const EMPTY_ROOM_ERROR = "leaveParticipnat after destroy room - return Error";
	test(EMPTY_ROOM_ERROR, ({ given, when, then, and }) => {
		const context: Context = new Context();
		context.currentTest = EMPTY_ROOM_ERROR;
		systemSetup(given, sipClient.getPort(), context);
		setConferenceId(given, context);
		createConferenceRoom(when, sipService, context);
		inviteParticipants(and, sipService, context);
		destroyConferenceRoom(and, sipService, context);
		leaveParticipants(and, sipService, context);
	});

	const CLOSE_ROOM_ERROR = "destroy destroyed room - return error";
	test(CLOSE_ROOM_ERROR, ({ given, when, then, and }) => {
		const context: Context = new Context();
		context.currentTest = "destroy destroyed room - return error";
		systemSetup(given, sipClient.getPort(), context);
		setConferenceId(given, context);
		createConferenceRoom(when, sipService, context);
		destroyConferenceRoom(and, sipService, context);
		destroyConferenceRoom(and, sipService, context);
	});

	const RECREATE_ROOM = "create room twice and destroy twice";
	test(RECREATE_ROOM, ({ given, when, then }) => {
		const context: Context = new Context();
		context.currentTest = RECREATE_ROOM;
		systemSetup(given, sipClient.getPort(), context);
		setConferenceId(given, context);
		createConferenceRoom(when, sipService, context);
		createConferenceRoom(when, sipService, context);
		destroyConferenceRoom(then, sipService, context);
		destroyConferenceRoom(then, sipService, context);
	});

	const CREATE_ROOM_TWICE = "create room twice with user and destroy twice";
	test(CREATE_ROOM_TWICE, ({ given, when, and, then }) => {
		const context: Context = new Context();
		context.currentTest = CREATE_ROOM_TWICE;
		systemSetup(given, sipClient.getPort(), context);
		setConferenceId(given, context);
		createConferenceRoom(when, sipService, context);
		inviteParticipants(and, sipService, context);
		createConferenceRoom(when, sipService, context);
		destroyConferenceRoom(then, sipService, context);
		destroyConferenceRoom(then, sipService, context);
	});

	const SDP_ERROR = "create room with sdp - return error";
	test(SDP_ERROR, ({ given, when, and }) => {
		const context: Context = new Context();
		context.currentTest = SDP_ERROR;
		systemSetup(given, sipClient.getPort(), context);
		setConferenceId(given, context);
		createConferenceRoomWithError(when, sipService, context);
		verifyRoomInviteResponseCode(and, sipService, context);
	});

	const HOLD_UNHOLD = "hold unhold happy path";
	test(HOLD_UNHOLD, ({ given, when, then, and }) => {
		const context: Context = new Context();
		context.currentTest = HOLD_UNHOLD;
		systemSetup(given, sipClient.getPort(), context);
		setConferenceId(given, context);
		createConferenceRoom(when, sipService, context);
		inviteParticipants(and, sipService, context);
		hold(then, sipService, context);
		hold(then, sipService, context);
		leaveParticipants(and, sipService, context);
		destroyConferenceRoom(and, sipService, context);
	});

	const HOLD_UNHOLD_SIP = "hold unhold sip interface";
	test(HOLD_UNHOLD_SIP, ({ given, when, then, and }) => {
		const context: Context = new Context();
		context.currentTest = HOLD_UNHOLD_SIP;
		systemSetup(given, sipClient.getPort(), context);
		setConferenceId(given, context);
		createConferenceRoom(when, sipService, context);
		inviteParticipants(and, sipService, context);
		hold(then, sipService, context);
		hold(then, sipService, context);
		leaveParticipants(and, sipService, context);
		destroyConferenceRoom(and, sipService, context);
	});

	const WITHOUT_SDP = "add user without SDP";
	test(WITHOUT_SDP, ({ given, when, and, then }) => {
		const context: Context = new Context();
		context.currentTest = WITHOUT_SDP;
		systemSetup(given, sipClient.getPort(), context);
		setConferenceId(given, context);
		createConferenceRoom(when, sipService, context);
		inviteParticipantsWithoutSDP(and, sipService, context);
		leaveParticipants(and, sipService, context);
		destroyConferenceRoom(then, sipService, context);
	});

	const TEN_USERS_PARALLEL = "10 users in parallel";
	test(TEN_USERS_PARALLEL, ({ given, when, and, then }) => {
		const context: Context = new Context();
		context.currentTest = TEN_USERS_PARALLEL;
		systemSetup(given, sipClient.getPort(), context);
		setConferenceId(given, context);
		createConferenceRoom(when, sipService, context);
		bulkInviteParticipants(and, sipService, context);
		bulkLeaveParticipants(and, sipService, context);
		destroyConferenceRoom(then, sipService, context);
	});

	const MULTI_ROOMS_USERS = "X users in Y rooms in parallel";
	test(MULTI_ROOMS_USERS, ({ given, when, then, and }) => {
		const loadContext: LoadContext = new LoadContext();
		loadContext.currentTest = MULTI_ROOMS_USERS;
		setLoadValues(when, sipService, loadContext);
		openRoomsWithParticipants(and, sipService, loadContext);
		destroyRoomWithParticipants(and, sipService, loadContext);
	});

	const INVITE_WITH_USEDTX = "add user with usedtx in SDP";
	test(INVITE_WITH_USEDTX, ({ given, when, and, then }) => {
		const context: Context = new Context();
		context.currentTest = "add user with usedtx in SDP";
		systemSetup(given, sipClient.getPort(), context);
		setConferenceId(given, context);
		createConferenceRoom(when, sipService, context);
		inviteParticipantsWithoutSDP(and, sipService, context);
		leaveParticipants(and, sipService, context);
		destroyConferenceRoom(then, sipService, context);
	});

	const TEN_USERS = "open 5 rooms with 20 users, check media-gateway isReady";
	test.skip(TEN_USERS, ({ given, when, and, then }) => {
		const loadContext: LoadContext = new LoadContext();
		loadContext.currentTest = TEN_USERS;
		setLoadValues(when, sipService, loadContext);
		openRoomsWithParticipants(and, sipService, loadContext);
		streamSleep(then);
		destroyRoomWithParticipants(and, sipService, loadContext);
	});

	// const REINVITE_DATA_CHANNEL = "reInvite data-channel user";
	// test(REINVITE_DATA_CHANNEL, ({ given, when, then, and }) => {
	// 	const context: Context = new Context();
	// 	context.currentTest = REINVITE_DATA_CHANNEL;
	// 	systemSetup(given, sipClient.getPort(), context);
	// 	setConferenceId(given, context);
	// 	createConferenceRoom(when, sipService, context);
	// 	createConferenceRoom(when, sipService, context);
	// 	inviteParticipants(and, sipService, context);
	// 	reInviteParticipant(and, sipService, context);
	// 	leaveParticipants(and, sipService, context);
	// 	destroyConferenceRoom(and, sipService, context);
	// 	destroyConferenceRoom(and, sipService, context);
	// });

	const TWO_USERS_WITHOUT_SDP = "add two users without SDP";
	test(TWO_USERS_WITHOUT_SDP, ({ given, when, and, then }) => {
		const context: Context = new Context();
		context.currentTest = TWO_USERS_WITHOUT_SDP;
		systemSetup(given, sipClient.getPort(), context);
		setConferenceId(given, context);
		createConferenceRoom(when, sipService, context);
		inviteParticipantsWithoutSDP(and, sipService, context);
		inviteParticipantsWithoutSDP(and, sipService, context);
		leaveParticipants(and, sipService, context);
		destroyConferenceRoom(then, sipService, context);
	});

	const JOIN_SSC_USER = "add ssc user to meeting";
	test(JOIN_SSC_USER, ({ given, when, then, and }) => {
		const context: Context = new Context();
		context.currentTest = JOIN_SSC_USER;
		systemSetup(given, sipClient.getPort(), context);
		setConferenceId(given, context);
		createConferenceRoom(when, sipService, context);
		inviteParticipants(and, sipService, context);
		leaveParticipants(and, sipService, context);
		destroyConferenceRoom(and, sipService, context);
	});

	const CODEC_CONFIGURATION = "codecs configuration";
	test(CODEC_CONFIGURATION, ({ given, when, then, and }) => {
		const context: Context = new Context();
		context.currentTest = CODEC_CONFIGURATION;
		//Get mMCU home
		systemSetup(given, sipClient.getPort(), context);
		setConferenceId(given, context);
		createConferenceRoom(when, sipService, context);
		inviteParticipants(and, sipService, context);
		leaveParticipants(and, sipService, context);
		destroyConferenceRoom(and, sipService, context);
	});

	const UNSUPPORTED_CODEC = "unsupported codec in SDP";
	test(UNSUPPORTED_CODEC, async ({ given, when, and }) => {
		const context: Context = new Context();
		context.currentTest = UNSUPPORTED_CODEC;
		systemSetup(given, sipClient.getPort(), context);
		setConferenceId(given, context);
		createConferenceRoom(when, sipService, context);
		inviteParticipantWithUnsupportedCodec(and, sipService, context);
		verifyInviteResponseCode(and, sipService, context);
		destroyConferenceRoom(and, sipService, context);
	});

	const DEVICE_ID = "deviceID";
	test(DEVICE_ID, ({ given, when, then, and }) => {
		const context: Context = new Context();
		context.currentTest = DEVICE_ID;
		//Get mMCU home
		systemSetup(given, sipClient.getPort(), context);
		setConferenceId(given, context);
		createConferenceRoom(when, sipService, context);
		inviteParticipants(and, sipService, context);
		leaveParticipants(and, sipService, context);
		destroyConferenceRoom(and, sipService, context);
	});

	const DIFF_DEVICE_ID = "same user with diff deviceId";
	test(DIFF_DEVICE_ID, ({ given, when, then, and }) => {
		const context: Context = new Context();
		context.currentTest = DIFF_DEVICE_ID;
		//Get mMCU home
		systemSetup(given, sipClient.getPort(), context);
		setConferenceId(given, context);
		createConferenceRoom(when, sipService, context);
		inviteParticipants(and, sipService, context);
		verifyDiffToTag(and, sipService, context), leaveParticipants(and, sipService, context);
		destroyConferenceRoom(and, sipService, context);
	});

	const REINVITE_DEVICE_ID = "reInvite with deviceId";
	test(REINVITE_DEVICE_ID, ({ given, when, then, and }) => {
		const context: Context = new Context();
		context.currentTest = REINVITE_DEVICE_ID;
		//Get mMCU home
		systemSetup(given, sipClient.getPort(), context);
		setConferenceId(given, context);
		createConferenceRoom(when, sipService, context);
		inviteParticipants(and, sipService, context);
		reInviteParticipantWithDeviceId(and, sipService, context);
		leaveParticipants(and, sipService, context);
		destroyConferenceRoom(and, sipService, context);
	});
});

import { defineFeature, loadFeature } from "jest-cucumber";
import { StepsDefinitionCallbackFunction } from "jest-cucumber/dist/src/feature-definition-creation";
import {
	createConferenceRoom,
	destroyConferenceRoom,
	destroyConferenceRoomWithoutControllSession,
	setCaseType,
	setConferenceId,
	streamSleep,
	systemSetup,
	wait,
} from "./conf.room";
import {
	bulkInviteParticipants,
	bulkLeaveParticipants,
	bulkRecorderInfo,
	bulkRecorderNotifyInfoValidation,
	inviteParticipants,
	leaveParticipants,
	recorderInfo,
	recorderNotifyInfoValidation,
	startStreams,
	stopStreams,
	validateRecorderFile,
	BulkValidateRecorderFile,
	inviteParticipantWithoutConference,
	inviteParticipantWithoutConferenceWithCodecList,
	infoParticipantCreateConference,
	infoParticipantJoin,
	hold,
	reInviteParticipant,
	reInviteParticipantWithCodecList,
	sendInfo,
	dtmfNotifyInfoValidationAMTSupport,
	dtmfNotifyInfoValidation,
	verifyInviteResponseCode,
	validateRecorderFileSize,
	verifyInfoResponseCode,
	noRTPRoomNotifyInfoValidation,
	verifyInfoResponseCodeInMultiRoom,
} from "./conf.publisher";
import { McuService } from "../common/sip/mcu.service";
import { Context, LoadContext } from "../common/context";
import { SipValidator } from "../common/sip/validators/sip.validator";
import { RECORDER_ONE_ON_ONE_SIP_PORT } from "../common/constants";
import { calcSipClientPort, skipByEnvironment } from "./common.steps.utils";
import { SipClient } from "../common/sip/sipClient";
import {
	destroyRoomWithParticipants,
	loadStopStreams,
	multiRecorderInfo,
	openRoomsWithParticipants,
	openRoomsWithParticipantsMuteAndStream,
	setLoadValues,
} from "../load/steps/load.room";
import { HttpServer } from "../common/http/http.server";
import { FileUploadService } from "../test/common/http/file.upload.service";
import { LOGGER } from "../common/logger.service";
import * as ip from "ip";

const audioFeature = loadFeature("features/recorder-one-on-one.feature");

jest.setTimeout(500000);

defineFeature(audioFeature, (test) => {
	const sipClient: SipClient = new SipClient(calcSipClientPort(RECORDER_ONE_ON_ONE_SIP_PORT));
	const sipService: McuService = new McuService(sipClient, new SipValidator());
	const app: HttpServer = new HttpServer(LOGGER, false);

	beforeAll(async () => {
		const hostname: string = ip.address();
		const port = 6051;
		sipClient.start();
		app.init();
		app.start(hostname, port);
		//let http server "load up nicely"
		await app.delay(50);
	});

	afterAll(() => {
		app.stop();
		sipClient.stop();
	});

	const ONE_ON_ONE_RECORDING = "one on one recording, upload to Mstore replacment";
	const oneOnOneRecording = async ({ given, when, and, then }) => {
		const context: Context = new Context();
		context.currentTest = ONE_ON_ONE_RECORDING;
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
		recorderInfo(and, sipService, context);
		streamSleep(then);
		recorderInfo(and, sipService, context);
		recorderNotifyInfoValidation(then, sipService, context);
		recorderNotifyInfoValidation(then, sipService, context);
		streamSleep(then);
		recorderInfo(and, sipService, context);
		recorderNotifyInfoValidation(then, sipService, context);
		recorderNotifyInfoValidation(then, sipService, context);
		streamSleep(then);
		destroyConferenceRoomWithoutControllSession(and, sipService, context);
	};

	const ONE_ON_ONE_RECORDING_3_USERS = "one on one recording,  3 users upload to Mstore replacment";
	const oneOnOneRecordingUsers = async ({ given, when, and, then }) => {
		const context: Context = new Context();
		context.currentTest = ONE_ON_ONE_RECORDING_3_USERS;
		systemSetup(given, sipClient.getPort(), context);
		skipByEnvironment(then, context);
		setConferenceId(given, context);
		setCaseType(given, context);
		inviteParticipantWithoutConference(when, sipService, context);
		infoParticipantCreateConference(and, sipService, context);
		infoParticipantJoin(and, sipService, context);
		inviteParticipantWithoutConference(when, sipService, context);
		infoParticipantJoin(and, sipService, context);
		inviteParticipantWithoutConference(when, sipService, context);
		infoParticipantJoin(and, sipService, context);
		startStreams(and, sipService, context);
		recorderInfo(and, sipService, context);
		streamSleep(then);
		recorderInfo(and, sipService, context);
		recorderNotifyInfoValidation(then, sipService, context);
		recorderNotifyInfoValidation(then, sipService, context);
		streamSleep(then);
		recorderInfo(and, sipService, context);
		recorderNotifyInfoValidation(then, sipService, context);
		recorderNotifyInfoValidation(then, sipService, context);
		streamSleep(then);
		destroyConferenceRoomWithoutControllSession(and, sipService, context);
	};

	const ONE_ON_ONE_RECORDING_WITH_LEAVE = "one on one recording with leave participants, upload to Mstore replacment";
	const oneOnOneRecordingWithLeave = async ({ given, when, and, then }) => {
		const context: Context = new Context();
		context.currentTest = ONE_ON_ONE_RECORDING_WITH_LEAVE;
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
		recorderInfo(and, sipService, context);
		streamSleep(then);
		recorderInfo(and, sipService, context);
		recorderNotifyInfoValidation(then, sipService, context);
		recorderNotifyInfoValidation(then, sipService, context);
		streamSleep(then);
		recorderInfo(and, sipService, context);
		recorderNotifyInfoValidation(then, sipService, context);
		recorderNotifyInfoValidation(then, sipService, context);
		streamSleep(then);
		leaveParticipants(and, sipService, context);
		destroyConferenceRoomWithoutControllSession(and, sipService, context);
	};

	const ONE_ON_ONE_RECORDING_WITH_HOLD_RESUME = "one on one recording with hold resume, upload to Mstore replacment";
	const oneOnOneRecordingWithHoldResume = async ({ given, when, and, then }) => {
		const context: Context = new Context();
		context.currentTest = ONE_ON_ONE_RECORDING_WITH_HOLD_RESUME;
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
		recorderInfo(and, sipService, context);
		streamSleep(then);
		reInviteParticipant(and, sipService, context);
		reInviteParticipant(and, sipService, context);
		recorderInfo(and, sipService, context);
		recorderNotifyInfoValidation(then, sipService, context);
		recorderNotifyInfoValidation(then, sipService, context);
		streamSleep(then);
		reInviteParticipant(and, sipService, context);
		reInviteParticipant(and, sipService, context);
		recorderInfo(and, sipService, context);
		streamSleep(then);
		recorderInfo(and, sipService, context);
		recorderNotifyInfoValidation(then, sipService, context);
		recorderNotifyInfoValidation(then, sipService, context);
		streamSleep(then);
		recorderInfo(and, sipService, context);
		recorderNotifyInfoValidation(then, sipService, context);
		recorderNotifyInfoValidation(then, sipService, context);
		streamSleep(then);
		destroyConferenceRoomWithoutControllSession(and, sipService, context);
	};

	const ONE_ON_ONE_RECORDING_VIDEO_RECVONLY_IN_SDP = "one on one recording - video recvonly in SDP";
	const oneOnOneRecordingVideoRecvonlyInSDP = async ({ given, when, and, then }) => {
		const context: Context = new Context();
		context.currentTest = ONE_ON_ONE_RECORDING_VIDEO_RECVONLY_IN_SDP;
		systemSetup(given, sipClient.getPort(), context);
		skipByEnvironment(then, context);
		setConferenceId(given, context);
		setCaseType(given, context);
		inviteParticipantWithoutConference(when, sipService, context);
		infoParticipantCreateConference(and, sipService, context);
		infoParticipantJoin(and, sipService, context);
		inviteParticipantWithoutConference(when, sipService, context);
		infoParticipantJoin(and, sipService, context);
		destroyConferenceRoomWithoutControllSession(and, sipService, context);
	};

	const ONE_ON_ONE_RECORDING_VIDEO_SDP = "one on one recording, with video INVITE";
	const oneOnOneRecordingVideoSDP = async ({ given, when, and, then }) => {
		const context: Context = new Context();
		context.currentTest = ONE_ON_ONE_RECORDING_VIDEO_SDP;
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
		recorderInfo(and, sipService, context);
		streamSleep(then);
		recorderInfo(and, sipService, context);
		recorderNotifyInfoValidation(then, sipService, context);
		recorderNotifyInfoValidation(then, sipService, context);
		streamSleep(then);
		recorderInfo(and, sipService, context);
		recorderNotifyInfoValidation(then, sipService, context);
		recorderNotifyInfoValidation(then, sipService, context);
		streamSleep(then);
		destroyConferenceRoomWithoutControllSession(and, sipService, context);
	};

	const ONE_ON_ONE_WITH_HOLD_RESUME_AND_PLAY = "one on one with hold resume and play anna, with changed ip on sdp";
	const oneOnOneWithHoldResumeAndPlay = async ({ given, when, and, then }) => {
		const context: Context = new Context();
		context.currentTest = ONE_ON_ONE_WITH_HOLD_RESUME_AND_PLAY;
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
		dtmfNotifyInfoValidationAMTSupport(then, sipService, context);
		dtmfNotifyInfoValidation(then, sipService, context);
		streamSleep(then);
		reInviteParticipant(and, sipService, context);
		reInviteParticipant(and, sipService, context);
		destroyConferenceRoomWithoutControllSession(and, sipService, context);
	};

	const ONE_ON_ONE_WITH_HOLD_RESUME_PLAY_AND_STOP = "one on one with hold resume play anna and stop";
	const oneOnOneWithHoldResumePlayAndStop = async ({ given, when, and, then }) => {
		const context: Context = new Context();
		context.currentTest = ONE_ON_ONE_WITH_HOLD_RESUME_PLAY_AND_STOP;
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
		sendInfo(and, sipService, context);
		dtmfNotifyInfoValidationAMTSupport(then, sipService, context);
		dtmfNotifyInfoValidation(then, sipService, context);
		streamSleep(then);
		reInviteParticipant(and, sipService, context);
		reInviteParticipant(and, sipService, context);
		startStreams(and, sipService, context);
		streamSleep(then);
		stopStreams(and, sipService, context);
		destroyConferenceRoomWithoutControllSession(and, sipService, context);
	};

	const ONE_ON_ONE_RECORDING_PLAY_AND_STOP = "one on one recording play anna and stop";
	const oneOnOneRecordingPlayAndStop = async ({ given, when, and, then }) => {
		const context: Context = new Context();
		context.currentTest = ONE_ON_ONE_RECORDING_PLAY_AND_STOP;
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
		recorderInfo(and, sipService, context);
		streamSleep(then);
		sendInfo(and, sipService, context);
		sendInfo(and, sipService, context);
		dtmfNotifyInfoValidationAMTSupport(then, sipService, context);
		dtmfNotifyInfoValidation(then, sipService, context);
		streamSleep(then);
		stopStreams(and, sipService, context);
		recorderInfo(and, sipService, context);
		recorderNotifyInfoValidation(then, sipService, context);
		recorderNotifyInfoValidation(then, sipService, context);
		streamSleep(then);
		recorderInfo(and, sipService, context);
		recorderNotifyInfoValidation(then, sipService, context);
		recorderNotifyInfoValidation(then, sipService, context);
		streamSleep(then);
		destroyConferenceRoomWithoutControllSession(and, sipService, context);
	};

	const ONE_ON_ONE_RECORDING_WITH_HOLD_RESUME_AND_PLAY_AND_SWITCH_HOLD =
		"one on one recording with hold resume and play anna and hold switch ,upload to Mstore replacment";
	const oneOnOneRecordingWithHoldResumeAndPlayAndSwitchHold = async ({ given, when, and, then }) => {
		const context: Context = new Context();
		context.currentTest = ONE_ON_ONE_RECORDING_WITH_HOLD_RESUME_AND_PLAY_AND_SWITCH_HOLD;
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
		recorderInfo(and, sipService, context);
		streamSleep(then);
		reInviteParticipant(and, sipService, context);
		reInviteParticipant(and, sipService, context);
		recorderInfo(and, sipService, context);
		recorderNotifyInfoValidation(then, sipService, context);
		recorderNotifyInfoValidation(then, sipService, context);
		streamSleep(then);
		sendInfo(and, sipService, context);
		dtmfNotifyInfoValidationAMTSupport(then, sipService, context);
		dtmfNotifyInfoValidation(then, sipService, context);
		streamSleep(then);
		recorderInfo(and, sipService, context);
		streamSleep(then);
		reInviteParticipant(and, sipService, context);
		reInviteParticipant(and, sipService, context);
		reInviteParticipant(and, sipService, context);
		reInviteParticipant(and, sipService, context);
		recorderInfo(and, sipService, context);
		recorderNotifyInfoValidation(then, sipService, context);
		recorderNotifyInfoValidation(then, sipService, context);
		streamSleep(then);
		sendInfo(and, sipService, context);
		dtmfNotifyInfoValidationAMTSupport(then, sipService, context);
		dtmfNotifyInfoValidation(then, sipService, context);
		streamSleep(then);
		reInviteParticipant(and, sipService, context);
		reInviteParticipant(and, sipService, context);
		recorderInfo(and, sipService, context);
		recorderNotifyInfoValidation(then, sipService, context);
		recorderNotifyInfoValidation(then, sipService, context);
		streamSleep(then);
		destroyConferenceRoomWithoutControllSession(and, sipService, context);
	};

	const ONE_ON_ONE_WITH_HOLD_RESUME_AND_PLAY_AND_SWITCH_HOLD =
		"one on one with hold resume and play anna and hold switch ,upload to Mstore replacment";
	const oneOnOneWithHoldResumeAndPlayAndSwitchHold = async ({ given, when, and, then }) => {
		const context: Context = new Context();
		context.currentTest = ONE_ON_ONE_WITH_HOLD_RESUME_AND_PLAY_AND_SWITCH_HOLD;
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
		dtmfNotifyInfoValidationAMTSupport(then, sipService, context);
		dtmfNotifyInfoValidation(then, sipService, context);
		streamSleep(then);
		reInviteParticipant(and, sipService, context);
		reInviteParticipant(and, sipService, context);
		reInviteParticipant(and, sipService, context);
		reInviteParticipant(and, sipService, context);
		sendInfo(and, sipService, context);
		dtmfNotifyInfoValidationAMTSupport(then, sipService, context);
		dtmfNotifyInfoValidation(then, sipService, context);
		streamSleep(then);
		reInviteParticipant(and, sipService, context);
		reInviteParticipant(and, sipService, context);
		destroyConferenceRoomWithoutControllSession(and, sipService, context);
	};

	const ONE_ON_ONE_RECORDING_FULL_PATH = "one on one recording, upload to Mstore replacment with full lile path";
	const oneOnOneRecordingFullPath = async ({ given, when, and, then }) => {
		const context: Context = new Context();
		context.currentTest = ONE_ON_ONE_RECORDING_FULL_PATH;
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
		recorderInfo(and, sipService, context);
		streamSleep(then);
		recorderInfo(and, sipService, context);
		recorderNotifyInfoValidation(then, sipService, context);
		recorderNotifyInfoValidation(then, sipService, context);
		streamSleep(then);
		recorderInfo(and, sipService, context);
		recorderNotifyInfoValidation(then, sipService, context);
		recorderNotifyInfoValidation(then, sipService, context);
		streamSleep(then);
		destroyConferenceRoomWithoutControllSession(and, sipService, context);
	};

	const ONE_ON_ONE_WITH_HOLD_RESUME_WITH_NEW_SUPPORTED_CODEC_LIST =
		"resume in one on one session with new codec list when old codec is in new list";
	const oneOnOneWithHoldResumeAndNewSupportedCodecList = async ({ given, when, and, then }) => {
		const context: Context = new Context();
		context.currentTest = ONE_ON_ONE_WITH_HOLD_RESUME_WITH_NEW_SUPPORTED_CODEC_LIST;
		systemSetup(given, sipClient.getPort(), context);
		skipByEnvironment(then, context);
		setConferenceId(given, context);
		setCaseType(given, context);
		inviteParticipantWithoutConferenceWithCodecList(when, sipService, context);
		infoParticipantCreateConference(and, sipService, context);
		infoParticipantJoin(and, sipService, context);
		inviteParticipantWithoutConferenceWithCodecList(when, sipService, context);
		infoParticipantJoin(and, sipService, context);
		reInviteParticipant(and, sipService, context);
		reInviteParticipant(and, sipService, context);
		reInviteParticipantWithCodecList(and, sipService, context);
		reInviteParticipant(and, sipService, context);
		destroyConferenceRoomWithoutControllSession(and, sipService, context);
	};

	const ONE_ON_ONE_WITH_HOLD_RESUME_WITH_NEW_NON_SUPPORTED_CODEC_LIST =
		"hold in one on one session with new codec list when old codec is not in new list the play and stop play";
	const oneOnOneWithHoldResumeAndNewNonSupportedCodecList = async ({ given, when, and, then }) => {
		const context: Context = new Context();
		context.currentTest = ONE_ON_ONE_WITH_HOLD_RESUME_WITH_NEW_NON_SUPPORTED_CODEC_LIST;
		systemSetup(given, sipClient.getPort(), context);
		skipByEnvironment(then, context);
		setConferenceId(given, context);
		setCaseType(given, context);
		inviteParticipantWithoutConferenceWithCodecList(when, sipService, context);
		infoParticipantCreateConference(and, sipService, context);
		infoParticipantJoin(and, sipService, context);
		inviteParticipantWithoutConferenceWithCodecList(when, sipService, context);
		infoParticipantJoin(and, sipService, context);
		reInviteParticipant(and, sipService, context);
		reInviteParticipantWithCodecList(and, sipService, context);
		reInviteParticipant(and, sipService, context);
		reInviteParticipant(and, sipService, context);
		sendInfo(and, sipService, context);
		sendInfo(and, sipService, context);
		dtmfNotifyInfoValidationAMTSupport(then, sipService, context);
		dtmfNotifyInfoValidation(then, sipService, context);
		streamSleep(then);
		sendInfo(and, sipService, context);
		sendInfo(and, sipService, context);
		dtmfNotifyInfoValidationAMTSupport(then, sipService, context);
		dtmfNotifyInfoValidation(then, sipService, context);
		streamSleep(then);
		destroyConferenceRoomWithoutControllSession(and, sipService, context);
	};

	//select which tests to run
	test.skip(ONE_ON_ONE_RECORDING, oneOnOneRecording);
	test.skip(ONE_ON_ONE_RECORDING_3_USERS, oneOnOneRecordingUsers);
	test.skip(ONE_ON_ONE_RECORDING_WITH_LEAVE, oneOnOneRecordingWithLeave);
	test.skip(ONE_ON_ONE_RECORDING_WITH_HOLD_RESUME, oneOnOneRecordingWithHoldResume);
	test.skip(ONE_ON_ONE_RECORDING_VIDEO_RECVONLY_IN_SDP, oneOnOneRecordingVideoRecvonlyInSDP);
	test.skip(ONE_ON_ONE_RECORDING_VIDEO_SDP, oneOnOneRecordingVideoSDP);
	test.skip(ONE_ON_ONE_WITH_HOLD_RESUME_AND_PLAY, oneOnOneWithHoldResumeAndPlay);
	test.skip(ONE_ON_ONE_WITH_HOLD_RESUME_PLAY_AND_STOP, oneOnOneWithHoldResumePlayAndStop);
	test.skip(ONE_ON_ONE_RECORDING_PLAY_AND_STOP, oneOnOneRecordingPlayAndStop);
	test.skip(
		ONE_ON_ONE_RECORDING_WITH_HOLD_RESUME_AND_PLAY_AND_SWITCH_HOLD,
		oneOnOneRecordingWithHoldResumeAndPlayAndSwitchHold
	);
	test.skip(ONE_ON_ONE_WITH_HOLD_RESUME_AND_PLAY_AND_SWITCH_HOLD, oneOnOneWithHoldResumeAndPlayAndSwitchHold);
	test.skip(ONE_ON_ONE_RECORDING_FULL_PATH, oneOnOneRecordingFullPath);
	test.skip(
		ONE_ON_ONE_WITH_HOLD_RESUME_WITH_NEW_SUPPORTED_CODEC_LIST,
		oneOnOneWithHoldResumeAndNewSupportedCodecList
	);
	test.skip(
		ONE_ON_ONE_WITH_HOLD_RESUME_WITH_NEW_NON_SUPPORTED_CODEC_LIST,
		oneOnOneWithHoldResumeAndNewNonSupportedCodecList
	);
});

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
import { RECORDER_CONTROLLER_SIP_PORT } from "../common/constants";
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

const audioFeature = loadFeature("features/recorder-cloud.feature");

jest.setTimeout(500000);

defineFeature(audioFeature, (test) => {
	const sipClient: SipClient = new SipClient(calcSipClientPort(RECORDER_CONTROLLER_SIP_PORT));
	const sipService: McuService = new McuService(sipClient, new SipValidator());
	const app: HttpServer = new HttpServer(LOGGER, true);

	beforeAll(async () => {
		const hostname: string = ip.address();
		const port = 6050;
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

	const CLOUD_RECORDER_BASIC_TEST = "basic cloud recorder flow";
	const cloudRecorderTest = async ({ given, when, and, then }) => {
		const context: Context = new Context();
		context.currentTest = CLOUD_RECORDER_BASIC_TEST;
		systemSetup(given, sipClient.getPort(), context);
		skipByEnvironment(then, context);
		setConferenceId(given, context);
		createConferenceRoom(when, sipService, context);
		inviteParticipants(and, sipService, context);
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
		stopStreams(and, sipService, context);
		validateRecorderFileSize(then, sipService, context);
		leaveParticipants(and, sipService, context);
		destroyConferenceRoom(and, sipService, context);
	};

	const CLOUD_RECORDER_START_TWICE = "start recording twice";
	const cloudRecorderStartTwice = async ({ given, when, and, then }) => {
		const context: Context = new Context();
		context.currentTest = CLOUD_RECORDER_START_TWICE;
		systemSetup(given, sipClient.getPort(), context);
		skipByEnvironment(then, context);
		setConferenceId(given, context);
		createConferenceRoom(when, sipService, context);
		inviteParticipants(and, sipService, context);
		startStreams(and, sipService, context);
		recorderInfo(and, sipService, context);
		streamSleep(then);
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
		stopStreams(and, sipService, context);
		validateRecorderFileSize(then, sipService, context);
		leaveParticipants(and, sipService, context);
		destroyConferenceRoom(and, sipService, context);
	};

	const CLOUD_RECORDER_STOP_TWICE = "stop recording twice";
	const cloudRecorderStopTwice = async ({ given, when, and, then }) => {
		const context: Context = new Context();
		context.currentTest = CLOUD_RECORDER_STOP_TWICE;
		systemSetup(given, sipClient.getPort(), context);
		skipByEnvironment(then, context);
		setConferenceId(given, context);
		createConferenceRoom(when, sipService, context);
		inviteParticipants(and, sipService, context);
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
		recorderInfo(and, sipService, context);
		recorderNotifyInfoValidation(then, sipService, context);
		recorderNotifyInfoValidation(then, sipService, context);
		streamSleep(then);
		stopStreams(and, sipService, context);
		validateRecorderFileSize(then, sipService, context);
		leaveParticipants(and, sipService, context);
		destroyConferenceRoom(and, sipService, context);
	};

	const CLOUD_RECORDER_STOP_BEFORE_START = "stop record before start";
	const cloudRecorderStopBeforeStart = async ({ given, when, and, then }) => {
		const context: Context = new Context();
		context.currentTest = CLOUD_RECORDER_STOP_BEFORE_START;
		systemSetup(given, sipClient.getPort(), context);
		skipByEnvironment(then, context);
		setConferenceId(given, context);
		createConferenceRoom(when, sipService, context);
		inviteParticipants(and, sipService, context);
		startStreams(and, sipService, context);
		recorderInfo(and, sipService, context);
		verifyInfoResponseCode(and, sipService, context);
		stopStreams(and, sipService, context);
		leaveParticipants(and, sipService, context);
		destroyConferenceRoom(and, sipService, context);
	};

	const CLOUD_RECORDER_TRANSFER_WRONG_SOURCE = "transfer wrong source";
	const cloudRecorderTransferWrongSource = async ({ given, when, and, then }) => {
		const context: Context = new Context();
		context.currentTest = CLOUD_RECORDER_TRANSFER_WRONG_SOURCE;
		systemSetup(given, sipClient.getPort(), context);
		skipByEnvironment(then, context);
		setConferenceId(given, context);
		createConferenceRoom(when, sipService, context);
		inviteParticipants(and, sipService, context);
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
		recorderInfo(and, sipService, context);
		recorderNotifyInfoValidation(then, sipService, context);
		recorderNotifyInfoValidation(then, sipService, context);
		streamSleep(then);
		stopStreams(and, sipService, context);
		leaveParticipants(and, sipService, context);
		destroyConferenceRoom(and, sipService, context);
	};

	const SECOND_START_RECORD_IN_SAME_ROOM = "second start record in same room";
	const secondStartRecordInSameRoom = async ({ given, when, and, then }) => {
		const context: Context = new Context();
		context.currentTest = SECOND_START_RECORD_IN_SAME_ROOM;
		systemSetup(given, sipClient.getPort(), context);
		skipByEnvironment(then, context);
		setConferenceId(given, context);
		createConferenceRoom(when, sipService, context);
		inviteParticipants(and, sipService, context);
		startStreams(and, sipService, context);
		recorderInfo(and, sipService, context);
		recorderInfo(and, sipService, context);
		streamSleep(then);
		recorderInfo(and, sipService, context);
		recorderNotifyInfoValidation(then, sipService, context);
		recorderNotifyInfoValidation(then, sipService, context);
		streamSleep(then);
		recorderInfo(and, sipService, context);
		verifyInfoResponseCode(and, sipService, context);
		recorderInfo(and, sipService, context);
		recorderNotifyInfoValidation(then, sipService, context);
		recorderNotifyInfoValidation(then, sipService, context);
		streamSleep(then);
		stopStreams(and, sipService, context);
		validateRecorderFileSize(then, sipService, context);
		leaveParticipants(and, sipService, context);
		destroyConferenceRoom(and, sipService, context);
	};

	const CLOUD_RECORDER_THIRD_TRANSFER = "third transfer succeed to upload file";
	const cloudRecorderThirdTransfer = async ({ given, when, and, then }) => {
		const context: Context = new Context();
		context.currentTest = CLOUD_RECORDER_THIRD_TRANSFER;
		systemSetup(given, sipClient.getPort(), context);
		skipByEnvironment(then, context);
		setConferenceId(given, context);
		createConferenceRoom(when, sipService, context);
		inviteParticipants(and, sipService, context);
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
		recorderInfo(and, sipService, context);
		recorderNotifyInfoValidation(then, sipService, context);
		recorderNotifyInfoValidation(then, sipService, context);
		streamSleep(then);
		recorderInfo(and, sipService, context);
		recorderNotifyInfoValidation(then, sipService, context);
		recorderNotifyInfoValidation(then, sipService, context);
		streamSleep(then);
		stopStreams(and, sipService, context);
		validateRecorderFileSize(then, sipService, context);
		leaveParticipants(and, sipService, context);
		destroyConferenceRoom(and, sipService, context);
	};

	const CLOUD_RECORDER_FOURTH_TRANSFER = "4th transfer failed to upload file";
	const cloudRecorderFourthTransfer = async ({ given, when, and, then }) => {
		const context: Context = new Context();
		context.currentTest = CLOUD_RECORDER_FOURTH_TRANSFER;
		systemSetup(given, sipClient.getPort(), context);
		skipByEnvironment(then, context);
		setConferenceId(given, context);
		createConferenceRoom(when, sipService, context);
		inviteParticipants(and, sipService, context);
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
		recorderInfo(and, sipService, context);
		recorderNotifyInfoValidation(then, sipService, context);
		recorderNotifyInfoValidation(then, sipService, context);
		streamSleep(then);
		recorderInfo(and, sipService, context);
		recorderNotifyInfoValidation(then, sipService, context);
		recorderNotifyInfoValidation(then, sipService, context);
		streamSleep(then);
		recorderInfo(and, sipService, context);
		recorderNotifyInfoValidation(then, sipService, context);
		recorderNotifyInfoValidation(then, sipService, context);
		streamSleep(then);
		stopStreams(and, sipService, context);
		leaveParticipants(and, sipService, context);
		destroyConferenceRoom(and, sipService, context);
	};

	const MULTI_ROOMS_RECORDER = "when all recorder clients are busy, start fail";
	const multiRoomsRecorder = async ({ given, when, then, and }) => {
		const loadContext: LoadContext = new LoadContext();
		loadContext.currentTest = MULTI_ROOMS_RECORDER;
		setLoadValues(when, sipService, loadContext);
		openRoomsWithParticipantsMuteAndStream(and, sipService, loadContext);
		recorderInfo(and, sipService, loadContext);
		recorderInfo(and, sipService, loadContext);
		recorderInfo(and, sipService, loadContext);
		recorderInfo(and, sipService, loadContext);
		verifyInfoResponseCodeInMultiRoom(and, sipService, loadContext);
		streamSleep(then);
		recorderInfo(and, sipService, loadContext);
		streamSleep(then);
		recorderInfo(and, sipService, loadContext);
		recorderInfo(and, sipService, loadContext);
		recorderInfo(and, sipService, loadContext);
		streamSleep(then);
		recorderInfo(and, sipService, loadContext);
		loadStopStreams(and, sipService, loadContext);
		recorderInfo(and, sipService, loadContext);
		recorderInfo(and, sipService, loadContext);
		recorderInfo(and, sipService, loadContext);
		recorderInfo(and, sipService, loadContext);
		streamSleep(then);
		validateRecorderFileSize(then, sipService, loadContext);
		validateRecorderFileSize(then, sipService, loadContext);
		validateRecorderFileSize(then, sipService, loadContext);
		validateRecorderFileSize(then, sipService, loadContext);
		destroyRoomWithParticipants(and, sipService, loadContext);
	};

	const CLOUD_RECORDER_LEAVE_BEFORE_STOP = "leave participants before stop record";
	const cloudRecorderLeaveBeforeStop = async ({ given, when, and, then }) => {
		const context: Context = new Context();
		context.currentTest = CLOUD_RECORDER_LEAVE_BEFORE_STOP;
		systemSetup(given, sipClient.getPort(), context);
		skipByEnvironment(then, context);
		setConferenceId(given, context);
		createConferenceRoom(when, sipService, context);
		inviteParticipants(and, sipService, context);
		startStreams(and, sipService, context);
		recorderInfo(and, sipService, context);
		streamSleep(then);
		stopStreams(and, sipService, context);
		leaveParticipants(and, sipService, context);
		streamSleep(then);
		recorderInfo(and, sipService, context);
		recorderNotifyInfoValidation(then, sipService, context);
		recorderNotifyInfoValidation(then, sipService, context);
		streamSleep(then);
		recorderInfo(and, sipService, context);
		recorderNotifyInfoValidation(then, sipService, context);
		recorderNotifyInfoValidation(then, sipService, context);
		streamSleep(then);
		validateRecorderFileSize(then, sipService, context);
		noRTPRoomNotifyInfoValidation(and, sipService, context);
		wait(then);
	};

	const RECORDER_IS_STOPPED_WHEN_ROOM_IS_CLOSED = "recorder is stopped when room is closed";
	const recorderIsStoppedWhenRoomIsClosed = async ({ given, when, and, then }) => {
		const context: Context = new Context();
		context.currentTest = CLOUD_RECORDER_LEAVE_BEFORE_STOP;
		systemSetup(given, sipClient.getPort(), context);
		skipByEnvironment(then, context);
		setConferenceId(given, context);
		createConferenceRoom(when, sipService, context);
		inviteParticipants(and, sipService, context);
		startStreams(and, sipService, context);
		recorderInfo(and, sipService, context);
		streamSleep(then);
		stopStreams(and, sipService, context);
		leaveParticipants(and, sipService, context);
		noRTPRoomNotifyInfoValidation(and, sipService, context);
		wait(then);
		recorderNotifyInfoValidation(then, sipService, context);
		recorderNotifyInfoValidation(then, sipService, context);
		streamSleep(then);
	};

	//select which tests to run

	test.skip(MULTI_ROOMS_RECORDER, multiRoomsRecorder);
	test.skip(RECORDER_IS_STOPPED_WHEN_ROOM_IS_CLOSED, recorderIsStoppedWhenRoomIsClosed);
	test.skip(CLOUD_RECORDER_BASIC_TEST, cloudRecorderTest);
	test.skip(CLOUD_RECORDER_START_TWICE, cloudRecorderStartTwice);
	test.skip(CLOUD_RECORDER_STOP_TWICE, cloudRecorderStopTwice);
	test.skip(CLOUD_RECORDER_STOP_BEFORE_START, cloudRecorderStopBeforeStart); // SKIP UNTIL BUG MCU-3082 FIXED
	test.skip(CLOUD_RECORDER_TRANSFER_WRONG_SOURCE, cloudRecorderTransferWrongSource);
	test.skip(SECOND_START_RECORD_IN_SAME_ROOM, secondStartRecordInSameRoom); // SKIP UNTIL BUG MCU-3082 FIXED
	test.skip(CLOUD_RECORDER_THIRD_TRANSFER, cloudRecorderThirdTransfer);
	test.skip(CLOUD_RECORDER_FOURTH_TRANSFER, cloudRecorderFourthTransfer);
	test.skip(CLOUD_RECORDER_LEAVE_BEFORE_STOP, cloudRecorderLeaveBeforeStop);
});

import { defineFeature, loadFeature } from "jest-cucumber";
import { KAFKA_SIP_PORT, ROOM_TYPE_SCRSH, SCREEN_SHARE_SIP_PORT } from "../common/constants";
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
	KafkaConcumeRoomMessage,
} from "./conf.room";
import {
	bulkInviteParticipants,
	bulkLeaveParticipants,
	hold,
	inviteParticipant,
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
	KafkaConcumeMessages,
	KafkaConcumeInviteMessages,
	KafkaConcumeMessage,
	//KafkaInit
} from "./conf.publisher";
import { McuService } from "../common/sip/mcu.service";
import { Participant } from "../common/sip/dto/controlSession";
import { LOGGER } from "../common/logger.service";
import { Context, LoadContext } from "../common/context";
import { SipClient } from "../common/sip/sipClient";
import { SipValidator } from "../common/sip/validators/sip.validator";
import { calcSipClientPort, skipByEnvironment } from "./common.steps.utils";
import { destroyRoomWithParticipants, openRoomsWithParticipants, setLoadValues } from "../load/steps/load.room";

const kafkaFeature = loadFeature("features/kafka.feature");

jest.setTimeout(500000);

defineFeature(kafkaFeature, (test) => {
	const sipClient: SipClient = new SipClient(calcSipClientPort(KAFKA_SIP_PORT));
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

	const MUTE_UNMUTE_TRLs = "mute unmute kafka TRLs";
	const muteUnMuteTRLs = async ({ given, when, and, then }) => {
		const context: Context = new Context();
		context.currentTest = MUTE_UNMUTE_TRLs;
		systemSetup(given, sipClient.getPort(), context);
		setConferenceId(given, context);
		createConferenceRoom(when, sipService, context);
		KafkaConcumeRoomMessage(when, sipService, context);
		inviteParticipants(and, sipService, context);
		KafkaConcumeInviteMessages(when, sipService, context);
		mute(and, sipService, context);
		KafkaConcumeMessage(when, sipService, context);
		mute(and, sipService, context);
		KafkaConcumeMessage(when, sipService, context);
		leaveParticipants(and, sipService, context);
		KafkaConcumeMessages(when, sipService, context);
		destroyConferenceRoom(and, sipService, context);
		KafkaConcumeRoomMessage(when, sipService, context);
	};

	const OPEN_CLOSE_CAMERA_TRLs = "open and close camera kafka TRLs";
	const opeCloseCameraTRLs = async ({ given, when, and, then }) => {
		const context: Context = new Context();
		context.currentTest = OPEN_CLOSE_CAMERA_TRLs;
		systemSetup(given, sipClient.getPort(), context);
		setConferenceId(given, context);
		createConferenceRoom(when, sipService, context);
		KafkaConcumeRoomMessage(when, sipService, context);
		inviteParticipants(and, sipService, context);
		KafkaConcumeInviteMessages(when, sipService, context);
		//createConferenceRoom(when, sipService, context);
		//KafkaConcumeRoomMessage(when, sipService, context);
		inviteParticipants(and, sipService, context);
		KafkaConcumeInviteMessages(when, sipService, context);
		reInviteParticipant(and, sipService, context);
		KafkaConcumeMessage(when, sipService, context);
		reInviteParticipant(and, sipService, context);
		KafkaConcumeMessage(when, sipService, context);
		leaveParticipants(and, sipService, context);
		KafkaConcumeMessages(when, sipService, context);
		//destroyConferenceRoom(and, sipService, context);
		//KafkaConcumeRoomMessage(when, sipService, context);
		destroyConferenceRoom(and, sipService, context);
		KafkaConcumeRoomMessage(when, sipService, context);
	};

	const OPEN_CLOSE_SS_TRLs = "open and close SS kafka TRLs";
	const openCloseSSTRLs = async ({ given, when, and, then }) => {
		const context: Context = new Context();
		context.currentTest = OPEN_CLOSE_SS_TRLs;
		systemSetup(given, sipClient.getPort(), context);
		setConferenceId(given, context);
		createConferenceRoom(when, sipService, context);
		KafkaConcumeRoomMessage(when, sipService, context);
		inviteParticipants(and, sipService, context);
		KafkaConcumeInviteMessages(when, sipService, context);
		createConferenceRoom(when, sipService, context);
		KafkaConcumeRoomMessage(when, sipService, context);
		then(/(.*?) is (.*?)$/, async (user: string, type: string) => {
			await doScreenShare(user, type, context);
		});
		KafkaConcumeMessage(when, sipService, context);
		leaveParticipants(and, sipService, context);
		KafkaConcumeMessage(when, sipService, context);
		leaveParticipants(and, sipService, context);
		KafkaConcumeMessages(when, sipService, context);
		destroyConferenceRoom(and, sipService, context);
		KafkaConcumeRoomMessage(when, sipService, context);
		destroyConferenceRoom(and, sipService, context);
		KafkaConcumeRoomMessage(when, sipService, context);
	};

	test.skip(MUTE_UNMUTE_TRLs, muteUnMuteTRLs);
	test.skip(OPEN_CLOSE_CAMERA_TRLs, opeCloseCameraTRLs);
	test.skip(OPEN_CLOSE_SS_TRLs, openCloseSSTRLs);
});

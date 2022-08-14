import { defineFeature, loadFeature } from "jest-cucumber";
import { createConferenceRoom, destroyConferenceRoom, setConferenceId, systemSetup } from "../conf.room";
import {
	inviteParticipant,
	inviteParticipants,
	inviteParticipantWithCorruptSDP,
	inviteParticipantWithError,
	leaveParticipants,
	modifyStream,
	reInviteParticipant,
	verifyInviteResponseCode,
} from "../conf.publisher";
import { McuService } from "../../common/sip/mcu.service";
import { Context } from "../../common/context";
import { SipValidator } from "../../common/sip/validators/sip.validator";
import { Participant } from "../../common/sip/dto/controlSession";
import { SipAction } from "../../common/sip/sipAction";
import { ROOM_TYPE_SCRSH, SCREEN_SHARE_SIP_PORT } from "../../common/constants";
import { calcSipClientPort } from "../common.steps.utils";
import { SipClient } from "../../common/sip/sipClient";
import { LOGGER } from "../../common/logger.service";

const audioFeature = loadFeature("features/screenshare/screen.share.take.over.feature");

jest.setTimeout(500000);

defineFeature(audioFeature, (test) => {
	const sipClient: SipClient = new SipClient(calcSipClientPort(SCREEN_SHARE_SIP_PORT));
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

	const TAKE_OVER = "Screen share take over";
	test(TAKE_OVER, ({ given, when, then, and }) => {
		const context: Context = new Context();
		context.currentTest = TAKE_OVER;

		systemSetup(given, sipClient.getPort(), context);
		setConferenceId(given, context);
		createConferenceRoom(when, sipService, context);
		inviteParticipants(and, sipService, context);
		createConferenceRoom(when, sipService, context);
		then(/(.*?) is (.*?)$/, async (user: string, type: string) => {
			await doScreenShare(user, type, context);
		});
		then(/(.*?) is (.*?)$/, async (user: string, type: string) => {
			await doScreenShare(user, type, context);
		});
		leaveParticipants(and, sipService, context);
		//Screen share
		destroyConferenceRoom(and, sipService, context);
		//Audio
		destroyConferenceRoom(and, sipService, context);
	});

	const MODIFY_STREAM = "Modify stream";
	test(MODIFY_STREAM, ({ given, when, then, and }) => {
		const context: Context = new Context();
		context.currentTest = MODIFY_STREAM;

		//Get mMCU home
		systemSetup(given, sipClient.getPort(), context);
		setConferenceId(given, context);
		createConferenceRoom(when, sipService, context);
		inviteParticipants(and, sipService, context);
		//Screen share
		createConferenceRoom(when, sipService, context);
		//Screen share 1st user
		then(/(.*?) is (.*?)$/, async (user: string, type: string) => {
			await doScreenShare(user, type, context);
		});

		//modify stream...
		then(/(.*?) does (.*?)$/, async (user: string, action: string) => {
			LOGGER.debug({ action: `${user} does ${action}` });
			const publisher: Participant = <Participant>{
				meetingID: "context",
				Participant: user,
				roomType: ROOM_TYPE_SCRSH,
			};
			await modifyStream(
				publisher,
				sipService,
				context,
				action == "modify" ? SipAction.UNDEFINED : SipAction[action.toUpperCase()]
			);
		});
		leaveParticipants(and, sipService, context);
		//Screen share
		destroyConferenceRoom(and, sipService, context);
		//Audio
		destroyConferenceRoom(and, sipService, context);
	});

	const FOUR_PUBLISHER = "4 Publishers in same time";
	test(FOUR_PUBLISHER, ({ given, when, then, and }) => {
		const context: Context = new Context();
		context.currentTest = FOUR_PUBLISHER;

		//Get mMCU home
		systemSetup(given, sipClient.getPort(), context);
		setConferenceId(given, context);
		createConferenceRoom(when, sipService, context);
		inviteParticipants(and, sipService, context);
		//Screen share
		createConferenceRoom(when, sipService, context);
		inviteParticipants(and, sipService, context);
		leaveParticipants(and, sipService, context);
		destroyConferenceRoom(and, sipService, context);
		destroyConferenceRoom(and, sipService, context);
	});

	const SS_REINVITE = "SS reInvite";
	test(SS_REINVITE, ({ given, when, then, and }) => {
		const context: Context = new Context();
		context.currentTest = "SS reInvite";

		systemSetup(given, sipClient.getPort(), context);
		setConferenceId(given, context);
		createConferenceRoom(when, sipService, context);
		inviteParticipants(and, sipService, context);
		createConferenceRoom(when, sipService, context);
		then(/(.*?) is (.*?)$/, async (user: string, type: string) => {
			await doScreenShare(user, type, context);
		});
		reInviteParticipant(and, sipService, context);
		destroyConferenceRoom(and, sipService, context);
		destroyConferenceRoom(and, sipService, context);
	});

	const START_2_SS = "same user start SS twice";
	test(START_2_SS, ({ given, when, then, and }) => {
		const context: Context = new Context();
		context.currentTest = START_2_SS;

		systemSetup(given, sipClient.getPort(), context);
		setConferenceId(given, context);
		createConferenceRoom(when, sipService, context);
		inviteParticipants(and, sipService, context);
		createConferenceRoom(when, sipService, context);
		then(/(.*?) is (.*?)$/, async (user: string, type: string) => {
			await doScreenShare(user, type, context);
		});

		then(/(.*?) is (.*?)$/, async (user: string, type: string) => {
			await doScreenShare(user, type, context);
		});

		leaveParticipants(and, sipService, context);
		destroyConferenceRoom(and, sipService, context);
		destroyConferenceRoom(and, sipService, context);
	});

	const AUDIO_BEFORE_SS = "open SS room before open audio room";
	test(AUDIO_BEFORE_SS, ({ given, when, then, and }) => {
		const context: Context = new Context();
		context.currentTest = AUDIO_BEFORE_SS;

		systemSetup(given, sipClient.getPort(), context);
		setConferenceId(given, context);
		createConferenceRoom(when, sipService, context);
		then(/(.*?) is (.*?)$/, async (user: string, type: string) => {
			await doScreenShare(user, type, context);
		});
		createConferenceRoom(when, sipService, context);
		inviteParticipants(and, sipService, context);
		leaveParticipants(and, sipService, context);
		destroyConferenceRoom(and, sipService, context);
		destroyConferenceRoom(and, sipService, context);
	});

	const ADD_SS_USER_NON_EXIST_MEETING = "add SS user to not exist SS meeting";
	test(ADD_SS_USER_NON_EXIST_MEETING, ({ given, when, then, and }) => {
		const context: Context = new Context();
		context.currentTest = ADD_SS_USER_NON_EXIST_MEETING;

		systemSetup(given, sipClient.getPort(), context);
		setConferenceId(given, context);
		createConferenceRoom(when, sipService, context);
		inviteParticipants(and, sipService, context);
		createConferenceRoom(when, sipService, context);
		inviteParticipantWithError(when, sipService, context);
		leaveParticipants(and, sipService, context);
		destroyConferenceRoom(and, sipService, context);
		destroyConferenceRoom(and, sipService, context);
	});

	const SS_SDP_ERROR = "no publisher is SS SDP - return Error on SDP";
	test(SS_SDP_ERROR, ({ given, when, then, and }) => {
		const context: Context = new Context();
		context.currentTest = SS_SDP_ERROR;

		systemSetup(given, sipClient.getPort(), context);
		setConferenceId(given, context);
		createConferenceRoom(when, sipService, context);
		inviteParticipants(and, sipService, context);
		createConferenceRoom(when, sipService, context);
		inviteParticipantWithCorruptSDP(and, sipService, context);
		verifyInviteResponseCode(and, sipService, context);
		leaveParticipants(and, sipService, context);
		destroyConferenceRoom(and, sipService, context);
		destroyConferenceRoom(and, sipService, context);
	});

	// const SS_RECONNECT = "Screen share reconnect";
	// test(SS_RECONNECT, ({ given, when, then, and }) => {
	// 	const context: Context = new Context();
	// 	context.currentTest = SS_RECONNECT;
	//
	// 	systemSetup(given, sipClient.getPort(), context);
	// 	setConferenceId(given, context);
	// 	createConferenceRoom(when, sipService, context);
	// 	inviteParticipants(and, sipService, context);
	// 	createConferenceRoom(when, sipService, context);
	// 	then(/(.*?) is (.*?)$/, async (user: string, type: string) => {
	// 		await doScreenShare(user, type, context);
	// 	});
	// 	reInviteParticipant(and, sipService, context);
	// 	leaveParticipants(and, sipService, context);
	// 	//Screen share
	// 	destroyConferenceRoom(and, sipService, context);
	// 	//Audio
	// 	destroyConferenceRoom(and, sipService, context);
	// });

	// test("Modify stream error case", ({ given, when, then, and }) => {
	// 	//Get mMCU home
	// 	systemSetup(given, context);
	//
	// 	setConferenceId(given, context);
	//
	// 	//Create room
	// 	createConferenceRoom(when, sipService, validator, context);
	// 	LOGGER.debug(context.info);
	//
	// 	inviteParticipants(and, sipService, validator, context);
	//
	// 	then(/Sleep (\d+) sec/, async (delay) => {
	// 		await new Promise<void>((resolve) => {
	// 			setTimeout(() => {
	// 				LOGGER.debug(`sleeping ${delay} sec`);
	// 				return resolve();
	// 			}, delay * 1000);
	// 		});
	// 	});
	//
	// 	//Screen share
	// 	createConferenceRoom(when, sipService, validator, context);
	//
	// 	//Screen share 1st user
	// 	then(/(.*?) is (.*?)$/, async (user: string, type: string) => {
	// 		await doScreenShare(user, type);
	// 	});
	//
	// 	//modify stream...
	// 	then(/(.*?) does (.*?) with wrong connection$/, async (user: string, action: string) => {
	// 		LOGGER.debug(`${user} does ${action}`);
	// 		const publisher: Participant = <Participant>{
	// 			meetingID: "context",
	// 			Participant: user,
	// 			roomType: ROOM_TYPE_SCRSH,
	// 		};
	// 		await modifyStream(publisher, sipService, validator, context, action== "modify" ? SipAction.UNDEFINED : SipAction[action.toUpperCase()]);
	// 	});
	//
	// 	leaveParticipants(and, sipService, validator, context);
	//
	// 	//Screen share
	// 	destroyConferenceRoom(and, sipService, validator, context);
	// 	//Audio
	// 	destroyConferenceRoom(and, sipService, validator, context);
	// });
});

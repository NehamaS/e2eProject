import { defineFeature, loadFeature } from "jest-cucumber";
import { LoadContext } from "../../common/context";

import { streamSleep, systemSetup } from "../../steps/conf.room";
import {
	openRoomsWithParticipants,
	destroyRoomWithParticipants,
	setLoadValues,
	muteNotSpeakParticipants,
	loadStartStreams,
	loadStopStreams,
	validateNumOfStreamFiles,
	checkFailuresThreshold,
	openRoomsWithParticipantsMuteAndStream,
	destroyRoomWithParticipantsAndStopStream,
	validateStreamFilesSize,
	loadSleep,
} from "./load.room";
import { McuService } from "../../common/sip/mcu.service";
import { SipClient } from "../../common/sip/sipClient";
import { SipValidator } from "../../common/sip/validators/sip.validator";
import { LOAD_SIP_CLIENT_PORT } from "../../common/constants";
import { calcSipClientPort } from "../../steps/common.steps.utils";

const audioFeature = loadFeature("load/features/conference-load.feature");

jest.setTimeout(5000000);

defineFeature(audioFeature, (test) => {
	const sipClient: SipClient = new SipClient(calcSipClientPort(LOAD_SIP_CLIENT_PORT, true));

	const sipService: McuService = new McuService(sipClient, new SipValidator());

	beforeAll(() => {
		sipClient.start();
	});

	afterAll(() => {
		sipClient.stop();
	});

	// test("Load without stream, paralleling login, setup: USERS <USERS>, SPEAK_USERS <SPEAK_USERS>, VIDEO_PUB_USERS <VIDEO_PUB_USERS>, ROOMS <ROOMS>, FAILURE_MECHANISM <FAILURE_MECHANISM>", ({
	// 	given,
	// 	when,
	// 	then,
	// 	and,
	// }) => {
	// 	let loadContext: LoadContext = new LoadContext();
	// 	setLoadValues(when, sipService, loadContext);
	// 	openRoomsWithParticipants(and, sipService, loadContext);
	// 	openRoomsWithParticipants(and, sipService, loadContext);
	// 	muteNotSpeakParticipants(and, sipService, loadContext);
	// 	destroyRoomWithParticipants(and, sipService, loadContext);
	// 	destroyRoomWithParticipants(and, sipService, loadContext);
	// 	checkFailuresThreshold(and, sipService, loadContext);
	// 	//delete loadContext.MultiContext
	// });

	test("Load with stream", ({ given, when, then, and }) => {
		const loadContext: LoadContext = new LoadContext();
		setLoadValues(when, sipService, loadContext);
		openRoomsWithParticipantsMuteAndStream(and, sipService, loadContext);
		loadSleep(then);
		loadStopStreams(and, sipService, loadContext);
		destroyRoomWithParticipants(and, sipService, loadContext);
		validateNumOfStreamFiles(and, sipService, loadContext);
		//validateStreamFilesSize(and, sipService, loadContext);
		checkFailuresThreshold(and, sipService, loadContext);
	});
});

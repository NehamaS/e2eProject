import { defineFeature, loadFeature } from "jest-cucumber";
import {
	createConferenceRoom,
	destroyConferenceRoom,
	getTestEnvironment,
	setConferenceId,
	systemSetup,
	wait,
} from "../conf.room";
import {
	inviteMRFParticipants,
	inviteParticipants,
	inviteParticipantsWithDialogInUser,
	leaveParticipants,
	leaveParticipantsWithDTMF,
	noRTPRoomNotifyInfoValidation,
	noRTPUserNotifyInfoValidation,
	updateParticipant,
} from "../conf.publisher";
import { skipByEnvironment } from "../common.steps.utils";
import { McuService } from "../../common/sip/mcu.service";
import { Context } from "../../common/context";
import { SipClient } from "../../common/sip/sipClient";
import { SipValidator } from "../../common/sip/validators/sip.validator";
import { calcSipClientPort } from "../common.steps.utils";
import { MRF_SIP_PORT } from "../../common/constants";

const audioFeature = loadFeature("features/MRF/mrf.feature");

jest.setTimeout(500000);

defineFeature(audioFeature, (test) => {
	const sipClient: SipClient = new SipClient(calcSipClientPort(MRF_SIP_PORT));
	const sipService: McuService = new McuService(sipClient, new SipValidator());

	beforeAll(() => {
		sipClient.start();
	});
	afterAll(() => {
		sipClient.stop();
	});

	const BASIC_TEST = "MRF sanity test";
	test(BASIC_TEST, ({ given, when, and, then }) => {
		const context: Context = new Context();
		context.currentTest = BASIC_TEST;
		systemSetup(given, sipClient.getPort(), context);
		setConferenceId(given, context);
		createConferenceRoom(when, sipService, context);
		inviteMRFParticipants(and, sipService, context);
		updateParticipant(and, sipService, context);
		leaveParticipantsWithDTMF(and, sipService, context);
		destroyConferenceRoom(then, sipService, context);
	});
});

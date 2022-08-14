import { defineFeature, loadFeature } from "jest-cucumber";
import { createConferenceRoom, destroyConferenceRoom, setConferenceId, systemSetup, wait } from "./conf.room";
import { inviteParticipants, noRTPUserNotifyInfoValidation, noRTPRoomNotifyInfoValidation } from "./conf.publisher";
import { McuService } from "../common/sip/mcu.service";
import { Context } from "../common/context";
import { SipValidator } from "../common/sip/validators/sip.validator";
import { Attributes, ONE_MIN, SIP_NOTIFY_SIP_PORT, THREE_MIN } from "../common/constants";
import { calcSipClientPort } from "./common.steps.utils";
import { SipClient } from "../common/sip/sipClient";

const audioFeature = loadFeature("features/sip.notify.feature");

jest.setTimeout(500000);

defineFeature(audioFeature, (test) => {
	const sipClient: SipClient = new SipClient(calcSipClientPort(SIP_NOTIFY_SIP_PORT));
	const sipService: McuService = new McuService(sipClient, new SipValidator());

	beforeAll(() => {
		sipClient.start();
	});

	afterAll(() => {
		sipClient.stop();
	});

	const RTP_INACTIVITY = "RTP inactivity";
	test(RTP_INACTIVITY, ({ given, when, then, and }) => {
		const context: Context = new Context();
		context.currentTest = RTP_INACTIVITY;
		//Get mMCU home
		systemSetup(given, sipClient.getPort(), context);
		setConferenceId(given, context);
		createConferenceRoom(when, sipService, context);
		inviteParticipants(and, sipService, context);
		noRTPUserNotifyInfoValidation(and, sipService, context);
		wait(then);
		noRTPRoomNotifyInfoValidation(and, sipService, context);
		wait(then);
		destroyConferenceRoom(and, sipService, context);
	});
});

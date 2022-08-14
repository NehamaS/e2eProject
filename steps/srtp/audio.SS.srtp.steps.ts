import { defineFeature, loadFeature } from "jest-cucumber";
import { createConferenceRoom, destroyConferenceRoom, setConferenceId, streamSleep, systemSetup } from "../conf.room";
import { McuService } from "../../common/sip/mcu.service";
import { Context } from "../../common/context";
import { SRTP_SIP_PORT } from "../../common/constants";
import { inviteParticipants, leaveParticipants } from "../conf.publisher";
import { calcSipClientPort } from "../common.steps.utils";
import { SipClient } from "../../common/sip/sipClient";
import { LOGGER } from "../../common/logger.service";

const audioFeature = loadFeature("features/srtp/audio-SS-srtp.feature");

jest.setTimeout(500000);

defineFeature(audioFeature, (test) => {
	const sipClient: SipClient = new SipClient(calcSipClientPort(SRTP_SIP_PORT));
	const sipService: McuService = new McuService(sipClient);

	beforeAll(() => {
		sipClient.start();
	});
	afterAll(() => {
		sipClient.stop();
	});

	const SS_SRTP = "audio-SS-srtp-rooms";
	test(SS_SRTP, ({ given, when, then, and }) => {
		const context: Context = new Context();
		context.currentTest = SS_SRTP;
		//Get mMCU home
		systemSetup(given, sipClient.getPort(), context);
		setConferenceId(given, context);
		createConferenceRoom(when, sipService, context);
		inviteParticipants(and, sipService, context);
		createConferenceRoom(when, sipService, context);
		//	createConferenceRoom(when, sipService, context);
		inviteParticipants(and, sipService, context);
		streamSleep(then);
		leaveParticipants(and, sipService, context);
		destroyConferenceRoom(and, sipService, context);
		//	destroyConferenceRoom(and, sipService, context);
		destroyConferenceRoom(and, sipService, context);
	});

	const RTP_SRTP = "RTP & SRTP in same room";
	test(RTP_SRTP, ({ given, when, then, and }) => {
		const context: Context = new Context();
		context.currentTest = RTP_SRTP;
		//Get mMCU home
		systemSetup(given, sipClient.getPort(), context);
		setConferenceId(given, context);
		createConferenceRoom(when, sipService, context);
		inviteParticipants(and, sipService, context);
		createConferenceRoom(when, sipService, context);
		//	createConferenceRoom(when, sipService, context);
		inviteParticipants(and, sipService, context);
		streamSleep(then);
		leaveParticipants(and, sipService, context);
		destroyConferenceRoom(and, sipService, context);
		//	destroyConferenceRoom(and, sipService, context);
		destroyConferenceRoom(and, sipService, context);
	});
});

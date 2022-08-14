import { defineFeature, loadFeature } from "jest-cucumber";
import { createConferenceRoom, destroyConferenceRoom, setConferenceId, systemSetup, streamSleep } from "./conf.room";

import {
	inviteParticipants,
	inviteParticipantWithCorruptSDP,
	leaveParticipants,
	NonStandartInviteHeader,
	NonStandartInviteSDP,
	reInviteParticipant,
	startStreams,
	stopStreams,
	streamsValidate,
	verifyInviteResponseCode,
} from "./conf.publisher";
import { McuService } from "../common/sip/mcu.service";
import { Context } from "../common/context";
import { SipValidator } from "../common/sip/validators/sip.validator";
import { VIDEO_SIP_PORT } from "../common/constants";
import { calcSipClientPort } from "./common.steps.utils";
import { SipClient } from "../common/sip/sipClient";

const audioFeature = loadFeature("features/conference-video.feature");

jest.setTimeout(500000);

defineFeature(audioFeature, (test) => {
	const sipClient: SipClient = new SipClient(calcSipClientPort(VIDEO_SIP_PORT));
	const sipService: McuService = new McuService(sipClient, new SipValidator());

	beforeAll(() => {
		sipClient.start();
	});
	afterAll(() => {
		sipClient.stop();
	});

	const VIDEO_A = "stream - 1 sender, 1 receiver";
	test(VIDEO_A, ({ given, when, then, and }) => {
		const context: Context = new Context();
		context.currentTest = VIDEO_A;
		//Get mMCU home
		systemSetup(given, sipClient.getPort(), context);
		setConferenceId(given, context);
		createConferenceRoom(when, sipService, context);
		inviteParticipants(and, sipService, context);
		createConferenceRoom(when, sipService, context);
		inviteParticipants(and, sipService, context);
		startStreams(and, sipService, context);
		streamSleep(then);
		leaveParticipants(and, sipService, context);
		streamsValidate(and, sipService, context);
		stopStreams(and, sipService, context);
		destroyConferenceRoom(and, sipService, context);
		//	destroyConferenceRoom(and, sipService, context);
	});

	const VIDEO_B = "stream - 2 senders";
	test(VIDEO_B, ({ given, when, then, and }) => {
		const context: Context = new Context();
		context.currentTest = VIDEO_B;
		systemSetup(given, sipClient.getPort(), context);
		setConferenceId(given, context);
		createConferenceRoom(when, sipService, context);
		inviteParticipants(and, sipService, context);
		//createConferenceRoom(when, sipService, context);
		inviteParticipants(and, sipService, context);
		startStreams(and, sipService, context);
		streamSleep(then);
		leaveParticipants(and, sipService, context);
		streamsValidate(and, sipService, context);
		stopStreams(and, sipService, context);
		//destroyConferenceRoom(and, sipService, context);
		destroyConferenceRoom(and, sipService, context);
	});

	const VIDEO_C = "multi-stream - 2 senders";
	test(VIDEO_C, ({ given, when, then, and }) => {
		const context: Context = new Context();
		context.currentTest = VIDEO_C;
		systemSetup(given, sipClient.getPort(), context);
		setConferenceId(given, context);
		createConferenceRoom(when, sipService, context);
		inviteParticipants(and, sipService, context);
		//createConferenceRoom(when, sipService, context);
		inviteParticipants(and, sipService, context);
		//startStreams(and, sipService, context);
		//streamSleep(then);
		leaveParticipants(and, sipService, context);
		//streamsValidate(and, sipService, context);
		//stopStreams(and, sipService, context);
		//destroyConferenceRoom(and, sipService, context);
		destroyConferenceRoom(and, sipService, context);
	});

	const VIDEO_D = "open and close camera - reInvite";
	test(VIDEO_D, ({ given, when, then, and }) => {
		const context: Context = new Context();
		context.currentTest = VIDEO_D;
		systemSetup(given, sipClient.getPort(), context);
		setConferenceId(given, context);
		createConferenceRoom(when, sipService, context);
		inviteParticipants(and, sipService, context);
		//createConferenceRoom(when, sipService, context);
		inviteParticipants(and, sipService, context);
		startStreams(and, sipService, context);
		streamSleep(then);
		reInviteParticipant(and, sipService, context);
		startStreams(and, sipService, context);
		streamSleep(then);
		reInviteParticipant(and, sipService, context);
		startStreams(and, sipService, context);
		streamSleep(then);
		leaveParticipants(and, sipService, context);
		streamsValidate(and, sipService, context);
		stopStreams(and, sipService, context);
		//destroyConferenceRoom(and, sipService, context);
		destroyConferenceRoom(and, sipService, context);
	});

	const VIDEO_E = "user open camera twice - 2 reInvite with same sdp";
	test(VIDEO_E, ({ given, when, then, and }) => {
		const context: Context = new Context();
		context.currentTest = VIDEO_E;
		systemSetup(given, sipClient.getPort(), context);
		setConferenceId(given, context);
		createConferenceRoom(when, sipService, context);
		inviteParticipants(and, sipService, context);
		//createConferenceRoom(when, sipService, context);
		inviteParticipants(and, sipService, context);
		startStreams(and, sipService, context);
		streamSleep(then);
		reInviteParticipant(and, sipService, context);
		startStreams(and, sipService, context);
		streamSleep(then);
		reInviteParticipant(and, sipService, context);
		startStreams(and, sipService, context);
		streamSleep(then);
		leaveParticipants(and, sipService, context);
		streamsValidate(and, sipService, context);
		stopStreams(and, sipService, context);
		//destroyConferenceRoom(and, sipService, context);
		destroyConferenceRoom(and, sipService, context);
	});

	const VIDEO_F = "start camera when there is a PSTN user in the video room";
	test(VIDEO_F, ({ given, when, then, and }) => {
		const context: Context = new Context();
		context.currentTest = VIDEO_F;
		//Get mMCU home
		systemSetup(given, sipClient.getPort(), context);
		setConferenceId(given, context);
		createConferenceRoom(when, sipService, context);
		inviteParticipants(and, sipService, context);
		//createConferenceRoom(when, sipService, context);
		inviteParticipants(and, sipService, context);
		startStreams(and, sipService, context);
		streamSleep(then);
		reInviteParticipant(and, sipService, context);
		startStreams(and, sipService, context);
		streamSleep(then);
		leaveParticipants(and, sipService, context);
		streamsValidate(and, sipService, context);
		stopStreams(and, sipService, context);
		//destroyConferenceRoom(and, sipService, context);
		destroyConferenceRoom(and, sipService, context);
	});

	const VIDEO_G = "No Error when PSTN user join as video sender";
	test(VIDEO_G, ({ given, when, then, and }) => {
		const context: Context = new Context();
		context.currentTest = VIDEO_G;
		systemSetup(given, sipClient.getPort(), context);
		setConferenceId(given, context);
		createConferenceRoom(when, sipService, context);
		inviteParticipants(and, sipService, context);
		//createConferenceRoom(when, sipService, context);
		inviteParticipants(and, sipService, context);
		//destroyConferenceRoom(and, sipService, context);
		destroyConferenceRoom(and, sipService, context);
	});

	const VIDEO_H = "reInvite With UnknownToTagAndCallID - Expected to get succeed response on header";
	test(VIDEO_H, ({ given, when, then, and }) => {
		const context: Context = new Context();
		context.currentTest = VIDEO_H;
		//Get mMCU home
		systemSetup(given, sipClient.getPort(), context);
		setConferenceId(given, context);
		createConferenceRoom(when, sipService, context);
		inviteParticipants(and, sipService, context);
		NonStandartInviteHeader(and, sipService, context);
		leaveParticipants(and, sipService, context);
		destroyConferenceRoom(and, sipService, context);
	});

	const VIDEO_I = "sendrecv direction in video RecvOnly mid - return Error on SDP";
	test(VIDEO_I, ({ given, when, then, and }) => {
		const context: Context = new Context();
		context.currentTest = VIDEO_I;
		//Get mMCU home
		systemSetup(given, sipClient.getPort(), context);
		setConferenceId(given, context);
		createConferenceRoom(when, sipService, context);
		inviteParticipantWithCorruptSDP(and, sipService, context);
		verifyInviteResponseCode(and, sipService, context);
		destroyConferenceRoom(and, sipService, context);
	});

	const VIDEO_J = "VP9 codec in video RecvOnly mid - Expected to get succeed response on SDP";
	test(VIDEO_J, ({ given, when, then, and }) => {
		const context: Context = new Context();
		context.currentTest = VIDEO_J;
		systemSetup(given, sipClient.getPort(), context);
		setConferenceId(given, context);
		createConferenceRoom(when, sipService, context);
		NonStandartInviteSDP(and, sipService, context);
		destroyConferenceRoom(and, sipService, context);
	});
});

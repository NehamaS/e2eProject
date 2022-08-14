import { defineFeature, loadFeature } from "jest-cucumber";
import { createConferenceRoom, destroyConferenceRoom, setConferenceId, systemSetup, wait } from "../conf.room";
import {
	inviteParticipants,
	leaveParticipants,
	noRTPRoomNotifyInfoValidation,
	noRTPUserNotifyInfoValidation,
} from "../conf.publisher";
import { McuService } from "../../common/sip/mcu.service";
import { Context } from "../../common/context";
import { SipClient } from "../../common/sip/sipClient";
import { SipValidator } from "../../common/sip/validators/sip.validator";
import { calcSipClientPort, skipByEnvironment } from "../common.steps.utils";
import { PlatformType, SIP_TLS_PORT } from "../../common/constants";
import { LOGGER } from "../../common/logger.service";
import { Tls, TlsOptions } from "../../common/sip/base.sip.client";
import { getFileContent } from "../../common/utils";

const audioFeature = loadFeature("features/tls/tls.feature");

jest.setTimeout(500000);

//process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

defineFeature(audioFeature, (test) => {
	const sipClient: SipClient = new SipClient(calcSipClientPort(SIP_TLS_PORT));
	const sipService: McuService = new McuService(sipClient, new SipValidator());

	const TLS_PORT = sipClient.getPort() + 100;

	const setTlsPort = (given: any, context: Context) => {
		given(/MCU TLS port (.*?)$/, async (port: number) => {
			context.platform = PlatformType.SWARM;
			context.env.sip.port = port;
			LOGGER.info({ test: context.currentTest, mcu: { address: context.address(), port: context.port() } });
		});
	};

	beforeAll(() => {
		const privateKey: string | undefined = getFileContent(`${process.cwd()}/steps/tls/certificate/private.key`);
		const certificate: string | undefined = getFileContent(
			`${process.cwd()}/steps/tls/certificate/certificate.crt`
		);

		expect(privateKey).toBeDefined();
		expect(certificate).toBeDefined();

		//sip.js : options.tls_port || 5061, options.address
		const TLS: TlsOptions = <TlsOptions>{
			tls: <Tls>{
				key: privateKey,
				cert: certificate,
				// This is necessary only if using client certificate authentication.
				requestCert: false,
			},
			port: TLS_PORT,
		};
		sipClient.start(TLS);
	});
	afterAll(() => {
		sipClient.stop();
	});

	const TLS_BASIC_TEST = "Sanity audio conference with tls";
	test.skip(TLS_BASIC_TEST, ({ given, when, then, and }) => {
		const context: Context = new Context();
		context.currentTest = TLS_BASIC_TEST;

		/*make all sessions over tls
         when assigning session (user-session or control-session, tls option is assinged as well!)
         */
		//########################
		context.tls = true; //###
		context.tlsPort = TLS_PORT;
		//########################

		//background
		systemSetup(given, sipClient.getPort(), context);
		skipByEnvironment(then, context);
		setTlsPort(given, context);

		setConferenceId(given, context);
		createConferenceRoom(when, sipService, context);
		inviteParticipants(and, sipService, context);
		//	createConferenceRoom(when, sipService, context);
		inviteParticipants(and, sipService, context);
		leaveParticipants(and, sipService, context);
		//	destroyConferenceRoom(and, sipService, context);
		destroyConferenceRoom(and, sipService, context);
	});

	const TLS_NOTIFY = "Notify TLS";
	test.skip(TLS_NOTIFY, ({ given, when, then, and }) => {
		const context: Context = new Context();
		context.currentTest = TLS_NOTIFY;

		/*make all sessions over tls
		 when assigning session (user-session or control-session, tls option is assinged as well!)
 		*/
		//########################
		context.tls = true; //###
		context.tlsPort = TLS_PORT;
		//########################

		//Get mMCU home
		systemSetup(given, sipClient.getPort(), context);
		skipByEnvironment(then, context);
		setTlsPort(given, context);

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

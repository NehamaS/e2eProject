import { defineFeature, loadFeature } from "jest-cucumber";
import * as https from "https";
import * as http from "http";
import { systemPlatformSetup } from "../conf.room";
import { Context } from "../../common/context";
import { ContactDTO, ControlSession, Participant } from "../../common/sip/dto/controlSession";
import { CSEQ, ResponseDTO } from "../../common/sip/dto/infoDTO";
import { McuService } from "../../common/sip/mcu.service";

import { METHOD_INVITE, METHOD_OPTIONS } from "../../common/messages/audio.message.factory";
import * as utils from "../../common/utils";
import { HEALTH_SIP_CLIENT_PORT, PlatformType, SipHeaders } from "../../common/constants";
import { getAddress } from "../../common/utils";
import { calcSipClientPort } from "../common.steps.utils";
import { SipClient } from "../../common/sip/sipClient";
import { LOGGER } from "../../common/logger.service";
import { CallbackStepDefinition } from "cucumber";
import { StepsDefinitionCallbackFunction } from "jest-cucumber/dist/src/feature-definition-creation";

const feature = loadFeature("features/health/system-health.feature");

const LOAD_API = "api/operational/lvn";

jest.setTimeout(50000);

const MAX_K8S_TIMEOUT = 20000; //20 sec

// const SUPPORTED_ACTIONS = ["INVITE", "UPDATE", "ACK", "CANCEL", "INFO", "BYE", "NOTIFY"];

defineFeature(feature, async (test) => {
	let healthResponse: any = undefined;
	let heathStatusCode: number | undefined = undefined;

	const sipClient: SipClient = new SipClient(calcSipClientPort(HEALTH_SIP_CLIENT_PORT));
	const sipService: McuService = new McuService(sipClient);

	const setTimeout = (context: Context) => {
		switch (context.platform) {
			case PlatformType.SWARM:
				return 300;
			default:
				return MAX_K8S_TIMEOUT;
		}
		return 500;
	};

	beforeAll(() => {
		process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
		sipClient.start();
	});
	afterAll(() => {
		sipClient.stop();
	});

	const checkHttpResponseCode = (then: any, context: Context) => {
		then(/^i should get (\d+) response$/, async (responseCode: string) => {
			expect(healthResponse).toBeTruthy();
			expect(heathStatusCode).toBe(parseInt(responseCode));
			healthResponse = JSON.parse(healthResponse);
		});
	};

	const HEALTH_TEST = "Checking cluster health";
	test.skip(HEALTH_TEST, async ({ given, when, then, and }) => {
		const context: Context = new Context();
		context.currentTest = HEALTH_TEST;
		LOGGER.debug(HEALTH_TEST);

		systemPlatformSetup(given, sipClient.getPort(), context);

		when(/^invoking healthcheck api$/, async () => {
			//      when(/^invoking healthcheck api on (\d+)$/, async (port : number) => {
			healthResponse = await new Promise<any>((resolve) => {
				const url = `https://${context.env.monitor.host}:${context.env.monitor.port}/lvn`;
				LOGGER.debug("URL", url);
				https.get(url, { rejectUnauthorized: false, timeout: setTimeout(context) }, (response) => {
					heathStatusCode = response.statusCode;

					let data = "";
					response.on("data", (_data) => (data += _data));
					response.on("end", () => {
						LOGGER.debug(data);
						return resolve(data);
					});
				});
			});
		});
		checkHttpResponseCode(then, context);

		and(/^status is (.*?)$/, async (status) => {
			expect<string>(healthResponse.lvn.status).toStrictEqual(status);
		});
	});

	const CLUSTER_LOAD_LEVEL = "Checking cluster load level";
	test.skip(CLUSTER_LOAD_LEVEL, async ({ given, when, then, and }) => {
		const context: Context = new Context();
		context.currentTest = CLUSTER_LOAD_LEVEL;
		LOGGER.debug(CLUSTER_LOAD_LEVEL);

		systemPlatformSetup(given, sipClient.getPort(), context);

		when(/^invoking cluster-load api$/, async () => {
			//when(/^invoking cluster-load api on (\d+)$/, async (port : number) => {
			healthResponse = await new Promise<any>((resolve) => {
				const url = `https://${context.env.monitor.host}:${context.env.monitor.port}/${LOAD_API}`;
				LOGGER.debug("URL", url);
				https.get(url, { rejectUnauthorized: false, timeout: setTimeout(context) }, (response) => {
					heathStatusCode = response.statusCode;

					let data = "";
					response.on("data", (_data) => (data += _data));
					response.on("end", () => {
						LOGGER.debug(data);
						return resolve(data);
					});
				});
			});
		});

		checkHttpResponseCode(then, context);

		and(/^status is (.*?)$/, async (status) => {
			/*
			 *  {"lvn":{"lvnId":"b44943da-48ec-4573-8e9b-7c4de01fc388","cpuUtilization":0.09420833333333334,"status":"INS"}}
			 * */
			expect<string>(healthResponse.lvn.status).toStrictEqual(status);
			expect<string>(healthResponse.lvn.lvnId).toBeTruthy();
			expect<string>(healthResponse.lvn.cpuUtilization).toBeLessThanOrEqual(100);
			expect<string>(healthResponse.lvn.cpuUtilization).toBeGreaterThan(0);
		});
	});

	const SIP_OPTIONS_TEST = "Checking system discovey";
	test("Sip options support", async ({ given, when, then, and }) => {
		const context: Context = new Context();
		context.currentTest = SIP_OPTIONS_TEST;

		systemPlatformSetup(given, sipClient.getPort(), context);

		when(/^sip options api is invoked$/, async () => {
			LOGGER.debug("Invoking SIP_OPTIONS api");

			const control: ControlSession = new ControlSession();
			control.cseq = <CSEQ>{ method: METHOD_INVITE, seq: 1 };
			control.from = new ContactDTO();
			control.from.user = "mcuautomation";
			control.from.domain = getAddress();
			control.from.port = sipClient.getPort();

			control.from.params = { tag: utils.rstring() };
			control.to = new ContactDTO();
			control.to.user = "mcuserver" /*janus*/;
			control.to.domain = context.address();
			control.callId = utils.rstring();
			const optionRes: ResponseDTO = await sipService.options(control);

			context[METHOD_OPTIONS] = optionRes;
		});

		then(/^i should get (\d+) response$/, async (status) => {
			LOGGER.debug(`i should get ${status} response`);
			const sipOption: ResponseDTO = context[METHOD_OPTIONS];
			expect(sipOption.status).toEqual(200);
		});

		and(/these options should be supported/, async (options: Array<{ option: string }>) => {
			LOGGER.debug(`these options should be supported: ${options.map((entry) => entry.option)}`);
			const sipOptions: ResponseDTO = context[METHOD_OPTIONS];

			expect(sipOptions.headers[SipHeaders.ALLOW.toLowerCase()]).toBeDefined();

			const serverOption = sipOptions.headers[SipHeaders.ALLOW.toLowerCase()].split(",");

			const found = options.some((sipOption) => serverOption.indexOf(sipOption.option) >= 0);

			expect(found).toBeTruthy();
		});
	});

	const DISCOVERY_TEST = "Checking discovery system";
	const discoveryScenario: StepsDefinitionCallbackFunction = async ({ given, when, then, and }) => {
		const context: Context = new Context();
		context.currentTest = DISCOVERY_TEST;
		LOGGER.debug(`Testing: ${DISCOVERY_TEST}`);

		systemPlatformSetup(given, sipClient.getPort(), context);

		when(/^invoking (.*?) api$/, async (service) => {
			context.currentTest = `${DISCOVERY_TEST}: ${service}`;
			const url = `http://${context.env.monitor.host}:8500/v1/query/${service}/execute`;
			healthResponse = await new Promise<any>((resolve) => {
				LOGGER.debug("URL", url);
				http.get(url, { timeout: setTimeout(context) }, (response) => {
					heathStatusCode = response.statusCode;

					let data = "";
					response.on("data", (_data) => (data += _data));
					response.on("end", () => {
						LOGGER.debug(data);
						return resolve(data);
					});
				});
			});
			context["HTTPReponse"] = { url: url, resposne: healthResponse };
		});
		checkHttpResponseCode(then, context);
	};

	if (process.env.PLATFORM_TYPE !== "SWARM") {
		test.skip(DISCOVERY_TEST, discoveryScenario);
	} else {
		test(DISCOVERY_TEST, discoveryScenario);
	}
});

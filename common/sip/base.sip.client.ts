import sip from "sip";
import parser from "xml2js";
import { DTO, RequestDTO, ResponseDTO } from "./dto/infoDTO";
import { Attributes, SipHeaders } from "../constants";
import { getAddress } from "../utils";
import { LOGGER } from "../logger.service";

export const SIP_PORT = 5060;

export interface TlsOptions {
	tls: Tls;
	port: number;
}
export interface Tls {
	key: string;
	cert: string;
	requestCert: boolean;
}

export class BaseSipClient {
	constructor(private port: number = SIP_PORT, private address: string | undefined = undefined) {}

	// protected sipMessageHandler(request: RequestDTO): void {
	// 	let rs: any;
	// 	if (request.headers && request.headers["call-id"]) {
	// 		const receivedMessages: Map<string, RequestDTO> = global[Attributes.RECIEVED_MESSAGES]
	// 			? global[Attributes.RECIEVED_MESSAGES]
	// 			: new Map<string, RequestDTO>();
	// 		receivedMessages.set(`${request.headers["call-id"]}_${request.method}`, request);
	// 		global[Attributes.RECIEVED_MESSAGES] = receivedMessages;
	// 	}
	//
	// 	if (request.content) {
	// 		LOGGER.debug("parse content...", request.content);
	// 		parser.parseString(request.content, function (err, result) {
	// 			if (err) {
	// 				LOGGER.error("Failed to parse msml:", err);
	// 				throw err;
	// 			}
	// 		});
	// 	}
	// 	switch (request.method) {
	// 		case "INFO":
	// 			LOGGER.info("=======> Info Message:", request);
	// 			rs = sip.makeResponse(request, 200, "Ok");
	// 			sip.send(rs);
	// 			LOGGER.info(`=======> Send 200 OK on ${request.method} : rs`);
	// 			break;
	// 		case "BYE":
	// 			LOGGER.info("=======> Bye Message:", request);
	// 			rs = sip.makeResponse(request, 200, "Ok");
	// 			sip.send(rs);
	//
	// 			LOGGER.info(`=======> Send 200 OK on ${request.method} : rs`);
	// 			break;
	// 		default:
	// 			LOGGER.info("=======> Message", request.method);
	// 			break;
	// 	}
	// }

	protected sipMessageHandler(request: RequestDTO): void {
		let rs: any;
		if (request.headers && request.headers["call-id"]) {
			const receivedMessages: Map<string, Array<RequestDTO>> = global[Attributes.RECIEVED_MESSAGES]
				? global[Attributes.RECIEVED_MESSAGES]
				: new Map<string, Map<string, Array<RequestDTO>>>();

			if (receivedMessages.get(`${request.headers["call-id"]}_${request.method}`)) {
				receivedMessages.get(`${request.headers["call-id"]}_${request.method}`)?.push(request);
			} else {
				const RequestArray: Array<RequestDTO> = new Array<RequestDTO>();
				RequestArray.push(request);
				receivedMessages.set(`${request.headers["call-id"]}_${request.method}`, RequestArray);
			}
			global[Attributes.RECIEVED_MESSAGES] = receivedMessages;
		}

		if (request.content) {
			LOGGER.debug({ action: "parse content...", data: request.content });
			parser.parseString(request.content, function (err, result) {
				if (err) {
					LOGGER.error({ action: "Failed to parse msml:", data: err });
					throw err;
				}
			});
		}
		switch (request.method) {
			case "INFO":
				LOGGER.info({ action: request.method, description: "=======> Info Message", request: request });
				rs = sip.makeResponse(request, 200, "Ok");
				sip.send(rs);
				LOGGER.info({ action: request.method, description: "=======> Send 200 OK", response: rs });
				break;
			case "BYE":
				LOGGER.info({ action: request.method, description: "=======> Bye Message", request: request });
				rs = sip.makeResponse(request, 200, "Ok");
				sip.send(rs);

				LOGGER.info({ action: request.method, description: "=======> Send 200 OK", response: rs });
				break;
			default:
				LOGGER.info({ action: request.method, description: "=======> Message" });
				break;
		}
	}

	public start = (tlsCfg: TlsOptions | undefined = undefined) => {
		const options: any = {
			protocol: "UDP",
			address: this.address || getAddress(),
			port: this.port,
			tls: tlsCfg,
		};
		LOGGER.info({ action: "Start SipClient", data: options });
		if (options.tls) {
			const tlsOptions = {
				tls: options.tls.tls,
				tls_port: options.tls.port,
				address: options.address,
				port: options.port,
			};
			LOGGER.debug({ action: "TLS", data: tlsOptions });
			sip.start(tlsOptions, this.sipMessageHandler.bind(this));
		} else {
			sip.start(options, this.sipMessageHandler.bind(this));
		}
	};

	public stop = () => {
		sip.stop({
			protocol: "UDP",
			address: this.address || getAddress(),
			port: this.port,
		});
	};

	protected sipResposneHandler<T extends ResponseDTO>(response: T): T | any {
		switch (response.status) {
			case 100: {
				LOGGER.info({ action: "sip:send, response 100", data: response });
				break;
			}
			case 183: {
				LOGGER.info({ action: "sip:send, response 183", data: response });
				return response;
			}
			case 200: {
				LOGGER.info({ action: "sip:send, response 200", data: response });
				return response;
			}
			default: {
				if (JSON.stringify(response.headers.cseq).includes("ACK")) {
					LOGGER.info({ action: "ACK response" });
					return {};
				}
				const errorMsg: string = response.headers[SipHeaders.P_ERROR.toLowerCase()]
					? response.headers[SipHeaders.P_ERROR.toLowerCase()]
					: "N/A";
				const sipError = {
					status: response.status,
					error: { reason: response.reason ? response.reason : "N/A", description: errorMsg },
					"call-id": response.headers[SipHeaders.CALL_ID],
					user: response.headers["from"] ? response.headers["from"]["uri"] : "N/A",
				};
				LOGGER.error({ err: sipError });
				const error: Error = new Error(
					`Status: ${sipError.status}, Reason: [${sipError.error.reason}, ${
						sipError.error.description
					}], Call-ID: ${sipError[SipHeaders.CALL_ID]}, user: ${sipError.user}`
				);
				error["response"] = response;
				throw error;
			}
		}
	}

	public async send<T extends ResponseDTO>(sipRequest: DTO): Promise<T> {
		return new Promise<T>((resolve, reject) => {
			LOGGER.info({ action: "sip:send, request", data: sipRequest });
			sip.send(sipRequest, (response: T) => {
				try {
					const result: any = this.sipResposneHandler(response);
					if (result) {
						if (Object.keys(result).length == 0) {
							return resolve();
						}
						return resolve(<T>result);
					}
				} catch (e) {
					reject(e);
				}
			});
		});
	}

	public parseUri = (uri: string) => {
		return sip.parseUri(uri);
	};

	public getPort(): number {
		return this.port;
	}
}

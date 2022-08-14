import { BaseSipClient, SIP_PORT } from "./base.sip.client";
import { DTO, RequestDTO, ResponseDTO } from "./dto/infoDTO";
import { LOGGER } from "../logger.service";
import { SipHeaders } from "../constants";

function duration(target, name, descriptor) {
	const original = descriptor.value;
	//LOGGER.log("name: "+typeof (name))
	// if (1 == 1) {
	descriptor.value = async function (...args) {
		const startTime = performance.now();
		const result: any = await original.apply(this, args);
		const endTime = performance.now();
		result.duration = endTime - startTime;
		LOGGER.debug({
			action: "Performance",
			data: {
				action: `${original.name}:${args[0].method ? args[0].method : "."}`,
				duration: result.duration,
			},
		});
		return result;
	};
	// } else {
	// 	descriptor.value = function (...args) {
	// 		const startTime = performance.now();
	// 		const result: any = original.apply(this, args);
	// 		const endTime = performance.now();
	// 		result.duration = endTime - startTime;
	// 		return result;
	// 	};
	// }
	return descriptor;
}

export class SipClient extends BaseSipClient {
	constructor(port: number = SIP_PORT, address: string | undefined = undefined) {
		super(port, address);
	}

	@duration
	public async send<T extends ResponseDTO>(sipRequest: DTO): Promise<T> {
		return await super.send(sipRequest);
	}

	protected sipResposneHandler<T extends ResponseDTO>(response: T): T | any {
		try {
			return super.sipResposneHandler(response);
		} catch (e) {
			if (e["response"]) {
				return e.response;
			}
			throw e;
		}
	}
}

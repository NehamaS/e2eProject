import * as sdpTransform from "sdp-transform";
import { SessionDescription } from "sdp-transform";

export class SdpService {
	public toSDP(sdp: any): SessionDescription {
		const sdpObj: SessionDescription = sdpTransform.parse(sdp);

		return sdpObj;
	}

	public toString(sdp: SessionDescription) {
		const result: string = sdpTransform.write(sdp);

		return result;
	}
}

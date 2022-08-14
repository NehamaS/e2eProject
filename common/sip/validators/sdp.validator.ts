import { BaseValidator } from "./validator";
import { RequestDTO, ResponseDTO } from "../dto/infoDTO";
import { SDPCaseType } from "../../../common/messages/factory";
import { SdpService } from "../sdp/sdp.service";
import { ControlSession, UserSession } from "../dto/controlSession";
import { getAddress } from "../../../common/utils";
import {
	MEDIA_DIRECTION_INACTIVE,
	MEDIA_DIRECTION_RECVONLY,
	MEDIA_DIRECTION_SENDONLY,
	MEDIA_DIRECTION_SENDRECV,
	CODECS_MAP,
	VIDEO_MEDIA_DIRECTION_SENDRECV,
} from "../../constants";
import { LOGGER } from "../../logger.service";

const service: SdpService = new SdpService();

export class SdpValidator extends BaseValidator {
	public validate(request: RequestDTO, response: ResponseDTO, session: ControlSession | UserSession): void {
		const sdpRequest: any = service.toSDP(request.content);
		const sdpResponse: any = service.toSDP(response.content);

		// LOGGER.log("sdpReq: " + JSON.stringify(sdpRequest));
		// LOGGER.log("sdpRes: " + JSON.stringify(sdpResponse));

		//this.validateAddres(sdpResponse.origin.address);

		switch (this.checkSDPType(sdpRequest, session)) {
			case "Invalid request":
				expect(this.checkSDPType(sdpRequest)).not.toBe("Invalid request");
				break;
			case "recivierUser":
				this.reciverUserSDP(sdpRequest, sdpResponse, session);
				break;
			case "VP9CodecInVideoMid":
				this.VP9CodecInVideoMid(sdpRequest, sdpResponse, session);
				break;
			case "oneAudioMid":
				this.oneAudioMid(sdpRequest, sdpResponse, session);
				break;
			case "videoSendrecv":
				this.videoSendrecv(sdpRequest, sdpResponse, session);
				break;
			case "pstn":
				this.pstnSDP(sdpRequest, sdpResponse, session);
				break;
			case "VideoSender":
				this.videoSenderSDP(sdpRequest, sdpResponse, session);
				break;
			case "VideoMultiSender":
				this.videoMultiSenderSDP(sdpRequest, sdpResponse, session);
				break;
			case "SSPublisher":
				this.ssPublisherSDP(sdpRequest, sdpResponse, session);
				break;
			// case "dataChannel":
			// 	this.dataChannelSDP(sdpRequest, sdpResponse, session);
			// 	break;
			case "InactiveUser":
				this.reciverUserSDP(sdpRequest, sdpResponse, session);
		}
	}

	public reciverUserSDP(sdpRequest: any, sdpResponse: any, session: ControlSession | UserSession): void {
		const sdpRequestGroup: string[] = sdpRequest.groups[0].mids.split(" ");
		const sdpResponseGroup: string[] = sdpResponse.groups[0].mids.split(" ");

		expect(sdpResponseGroup.length).toEqual(7);
		expect(sdpResponseGroup[6]).toEqual("screenShare");

		if (!session.env.isPrivate) {
			const msg = "Reciver user sdp's address mismatch";
			expect(session.env.sip.host.includes(sdpResponse.media[0].connection.ip), msg).toEqual(true);
		}

		if (session.codecOutPut) {
			expect(sdpResponse.media[0].payloads).toEqual(CODECS_MAP[`${session.codecOutPut}`].number);
		}

		const self = this;
		sdpResponseGroup.forEach(function (mid, i) {
			i == 0
				? expect(sdpResponse.media[i].type).toEqual("audio")
				: expect(sdpResponse.media[i].type).toEqual("video");
			typeof sdpResponse.media[i].mid == "number"
				? expect(sdpResponse.media[i].mid).toEqual(Number(mid))
				: expect(sdpResponse.media[i].mid).toEqual(mid);
			i != 0
				? expect(sdpResponse.media[i].direction).toEqual("sendonly")
				: sdpRequest.media[i].direction != MEDIA_DIRECTION_INACTIVE
				? expect(sdpResponse.media[i].direction).toEqual(MEDIA_DIRECTION_SENDRECV)
				: expect(sdpResponse.media[i].direction).toEqual(MEDIA_DIRECTION_INACTIVE);
			// LOGGER.log("validate rtp codec in mid: " + mid);
			if (session.codecOutPut) {
				expect(sdpResponse.media[0].rtp[0].codec.toLowerCase()).toEqual(session.codecOutPut.toLowerCase());
			} else {
				i == 0
					? expect(sdpResponse.media[i].rtp[0].codec).toEqual("opus")
					: expect(sdpResponse.media[i].rtp[0].codec).toEqual("VP8");
				expect(sdpResponse.media[i].protocol).toEqual(sdpRequest.media[i].protocol);
			}
		});
		if (session.caseType == "INVITE_WITH_USEDTX") {
			expect(sdpRequest.media[0].fmtp[0].config).toContain("usedtx=1");
			expect(sdpResponse.media[0].fmtp[0].config).toContain("usedtx=0");
		}
	}

	public videoSenderSDP(sdpRequest: any, sdpResponse: any, session: ControlSession | UserSession): void {
		LOGGER.debug({ action: "VideoSenderSDP" });

		const sdpRequestGroup: string[] = sdpRequest.groups[0].mids.split(" ");
		const sdpResponseGroup: string[] = sdpResponse.groups[0].mids.split(" ");

		expect(sdpResponseGroup.length).toEqual(8);
		expect(sdpResponseGroup[7]).toEqual(sdpRequestGroup[7]);

		const self = this;

		sdpResponseGroup.forEach(function (mid, i) {
			i == 0
				? expect(sdpResponse.media[i].type).toEqual("audio")
				: expect(sdpResponse.media[i].type).toEqual("video");
			typeof sdpResponse.media[i].mid == "number"
				? expect(sdpResponse.media[i].mid).toEqual(Number(mid))
				: expect(sdpResponse.media[i].mid).toEqual(mid);
			i == 0
				? expect(sdpResponse.media[i].direction).toEqual("sendrecv")
				: i == 7
				? expect(sdpResponse.media[i].direction).toEqual("recvonly")
				: expect(sdpResponse.media[i].direction).toEqual("sendonly");
			i == 0
				? expect(sdpResponse.media[i].rtp[0].codec).toEqual("opus")
				: expect(sdpResponse.media[i].rtp[0].codec).toEqual("VP8");
			if (!session.env.isPrivate) {
				const msg = "video sender sdp's address mismatch";
				expect(session.env.sip.host.includes(sdpResponse.media[0].connection.ip), msg).toEqual(true);
			}
			i == 0
				? expect(sdpResponse.media[i].protocol).toEqual(sdpRequest.media[i].protocol)
				: expect(sdpResponse.media[i].protocol).toEqual(sdpRequest.media[i].protocol);
		});
	}

	public videoMultiSenderSDP(sdpRequest: any, sdpResponse: any, session: ControlSession | UserSession): void {
		LOGGER.debug({ action: "VideoSenderSDP" });

		const sdpRequestGroup: string[] = sdpRequest.groups[0].mids.split(" ");
		const sdpResponseGroup: string[] = sdpResponse.groups[0].mids.split(" ");

		expect(sdpResponseGroup.length).toEqual(9);
		expect(sdpResponseGroup[8]).toEqual(sdpRequestGroup[8]);

		const self = this;

		sdpResponseGroup.forEach(function (mid, i) {
			i == 0
				? expect(sdpResponse.media[i].type).toEqual("audio")
				: expect(sdpResponse.media[i].type).toEqual("video");
			typeof sdpResponse.media[i].mid == "number"
				? expect(sdpResponse.media[i].mid).toEqual(Number(mid))
				: expect(sdpResponse.media[i].mid).toEqual(mid);
			i == 0
				? expect(sdpResponse.media[i].direction).toEqual("sendrecv")
				: i == 7 || i == 8
				? expect(sdpResponse.media[i].direction).toEqual("recvonly")
				: expect(sdpResponse.media[i].direction).toEqual("sendonly");
			i == 0
				? expect(sdpResponse.media[i].rtp[0].codec).toEqual("opus")
				: expect(sdpResponse.media[i].rtp[0].codec).toEqual("VP8");
			if (!session.env.isPrivate) {
				const msg = "multi video sender sdp's addres mismatch";
				expect(session.env.sip.host.includes(sdpResponse.media[0].connection.ip), msg).toEqual(true);
			}
			i == 0
				? expect(sdpResponse.media[i].protocol).toEqual(sdpRequest.media[i].protocol)
				: expect(sdpResponse.media[i].protocol).toEqual(sdpRequest.media[i].protocol);
		});
	}

	public ssPublisherSDP(sdpRequest: any, sdpResponse: any, session: ControlSession | UserSession): void {
		expect(sdpResponse.groups[0].mids).toEqual(0);
		expect(sdpResponse.media[0].type).toEqual("video");
		expect(sdpResponse.media[0].mid).toEqual(0);
		expect(sdpResponse.media[0].direction).toEqual("recvonly");
		if (!session.env.isPrivate) {
			const msg = "screen share publisher sdp's address mismatch";
			expect(session.env.sip.host.includes(sdpResponse.media[0].connection.ip), msg).toEqual(true);
		}
		expect(sdpResponse.media[0].protocol).toEqual(sdpRequest.media[0].protocol);
		expect(sdpResponse.media[0].fmtp[0].config).toEqual("useadaptivelayering_v2=true");
		expect(sdpResponse.media[0].xGoogleFlag).toEqual("conference");
	}

	public oneAudioMid(sdpRequest: any, sdpResponse: any, session: ControlSession | UserSession): void {
		expect(sdpResponse.media[0].type).toEqual("audio");
		if (session.userType == MEDIA_DIRECTION_RECVONLY) {
			expect(sdpResponse.media[0].direction).toEqual(MEDIA_DIRECTION_SENDONLY);
		}
		if (session.userType == MEDIA_DIRECTION_SENDONLY) {
			expect(sdpResponse.media[0].direction).toEqual(MEDIA_DIRECTION_RECVONLY);
		}
		if (session.userType == MEDIA_DIRECTION_SENDRECV) {
			expect(sdpResponse.media[0].direction).toEqual(MEDIA_DIRECTION_SENDRECV);
		}
		if (session.codecOutPut) {
			expect(sdpResponse.media[0].payloads).toEqual(CODECS_MAP[`${session.codecOutPut}`].number);
			expect(sdpResponse.media[0].rtp[0].codec.toLowerCase()).toEqual(session.codecOutPut.toLowerCase());
		}
	}

	public videoSendrecv(sdpRequest: any, sdpResponse: any, session: ControlSession | UserSession): void {
		expect(sdpResponse.media[0].type).toEqual("audio");
		expect(sdpResponse.media[0].direction).toEqual(MEDIA_DIRECTION_SENDRECV);
		expect(sdpResponse.media[1].type).toEqual("video");
		expect(sdpResponse.media[1].connection.ip).toEqual(getAddress());
		expect(sdpResponse.media[1].direction).toEqual(MEDIA_DIRECTION_SENDRECV);
	}

	// public dataChannelSDP(sdpRequest: any, sdpResponse: any, session: ControlSession | UserSession): void {
	// 	expect(sdpResponse.groups[0].mids).toEqual(0);
	//
	// 	expect(sdpResponse.media[0].type).toEqual("application");
	// 	expect(sdpResponse.media[0].mid).toEqual(0);
	// 	if (!session.env.isPrivate) {
	// 		const msg = "data channel sdp's address mismatch";
	// 		expect(session.env.sip.host.includes(sdpResponse.media[0].connection.ip), msg).toEqual(true);
	// 	}
	// 	expect(sdpResponse.media[0].protocol).toEqual(sdpRequest.media[0].protocol);
	// }

	public pstnSDP(sdpRequest: any, sdpResponse: any, session: ControlSession | UserSession): void {
		if (session.codecOutPut) {
			expect(sdpResponse.media[0].payloads).toEqual(CODECS_MAP[`${session.codecOutPut}`].number);
			expect(sdpResponse.media[0].rtp[0].codec.toLowerCase()).toEqual(session.codecOutPut.toLowerCase());
		}
		expect(sdpResponse.groups[0].mids).toEqual(0);
		expect(sdpResponse.media[0].type).toEqual("audio");
		expect(sdpResponse.media[0].mid).toEqual(0);
		expect(sdpResponse.media[0].direction).toEqual("sendrecv");
		if (!session.env.isPrivate) {
			const msg = "pstn sdp's address mismatch";
			expect(session.env.sip.host.includes(sdpResponse.media[0].connection.ip), msg).toEqual(true);
		}
		expect(sdpResponse.media[0].protocol).toEqual(sdpRequest.media[0].protocol);
	}

	public VP9CodecInVideoMid(sdpRequest: any, sdpResponse: any, session: ControlSession | UserSession): void {
		expect(sdpResponse.media.length).toEqual(2);
		expect(sdpResponse.media[0].mid).toEqual(0);
		expect(sdpResponse.media[0].direction).toEqual("sendrecv");
		if (!session.env.isPrivate) {
			const msg = "VP9 video sdp's address mismatch";
			expect(session.env.sip.host.includes(sdpResponse.media[0].connection.ip), msg).toEqual(true);
		}
		expect(sdpResponse.media[0].protocol).toEqual(sdpRequest.media[0].protocol);
		expect(sdpResponse.media[1].port).toEqual(0);
	}

	public checkSDPType(sdpRequest: any, session?: ControlSession | UserSession): string {
		if (session) {
			if (session.SDPcaseType != undefined) {
				switch (session.SDPcaseType) {
					case SDPCaseType.VP9_CODEC_IN_VIDEO_MID:
						return "VP9CodecInVideoMid";
				}
			}
			if (session.caseType == "MRF_USER" || session.caseType == "MRF_UPDATE") {
				if (sdpRequest.media[0].invalid[0].value == "curr:qos local none") return "MrfUser";
				else if (sdpRequest.media[0].invalid[0].value == "curr:qos local sendrecv") return "MrfUpdate";
			}

			if (
				session.userType == MEDIA_DIRECTION_SENDONLY ||
				session.userType == MEDIA_DIRECTION_RECVONLY ||
				session.userType == MEDIA_DIRECTION_SENDRECV
			) {
				return "oneAudioMid";
			}
			if (session.userType == VIDEO_MEDIA_DIRECTION_SENDRECV) {
				return "videoSendrecv";
			}
		}

		if (sdpRequest.media[0].direction == MEDIA_DIRECTION_INACTIVE) {
			return "InactiveUser";
		}

		if (sdpRequest.name.includes("SSC")) {
			return "ssc_user";
		}

		if (sdpRequest.groups[0].mids == 0) {
			if (sdpRequest.media[0].type == "video") return "SSPublisher";
			else if (sdpRequest.media[0].type == "audio") return "pstn";
			//	else if (sdpRequest.media[0].type == "application") return "dataChannel";
		} else if (
			sdpRequest.groups[0].mids.split(" ").length == 8 &&
			sdpRequest.groups[0].mids.split(" ")[7].includes("@")
		) {
			return "VideoSender";
		} else if (
			sdpRequest.groups[0].mids.split(" ").length == 9 &&
			sdpRequest.groups[0].mids.split(" ")[7].includes("@") &&
			sdpRequest.groups[0].mids.split(" ")[8].includes("@")
		) {
			return "VideoMultiSender";
		} else if (
			sdpRequest.groups[0].mids.split(" ").length == 7 &&
			sdpRequest.groups[0].mids.split(" ")[6] == "screenShare"
		) {
			return "recivierUser";
		}

		return "Invalid request";

		// });
	}

	/**
	 * Validate connection address, originates for a well known address in cluster.
	 * @param connAddress
	 * @private
	 */
	// private validateAddres(connAddress: string): void {
	// 	//expect(connAddress).toEqual(context.address());
	//
	// 	let cluster: Array<string> = new Array<string>();
	//
	// 	if (true) {
	// 		LOGGER.warn("SDP address validation....");
	// 		return;
	// 	}
	//
	// 	const platform: PlatformType = PlatformType.SWARM;
	//
	// 	switch (platform) {
	// 		case PlatformType.SWARM: {
	// 			cluster = ["10.45.35.61", "10.45.35.62", "10.45.35.64"];
	// 			break;
	// 		}
	// 		case PlatformType.K8S: {
	// 			cluster = ["10.171.10.12", "10.171.10.11", "10.171.10.14", "10.171.10.13"];
	// 			break;
	// 		}
	// 		default: {
	// 			break;
	// 		}
	// 	}
	// 	/*
	//     In case context.address is part of cluster, allow any of cluster member, else ignore
	//      */
	// 	// const isPartOfCluster: string | undefined = cluster.find((entry) => entry == context.address());
	// 	// if (isPartOfCluster) {
	// 	// 	LOGGER.debug("SDP address validation passed - exists in cluster");
	// 	// } else {
	// 	// 	LOGGER.warn("SDP address validation skipped");
	// 	// }
	// }
}

import { CreateRoom, SDP } from "./sdp/room.sdp";

import * as xml2js from "xml2js";

const obj = { root: { $: { id: "my id" }, _: "my inner text" } };
import { SdpService } from "../sip/sdp/sdp.service";
import { CaseType, SDPCaseType } from "../messages/factory";
import * as fs from "fs";
import {
	MEDIA_DIRECTION_INACTIVE,
	MEDIA_DIRECTION_RECVONLY,
	MEDIA_DIRECTION_SENDRECV,
	CODECS_MAP,
	MEDIA_DIRECTION_SENDONLY,
	MEDIA_TYPE_AUDIO,
} from "../constants";
import { strToCaseType } from "../utils";

const service: SdpService = new SdpService();
export const PORT_RANGE: { min: number; max: number } = { min: 30000, max: 60000 };

export enum SdpType {
	createRoom,
	receiver,
	VideoSender,
	VideoMultiSender,
	SSPublisher,
	//dataChannel,
	pstn,
	inactive,
	ack,
	mrf,
	oneAudioMid,
	ssc_user,
	video_sendrecv,
}

export class SdpFactory {
	private builder = new xml2js.Builder();

	private nameTransform = (name: string) => {
		switch (name) {
			case "callId":
				return "call-id";
			case "meetingId":
				return "P-Meeting-Id";
			case "dialogType":
				return "P-Dialogue-Type";
			// case "acceptContact":
			// 	return "Accept-Contact";
		}
		return name;
	};

	public sdp(type: SdpType, session: any) {
		let sdp: SDP;
		switch (type) {
			case SdpType.createRoom:
				return this.createRoom(session);
			case SdpType.receiver:
				return this.receiver(session);
			case SdpType.pstn:
				return this.pstn(session);
			case SdpType.VideoSender:
				return this.VideoSender(session);
			case SdpType.VideoMultiSender:
				return this.VideoMultiSender(session);
			case SdpType.SSPublisher:
				return this.SSPublisher(session);
			// case SdpType.dataChannel:
			//	return this.dataChannel(session);
			case SdpType.inactive:
				return this.inactive(session);
			case SdpType.ack:
				return this.ack(session);
			case SdpType.mrf:
				return this.mrf(session);
			case SdpType.oneAudioMid:
				return this.oneAudioMid(session);
			case SdpType.ssc_user:
				return this.sscUser(session);
			case SdpType.video_sendrecv:
				return this.videoSendrecv(session);
			default:
				throw new Error("unsupported sdp type!!");
		}
		return this.builder.buildObject(sdp, {
			attrNameProcessors: [this.nameTransform],
		});
	}

	private mrf = (session: any) => {
		let mid_MRF;
		if (session.userType == "MRF_USER") {
			mid_MRF = fs.readFileSync(`${__dirname}/SDP_templates/MRF.sdp`, "utf8");
		} else if (session.userType == "MRF_UPDATE") {
			mid_MRF = fs.readFileSync(`${__dirname}/SDP_templates/MRF_UPDATE.sdp`, "utf8");
		}

		const port: string = session.port ? session.port : this.shortRstring();
		const address = session.from.domain;

		const mid_MRFObject: any = service.toSDP(mid_MRF);

		mid_MRFObject.media[0].port = port;
		mid_MRFObject.media[0].connection.ip = address;

		const sdpString: string = service.toString(mid_MRFObject);
		return sdpString;
	};

	private sscUser = (session: any) => {
		const mid_sscUser = fs.readFileSync(`${__dirname}/SDP_templates/ssc_user.sdp`, "utf8");

		const port: string = session.port ? session.port : this.shortRstring();
		const address = session.from.domain;

		const mid_sscUserObject: any = service.toSDP(mid_sscUser);

		mid_sscUserObject.media[0].port = port;
		mid_sscUserObject.connection.ip = address;
		mid_sscUserObject.origin.address = address;

		const sdpString: string = service.toString(mid_sscUserObject);
		return sdpString;
	};

	private videoSendrecv = (session: any) => {
		const mid_sscUser = fs.readFileSync(`${__dirname}/SDP_templates/sendrecv_Video.sdp`, "utf8");

		const audioPort: string = this.shortRstring();
		const videoPort: string = this.shortRstring();
		const address = session.from.domain;

		session.StreamDTO.assrc_Out = "16799820";
		session.StreamDTO.vssrc_Out = 0;
		session.StreamDTO.localPort = audioPort;

		const sendrecv_VideoObject: any = service.toSDP(mid_sscUser);

		sendrecv_VideoObject.connection.ip = address;
		sendrecv_VideoObject.origin.address = address;

		sendrecv_VideoObject.media[0].port = audioPort;
		sendrecv_VideoObject.media[1].port = videoPort;

		const sdpString: string = service.toString(sendrecv_VideoObject);
		return sdpString;
	};

	private pstn = (session: any) => {
		const port: string = session.port ? session.port : this.shortRstring();
		session.port = port;
		const protocol = "RTP/AVP";
		const ssrc: string = port + "222";
		const group = "0";
		const address = session.from.domain;
		const semantic = "WMS JRjLxG92VHHxGAdNjcS6jUie3DnHEnTwzChM";
		const sessionId = port + "111";

		session.StreamDTO.assrc_Out = ssrc;
		session.StreamDTO.vssrc_Out = 0;
		session.StreamDTO.localPort = port;

		const sdpObject: any = this.SDP_head(sessionId, address, group, semantic);

		const media: any[] = [
			this.mid_Audio(
				protocol,
				port,
				address,
				ssrc,
				session.srtp,
				session.caseType,
				session.codecListInput,
				session.codecOutPut
			),
		];

		sdpObject.media = media;

		const sdpString: string = service.toString(sdpObject);

		return sdpString;
	};

	private defaultAudioSDP(session: any): any {
		let port: string;
		if (session.newPort) {
			port = this.shortRstring();
		} else port = session.port ? session.port : this.shortRstring();
		session.port = port;
		let protocol = "RTP/AVP";
		// let payloads = "96 110 112 97 111";
		let payloads = "125";
		const ssrc: string = port + "222";
		const group = "0 1 2 3 4 5 screenShare";
		const address = session.from.domain;
		const semantic = "WMS JRjLxG92VHHxGAdNjcS6jUie3DnHEnTwzChM";
		const sessionId = port + "111";
		if (session.srtp == "true") {
			protocol = "UDP/TLS/RTP/SAVPF";
			payloads = "96 116 118 97 117";
		}
		session.StreamDTO.assrc_Out = ssrc;
		session.StreamDTO.vssrc_Out = 0;
		//session.vssrc_Out=ssrc1
		//session.StreamDTO.assrc_Out = "1" + port;
		//session.StreamDTO.vssrc_Out = "0";
		session.StreamDTO.localPort = port;

		const sdpObject: any = this.SDP_head(sessionId, address, group, semantic);
		let mid_RecvOnly: any;
		const media: any[] = [];
		const sdpRequestGroup: string[] = group.split(" ");
		sdpRequestGroup.forEach((mid) => {
			if (mid == "0")
				mid_RecvOnly = this.mid_Audio(
					protocol,
					port,
					address,
					ssrc,
					session.srtp,
					session.caseType,
					session.codecListInput,
					session.codecOutPut,
					session.userType
				);
			else mid_RecvOnly = this.mid_VideoRecvOnly(protocol, port, address, mid, payloads, session.srtp);
			media.push(mid_RecvOnly);
		});

		sdpObject.media = media;

		if (session.SDPcaseType != undefined) {
			switch (session.SDPcaseType) {
				case SDPCaseType.SENDRECV_DIRECTION_IN_VIDEO_RECVONLY_MID:
					sdpObject.media[1].direction = MEDIA_DIRECTION_SENDRECV;
					break;
				case SDPCaseType.VP9_CODEC_IN_VIDEO_MID:
					for (let i = 1; i < 7; i++) sdpObject.media[i].rtp[0].codec = "VP9";
					break;
				case SDPCaseType.NOT_SUPPORTED_CODEC_IN_AUDIO_MID:
					sdpObject.media[0].rtp[0].codec = "G711";
					break;
			}
		}

		return sdpObject;
	}

	private oneAudioMid(session: any): any {
		let port: string;
		if (session.newPort) {
			port = this.shortRstring();
		} else port = session.port ? session.port : this.shortRstring();
		session.port = port;
		const protocol = "RTP/AVP";
		const ssrc: string = port + this.threeCharsRstring();
		const group = "0";
		const address = session.newIp ? session.newIp : session.from.domain;
		const semantic = "WMS JRjLxG92VHHxGAdNjcS6jUie3DnHEnTwzChM";
		const sessionId = port + "111";
		session.StreamDTO.assrc_Out = ssrc;
		session.StreamDTO.vssrc_Out = 0;
		session.StreamDTO.localPort = port;
		const sdpObject: any = this.SDP_head(sessionId, address, group, semantic);

		const media: any[] = [];
		const mid_RecvOnly = this.mid_Audio(
			protocol,
			port,
			address,
			ssrc,
			session.srtp,
			session.caseType,
			session.codecListInput,
			session.codecOutPut,
			session.userType
		);
		media.push(mid_RecvOnly);
		media[0].direction = session.userType;
		if (session.userType == MEDIA_DIRECTION_RECVONLY) {
			delete media[0].ssrcs;
		}
		sdpObject.media = media;
		const sdpString: string = service.toString(sdpObject);
		return sdpString;
	}

	private sdpToStr(sdp: any): string {
		const sdpString: string = service.toString(sdp);

		return sdpString;
	}

	private receiver = (session: any) => {
		const sdpObject: any = this.defaultAudioSDP(session);
		return this.sdpToStr(sdpObject);
	};

	private VideoSender = (session: any) => {
		const port: string = session.port ? session.port : this.shortRstring();
		session.port = port;
		let protocol = "RTP/AVP";
		// let payloads = "96 110 112 97 111";
		let payloads = "125";
		const ssrc: string = port + "222";
		const ssrc1: string = this.longRstring();
		const ssrc2: string = this.longRstring();
		const group: string = "0 1 2 3 4 5 screenShare " + session.from.user + "@gmail.com";
		const address = session.from.domain;
		const semantic = "WMS JRjLxG92VHHxGAdNjcS6jUie3DnHEnTwzChM";
		const sessionId = port + "111";
		if (session.srtp == "true") {
			protocol = "UDP/TLS/RTP/SAVPF";
			payloads = "96 116 118 97 117";
		}
		session.StreamDTO.assrc_Out = ssrc;
		session.StreamDTO.vssrc_Out = ssrc1;
		//session.StreamDTO.assrc_Out = "1" + port;
		//session.StreamDTO.vssrc_Out = "2" + port;
		session.StreamDTO.localPort = port;

		const sdpObject: any = this.SDP_head(sessionId, address, group, semantic);
		let singleMid: any;

		const media: any[] = [];
		const sdpRequestGroup: string[] = group.split(" ");
		sdpRequestGroup.forEach((mid) => {
			if (mid == "0") singleMid = this.mid_Audio(protocol, port, address, ssrc, session.srtp, session.caseType);
			else if (mid == session.from.user + "@gmail.com") {
				singleMid = this.mid_VideoSendOnly(
					protocol,
					port,
					address,
					mid,
					ssrc1,
					ssrc2,
					false,
					payloads,
					session.srtp
				);
			} else singleMid = this.mid_VideoRecvOnly(protocol, port, address, mid, payloads, session.srtp);
			media.push(singleMid);
		});

		sdpObject.media = media;

		const sdpString: string = service.toString(sdpObject);

		return sdpString;
	};

	private VideoMultiSender = (session: any) => {
		const port: string = session.port ? session.port : this.shortRstring();
		let protocol = "RTP/AVP";
		// let payloads = "96 110 112 97 111";
		let payloads = "125";
		const ssrc: string = port + "222";
		const ssrc1: string = this.longRstring();
		const ssrc2: string = this.longRstring();
		const ssrc3: string = this.longRstring();
		const ssrc4: string = this.longRstring();
		const group: string =
			"0 1 2 3 4 5 screenShare " +
			"hd_" +
			session.from.user +
			"@gmail.com " +
			"sd_" +
			session.from.user +
			"@gmail.com";
		const address = session.from.domain;
		const semantic = "WMS JRjLxG92VHHxGAdNjcS6jUie3DnHEnTwzChM";
		const sessionId = port + "111";
		if (session.srtp == "true") {
			protocol = "UDP/TLS/RTP/SAVPF";
			payloads = "96 116 118 97 117";
		}
		session.StreamDTO.assrc_Out = ssrc;
		session.StreamDTO.vssrc_Out = ssrc1;
		//session.StreamDTO.assrc_Out = "1" + port;
		//session.StreamDTO.vssrc_Out = "2" + port;
		session.StreamDTO.localPort = port;

		const sdpObject: any = this.SDP_head(sessionId, address, group, semantic);
		let singleMid: any;

		const media: any[] = [];
		const sdpRequestGroup: string[] = group.split(" ");
		sdpRequestGroup.forEach((mid) => {
			if (mid == "0") singleMid = this.mid_Audio(protocol, port, address, ssrc, session.srtp, session.caseType);
			else if (mid == "hd_" + session.from.user + "@gmail.com") {
				singleMid = this.mid_VideoSendOnly(
					protocol,
					port,
					address,
					mid,
					ssrc1,
					ssrc2,
					false,
					payloads,
					session.srtp
				);
			} else if (mid == "sd_" + session.from.user + "@gmail.com") {
				singleMid = this.mid_VideoSendOnly(
					protocol,
					port,
					address,
					mid,
					ssrc3,
					ssrc4,
					false,
					payloads,
					session.srtp
				);
			} else singleMid = this.mid_VideoRecvOnly(protocol, port, address, mid, payloads, session.srtp);
			media.push(singleMid);
		});

		sdpObject.media = media;

		const sdpString: string = service.toString(sdpObject);

		return sdpString;
	};

	private SSPublisher = (session: any) => {
		let port: string;
		if (session.newPort) {
			port = this.shortRstring();
		} else port = session.port ? session.port : this.shortRstring();
		session.port = port;
		let protocol = "RTP/AVP";
		// let payloads = "96 110 112 97 111";
		let payloads = "125";
		const ssrc1: string = port + "555";
		const ssrc2: string = port + "666";
		const group = "0";
		const address = session.from.domain;
		const semantic = "WMS JRjLxG92VHHxGAdNjcS6jUie3DnHEnTwzChM";
		const sessionId = port + "111";
		if (session.srtp == "true") {
			protocol = "UDP/TLS/RTP/SAVPF";
			payloads = "96 116 118 97 117";
		}

		const sdpObject: any = this.SDP_head(sessionId, address, group, semantic);

		const media: any[] = [
			this.mid_VideoSendOnly(protocol, port, address, "0", ssrc1, ssrc2, true, payloads, session.srtp),
		];

		sdpObject.media = media;
		if (session.SDPcaseType != undefined) {
			switch (session.SDPcaseType) {
				case SDPCaseType.NO_PUBLISHER_IN_SS_SDP:
					delete sdpObject.media[0];
					break;
			}
		}

		const sdpString: string = service.toString(sdpObject);

		return sdpString;
	};

	// private dataChannel = (session: any) => {
	// 	const port: string = this.shortRstring();
	// 	let protocol = "UDP/SCTP";
	// 	const group = "0";
	// 	const address = session.from.domain;
	// 	const semantic = "WMS";
	// 	const sessionId = port + "111";
	// 	if (session.srtp == "true") {
	// 		protocol = "UDP/DTLS/SCTP";
	// 	}
	//
	// 	const sdpObject: any = this.SDP_head(sessionId, address, group, semantic);
	//
	// 	const media: any[] = [this.mid_DC(protocol, port, address, session.srtp)];
	//
	// 	sdpObject.media = media;
	//
	// 	const sdpString: string = service.toString(sdpObject);
	//
	// 	return sdpString;
	// };

	private createRoom = (session: any) => {
		const port: string = this.shortRstring();
		const address = session.from.domain;
		const sdpObject: any = this.create_Room(port, address);
		const sdpString: string = service.toString(sdpObject);
		return sdpString;
	};

	private ack = (session: any) => {
		const port: string = this.shortRstring();
		const address = session.from.domain;
		const sdpObject: any = this.ack_User(port, address, session.caseType);
		const sdpString: string = service.toString(sdpObject);
		return sdpString;
	};

	private ack_User = (port: string, address: string, caseType: string): any => {
		const ack_User = fs.readFileSync(`${__dirname}/SDP_templates/ack_User.sdp`, "utf8");

		const ack_UserObject: any = service.toSDP(ack_User);

		ack_UserObject.media[0].port = port;
		if (caseType == "INVITE_PSTN_ON_HOLD") ack_UserObject.media[0].direction = "inactive";

		return ack_UserObject;
	};

	private create_Room = (port: string, address: string): any => {
		const create_Room = fs.readFileSync(`${__dirname}/SDP_templates/create_Room.sdp`, "utf8");

		const create_RoomObject: any = service.toSDP(create_Room);

		create_RoomObject.media[0].port = port;
		create_RoomObject.connection.ip = address;
		create_RoomObject.origin.address = address;

		return create_RoomObject;
	};

	private SDP_head = (sessionId: string, address: string, group: string, semantic: string): any => {
		const SDP_head = fs.readFileSync(`${__dirname}/SDP_templates/SDP_head.sdp`, "utf8");

		const SDP_headObject: any = service.toSDP(SDP_head);

		SDP_headObject.msidSemantic.token = semantic;
		SDP_headObject.origin.sessionId = sessionId;
		SDP_headObject.origin.address = address;
		SDP_headObject.groups[0].mids = group;

		return SDP_headObject;
	};

	private mid_Audio = (
		protocol: string,
		port: string,
		address: string,
		ssrc: string,
		srtp: boolean,
		caseType: string,
		codecListInput?: string,
		codecOutPut?: string,
		userType?: string
	): any => {
		let mid_Audio: string;
		if (codecListInput) {
			mid_Audio = fs.readFileSync(`${__dirname}/SDP_templates/codecs.sdp`, "utf8");
		} else {
			mid_Audio = fs.readFileSync(`${__dirname}/SDP_templates/mid_Audio.sdp`, "utf8");
		}
		const mid_srtp_ice = fs.readFileSync(`${__dirname}/SDP_templates/srtp_ice.sdp`, "utf8");

		if (srtp) mid_Audio = mid_Audio + mid_srtp_ice;
		const mid_AudioObject: any = service.toSDP(mid_Audio);
		if (caseType == "INVITE_WITH_USEDTX") {
			mid_AudioObject.media[0].fmtp[0].config = "minptime=10;usedtx=1;useinbandfec=1";
		}
		if (userType) {
			mid_AudioObject.media[0].direction = userType;
		}
		mid_AudioObject.media[0].protocol = protocol;
		mid_AudioObject.media[0].port = port;
		mid_AudioObject.media[0].connection.ip = address;
		if (codecListInput) {
			const codecListArray: string[] = [];
			let codecListString: string;

			codecListInput.split(",").forEach((element, index) => {
				codecListArray[index] = CODECS_MAP[`${element}`].number;
				if (CODECS_MAP[`${element}`].rtp) mid_AudioObject.media[0].rtp.push(CODECS_MAP[`${element}`].rtp);
				if (CODECS_MAP[`${element}`].fmtp) mid_AudioObject.media[0].fmtp.push(CODECS_MAP[`${element}`].fmtp);
			});
			codecListString = codecListArray.toString();
			codecListString = codecListString.split(",").join(" ");
			mid_AudioObject.media[0].payloads = codecListString;
		}

		const ssrc_a: number[] = [0, 1, 2, 3];

		ssrc_a.forEach((id) => (mid_AudioObject.media[0].ssrcs[id].id = ssrc));
		return mid_AudioObject.media[0];
	};

	private mid_VideoRecvOnly = (
		protocol: string,
		port: string,
		address: string,
		mid: string,
		payloads: string,
		srtp: boolean
	): any => {
		let mid_VideoRecvOnly = fs.readFileSync(`${__dirname}/SDP_templates/mid_VideoRecvOnly.sdp`, "utf8");
		const mid_srtp_ice = fs.readFileSync(`${__dirname}/SDP_templates/srtp_ice.sdp`, "utf8");

		if (srtp) mid_VideoRecvOnly = mid_VideoRecvOnly + mid_srtp_ice;

		const mid_VideoRecvOnlyObject: any = service.toSDP(mid_VideoRecvOnly);
		mid_VideoRecvOnlyObject.media[0].protocol = protocol;
		mid_VideoRecvOnlyObject.media[0].port = port;
		mid_VideoRecvOnlyObject.media[0].connection.ip = address;
		mid_VideoRecvOnlyObject.media[0].mid = mid;
		mid_VideoRecvOnlyObject.media[0].payloads = payloads;
		if (srtp == true) {
			for (let i = 0; i < payloads.split(" ").length; i++) {
				mid_VideoRecvOnlyObject.media[0].rtp[i].payload = payloads.split(" ")[i];
			}
			mid_VideoRecvOnlyObject.media[0].fmtp[1].payload = payloads.split(" ")[4];
			mid_VideoRecvOnlyObject.media[0].fmtp[1].config = "apt=" + payloads.split(" ")[1];
		}
		return mid_VideoRecvOnlyObject.media[0];
	};

	private mid_VideoSendOnly = (
		protocol: string,
		port: string,
		address: string,
		mid: any,
		ssrc1: string,
		ssrc2: string,
		candidate: boolean,
		payloads: string,
		srtp: boolean
	) => {
		const candidates = fs.readFileSync(`${__dirname}/SDP_templates/candidates.sdp`, "utf8");

		let mid_VideoSendOnly = fs.readFileSync(`${__dirname}/SDP_templates/mid_VideoSendOnly.sdp`, "utf8");
		const mid_srtp_ice = fs.readFileSync(`${__dirname}/SDP_templates/srtp_ice.sdp`, "utf8");

		if (srtp) mid_VideoSendOnly = mid_VideoSendOnly + mid_srtp_ice;

		if (candidate) {
			mid_VideoSendOnly = mid_VideoSendOnly + candidates;
		}

		const mid_VideoSendOnlyObject: any = service.toSDP(mid_VideoSendOnly);
		mid_VideoSendOnlyObject.media[0].port = port;
		mid_VideoSendOnlyObject.media[0].connection.ip = address;
		mid_VideoSendOnlyObject.media[0].mid = mid;
		mid_VideoSendOnlyObject.media[0].protocol = protocol;
		mid_VideoSendOnlyObject.media[0].payloads = payloads;
		if (srtp == true) {
			for (let i = 0; i < payloads.split(" ").length; i++) {
				mid_VideoSendOnlyObject.media[0].rtp[i].payload = payloads.split(" ")[i];
			}
			mid_VideoSendOnlyObject.media[0].fmtp[1].payload = payloads.split(" ")[4];
			mid_VideoSendOnlyObject.media[0].fmtp[1].config = "apt=" + payloads.split(" ")[1];
		}
		const ssrc1_a: number[] = [0, 1, 2, 3];
		const ssrc2_a: number[] = [4, 5, 6, 7];

		ssrc1_a.forEach((id) => (mid_VideoSendOnlyObject.media[0].ssrcs[id].id = ssrc1));
		ssrc2_a.forEach((id) => (mid_VideoSendOnlyObject.media[0].ssrcs[id].id = ssrc2));

		return mid_VideoSendOnlyObject.media[0];
	};

	private mid_DC = (protocol: string, port: string, address: string, srtp: boolean) => {
		let mid_DC = fs.readFileSync(`${__dirname}/SDP_templates/mid_DC.sdp`, "utf8");
		const mid_srtp_ice = fs.readFileSync(`${__dirname}/SDP_templates/srtp_ice.sdp`, "utf8");

		if (srtp) mid_DC = mid_DC + mid_srtp_ice;

		const mid_DCObject: any = service.toSDP(mid_DC);
		mid_DCObject.media[0].protocol = protocol;
		mid_DCObject.media[0].port = port;
		mid_DCObject.media[0].connection.ip = address;

		return mid_DCObject.media[0];
	};

	public shortRstring = () => {
		const result: number = Math.floor(Math.random() * (PORT_RANGE.max - PORT_RANGE.min + 1)) + PORT_RANGE.min;
		return result.toString();

		//		const random = Math.floor(Math.random() * 1e5).toString();
		// 		return random;
	};

	public threeCharsRstring = () => {
		const result: number = Math.floor(Math.random() * 100);
		return result.toString();
	};

	public convertNameToPort = (name: string): number => {
		const myVar = name[0];
		const myVarAscii = myVar.charCodeAt(0);
		return myVarAscii + myVarAscii;
	};

	public longRstring = () => {
		const random = Math.floor(Math.random() * 1e8).toString();
		return random;
	};

	private inactive = (session: any) => {
		const sdp: any = this.defaultAudioSDP(session);
		sdp.media.map((media) => {
			if (media.type == MEDIA_TYPE_AUDIO) {
				media.direction = MEDIA_DIRECTION_INACTIVE;
			}
		});

		return this.sdpToStr(sdp);
	};
}

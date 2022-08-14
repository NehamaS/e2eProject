import * as ip from "ip";
import * as dns from "dns";
import {
	CaseType,
	DeviceType,
	InfoType,
	KafkaEventType,
	RecorderInfoType,
	RoomType,
	SDPCaseType,
	StreamFile,
	UserType,
} from "./messages/factory";

import { isIP } from "class-validator";
import * as os from "os";
import { NetworkInterfaceInfo } from "os";
import * as fs from "fs";
import { LOGGER } from "./logger.service";
import Dict = NodeJS.Dict;

export function rstring() {
	+new Date();
	const timestemp = new Date().getTime(),
		random = Math.floor(Math.random() * 1e4).toString();
	return timestemp + random;
}

export function strToUserType(type: string | undefined): UserType {
	switch (type ? type.toLowerCase() : type) {
		case "pstn":
			return UserType.PSTN;
		case "sender":
			return UserType.SENDER;
		case "multi-sender":
			return UserType.MULTISENDER;
		case "receiver":
			return UserType.RECEIVER;
		case undefined:
			return UserType.RECEIVER;
		case "inactive":
			return UserType.INACTIVE;
		default:
			return UserType.RECEIVER;
		case "mrf_user":
			return UserType.MRF_USER;
		case "mrf_update":
			return UserType.MRF_UPDATE;
		case "recvonly":
			return UserType.RECVONLY;
		case "sendrecv":
			return UserType.SENDRECV;
		case "sendonly":
			return UserType.SENDONLY;
		case "ssc_user":
			return UserType.SSC_USER;
		case "video_sendrecv":
			return UserType.VIDEO_SENDRECV;
	}
}

export function strToDeviceType(type: string | undefined): DeviceType {
	switch (type) {
		case "BROWSER":
			return DeviceType.BROWSER;
		case "ANDROID_PHONE":
			return DeviceType.ANDROID_PHONE;
		case "ANDROID_TABLET":
			return DeviceType.ANDROID_TABLET;
		case "iPhone":
			return DeviceType.iPhone;
		case "iPad":
			return DeviceType.iPad;
		case "PC_CLIENT":
			return DeviceType.PC_CLIENT;
		case "PSTN":
			return DeviceType.PSTN;
		case "LOAD_PSTN":
			return DeviceType.LOAD_PSTN;
		case undefined:
			return DeviceType.PC_CLIENT;
		default:
			return DeviceType.PC_CLIENT;
	}
}

export function strToCaseType(type: string | CaseType | undefined): CaseType | undefined {
	switch (type) {
		case "MISSING_CALLER_ID":
			return CaseType.MISSING_CALLER_ID;
		case "SDP_VIDEO_RECVONLY":
			return CaseType.SDP_VIDEO_RECVONLY;
		case "SDP_VIDEO_SENDRECV":
			return CaseType.SDP_VIDEO_SENDRECV;
		case "MISSING_MEETING_ID":
			return CaseType.MISSING_MEETING_ID;
		case "NOT_EXIST_MEETING":
			return CaseType.NOT_EXIST_MEETING;
		case "REINVITE_WITH_UNKNOWN_TO_TAG_AND_CALLID":
			return CaseType.REINVITE_WITH_UNKNOWN_TO_TAG_AND_CALLID;
		case "AUDIO_WRONG_SDP":
			return CaseType.AUDIO_WRONG_SDP;
		case "AUDIO_WRONG_MSML":
			return CaseType.AUDIO_WRONG_MSML;
		case "CREATE_ROOM_WITH_SDP":
			return CaseType.CREATE_ROOM_WITH_SDP;
		case "WITH_RECORDING_HEADER":
			return CaseType.WITH_RECORDING_HEADER;
		case "PSTN":
			return CaseType.PSTN;
		default:
			return undefined;
	}
}

export function strToSDPCaseType(type: string): SDPCaseType | undefined {
	switch (type) {
		case "SENDRECV_DIRECTION_IN_VIDEO_RECVONLY_MID":
			return SDPCaseType.SENDRECV_DIRECTION_IN_VIDEO_RECVONLY_MID;
		case "VP9_CODEC_IN_VIDEO_MID":
			return SDPCaseType.VP9_CODEC_IN_VIDEO_MID;
		case "NOT_SUPPORTED_CODEC_IN_AUDIO_MID":
			return SDPCaseType.NOT_SUPPORTED_CODEC_IN_AUDIO_MID;
		case "NO_PUBLISHER_IN_SS_SDP":
			return SDPCaseType.NO_PUBLISHER_IN_SS_SDP;
			return undefined;
	}
}

// export function strToErrorType(type: string): ErrorType | undefined {
// 	switch (type) {
// 		case "MISSING_CALLER_ID":
// 			return ErrorType.MISSING_CALLER_ID;
// 		case "MISSING_MEETING_ID":
// 			return ErrorType.MISSING_MEETING_ID;
// 		default:
// 			return undefined;
// 	}
// }

export function strToStreamFile(type: string | undefined): StreamFile {
	switch (type ? type.toLowerCase() : type) {
		case "video1":
			return StreamFile.autumn_leaves_15min_opus_vp8;
		case "video2":
			return StreamFile.Glenn_Gould_Bach_Toccatas_15min_opus_vp8;
		case "video3":
			return StreamFile.Normal_Equation_Video_15min_opus_vp8;
		case "video4":
			return StreamFile.opera_concat_15min_opus_vp8;
		case "audio1":
			return StreamFile.Glenn_Gould_Bach_Toccatas_15min_opus;
		case "audio2":
			return StreamFile.autumn_leaves_15min_opus;
		case "audio3":
			return StreamFile.Normal_Equation_Video_15min_opus;
		case "audio4":
			return StreamFile.Normal_Equation_Video_60min_opus;
		case "audio5":
			return StreamFile.opera_concat_15min_opus;
		case undefined:
			return StreamFile.Glenn_Gould_Bach_Toccatas_15min_opus;
		case "dtmf_123#":
			return StreamFile.dtmf1_opus_sr16;
		case "dtmf_123#_delay":
			return StreamFile.dtmf1_opus_sr16_delay;
		case "dtmf_11#":
			return StreamFile.dtmf_mute;
		case "eran":
			return StreamFile.rec_eran_gav_Jun_17_2;
		case "noam":
			return StreamFile.rec_noam_eshkoli_Jun_17_2;
		case "yotam":
			return StreamFile.rec_yotam_toib_Jun_17_2;
		default:
			throw new Error(`Unsupported user type [${type}]`);
	}
}

export function strToRoomType(type: string): RoomType {
	switch (type.toLowerCase()) {
		case "audio":
		case "video":
		case "audio-video":
			return RoomType.AUDIO_VIDEO;
		case "screen-share":
			return RoomType.SCREEN_SHARE;
		// case "dc":
		// case "wb":
		// case "white-board":
		// case "data-channel":
		// 	return RoomType.DATA_CHANNEL;
		default:
			throw new Error(`Unsupported room type [${type}]`);
	}
}

//export function strToKafkaRoomType(type: string): "av" | "dc" | "ss" {
export function strToKafkaRoomType(type: string): "av" | "ss" {
	switch (type.toLowerCase()) {
		case "audio":
		case "video":
		case "audio-video":
			return "av";
		case "screen-share":
			return "ss";
		// case "dc":
		// case "data-channel":
		// 	return "dc";
		default:
			throw new Error(`Unsupported kafka room type [${type}]`);
	}
}

export function strToKafkaEvent(type: string): KafkaEventType {
	switch (type) {
		case "CREATE_CONF":
			return KafkaEventType.CREATE_CONF;
		case "PARTICIPATE_REQUEST":
			return KafkaEventType.PARTICIPATE_REQUEST;
		case "JOIN_PARTICIPANT":
			return KafkaEventType.JOIN_PARTICIPANT;
		case "UPDATE_PARTICIPANT":
			return KafkaEventType.UPDATE_PARTICIPANT;
		case "UNJOIN_PARTICIPANT":
			return KafkaEventType.UNJOIN_PARTICIPANT;
		case "MUTE_PARTICIPANT":
			return KafkaEventType.MUTE_PARTICIPANT;
		case "UNMUTE_PARTICIPANT":
			return KafkaEventType.UNMUTE_PARTICIPANT;
		case "HOLD_PARTICIPANT":
			return KafkaEventType.HOLD_PARTICIPANT;
		case "RESUME_PARTICIPANT":
			return KafkaEventType.RESUME_PARTICIPANT;
		case "CAMERA_ON":
			return KafkaEventType.CAMERA_ON;
		case "CAMERA_OFF":
			return KafkaEventType.CAMERA_OFF;
		case "SS_STARTS":
			return KafkaEventType.SS_STARTS;
		case "SS_ENDS":
			return KafkaEventType.SS_ENDS;
		case "DESTROY_CONF":
			return KafkaEventType.DESTROY_CONF;
		default:
			return KafkaEventType.PARTICIPATE_REQUEST;
	}
}

export function strToDtmfType(type: string): InfoType | undefined {
	switch (type) {
		case "PLAY_END":
			return InfoType.PLAY_END;
		case "PLAY":
			return InfoType.PLAY;
		case "PLAY_AMT":
			return InfoType.PLAY_AMT;
		case "PLAY_COLLECT":
			return InfoType.PLAY_COLLECT;
		case "COLLECT":
			return InfoType.COLLECT;
		case "COLLECT_NOINPUT":
			return InfoType.COLLECT_NOINPUT;
		case "COLLECT_NOMATCH":
			return InfoType.COLLECT_NOMATCH;
		case "PLAY_WRONG_FOUND":
			return InfoType.PLAY_WRONG_FOUND;
		default:
			return undefined;
	}
}

export function strToRecorderType(type: string): RecorderInfoType | undefined {
	switch (type) {
		case "START":
			return RecorderInfoType.START;
		case "STOP":
			return RecorderInfoType.STOP;
		case "RESUME":
			return RecorderInfoType.RESUME;
		case "PAUSE":
			return RecorderInfoType.STOP;
		case "TRANSFER":
			return RecorderInfoType.TRANSFER;
		case "TRANSFER_WRONG_SOURCE":
			return RecorderInfoType.TRANSFER;
		case "START_MISSING_DEST":
			return RecorderInfoType.START;
		case "TRANSFER_FULL_PATH":
			return RecorderInfoType.TRANSFER;
		default:
			return undefined;
	}
}

export async function lookup(address: string): Promise<string> {
	return new Promise<string>((resolve, reject) => {
		if (isIP(address)) {
			return resolve(address);
		}
		dns.lookup(address, (err, result) => {
			if (err) {
				return reject(err);
			}
			return resolve(result);
		});
	});
}

export function getAddress(): string {
	let result = ip.address();

	const nics: Dict<NetworkInterfaceInfo[]> = os.networkInterfaces();

	const nicNames: Array<string> = Object.keys(nics);

	const extractAddress = (nicNames): string => {
		if (nicNames && nicNames.length > 0) {
			for (const nicName of nicNames) {
				const ips: Array<NetworkInterfaceInfo> | undefined = nics[nicName];
				if (ips) {
					for (const nic of ips) {
						if (nic.family == "IPv4") {
							return nic.address;
						}
					}
				}
			}
		}
		return "";
	};

	let candidates: Array<string> = nicNames.filter((nic) => nic.startsWith("ens"));
	let ipStr: string = extractAddress(candidates);

	if (ipStr == "") {
		candidates = nicNames.filter((nic) => nic.startsWith("tun"));
		ipStr = extractAddress(candidates);
	}

	if (ipStr != "") {
		result = ipStr;
	}

	return result;
}

export function getlocalAdreses(ipv4Only = true, usePcap = true): Array<string> {
	const result = new Array<string>();
	result.push("localhost");
	//	result.push("192.168.49.1");

	if (!usePcap) {
		const nics: Dict<NetworkInterfaceInfo[]> = os.networkInterfaces();

		const nicNames: Array<string> = Object.keys(nics);
		for (const nicName of nicNames) {
			const ips: Array<NetworkInterfaceInfo> | undefined = nics[nicName];
			if (ips) {
				for (const nic of ips) {
					if (ipv4Only) {
						if (nic.family == "IPv4") {
							result.push(nic.address);
						}
					} else {
						result.push(nic.address);
					}
				}
			}
		}
	} else {
		// const pnics: Array<Device> = pcap.findalldevs();
		// pnics.map((nic: Device) => {
		// 	if (nic.addresses) {
		// 		nic.addresses.map((address) => {
		// 			result.push(address.addr);
		// 		});
		// 	}
		// });
	}
	return result;
}

export function getFileContent(path: string) {
	try {
		const content: string = fs.readFileSync(path).toString();
		return content;
	} catch (e) {
		LOGGER.error({ action: "error", data: e });
		return undefined;
	}
}

import * as ip from "ip";
import { getlocalAdreses } from "./utils";

export const MEDIA_TYPE_AUDIO = "audio";
export const MEDIA_TYPE_SCRSH = "screen-share";
export const MEDIA_TYPE_DC = "control-channel";

export const ROOM_TYPE_AUDIO = "audio";
export const ROOM_TYPE_VIDEO = "video";
export const ROOM_TYPE_SCRSH = "screen-share";
//export const ROOM_TYPE_DATA = "data-channel";
export const ROOM_TYPE_WB = "white-board";

//Sip ports by feature
/*
Each feature (using sip) should have its own sip client
 */
export const SCREEN_SHARE_SIP_PORT = 5062;
export const LOAD_SIP_CLIENT_PORT = 5064;
export const HEALTH_SIP_CLIENT_PORT = 5066;
export const VIDEO_SIP_PORT = 5068;
export const SRTP_SIP_PORT = 5070;
export const DTMF_SIP_PORT = 5072;
export const SIP_NOTIFY_SIP_PORT = 5074;
export const RECORDER_CONTROLLER_SIP_PORT = 5078;
export const MANUAL_SIP_PORT = 5076;
export const MRF_SIP_PORT = 5080;
export const SIP_TLS_PORT = 5082;
export const AUDIO_PSTN_SIP_PORT = 5084;
export const AUDIO_ONE_ON_ONE_SIP_PORT = 5086;
export const RECORDER_ONE_ON_ONE_SIP_PORT = 5088;
export const KAFKA_SIP_PORT = 5090;

export const MISSING_CALLER_ID = "MISSING_CALLER_ID";
export const NOT_EXIST_MEETING = "NOT_EXIST_MEETING";
export const START_MISSING_DEST = "START_MISSING_DEST";
export const TRANSFER_THIRD_FAILURE = "TRANSFER_THIRD_FAILURE";
export const AUDIO_WRONG_SDP = "AUDIO_WRONG_SDP";
export const AUDIO_WRONG_MSML = "AUDIO_WRONG_MSML";
export const DTMF_USER = "DTMF_USER";
export const CREATE_ROOM_WITH_SDP = "CREATE_ROOM_WITH_SDP";
export const INVITE_WITHOUT_SDP = "INVITE_WITHOUT_SDP";

export const RECORDER = "RECORDER";
export const MRF_USER = "MRF_USER";
export const INVITE_PSTN_ON_HOLD = "INVITE_PSTN_ON_HOLD";
export const DIAL_IN = "DIAL_IN";
export const DTMF = "DTMF";
export const WITH_RECORDING_HEADER = "WITH_RECORDING_HEADER";
export const USER_INACTIVITY = "UserInactivity";
export const EMPTY_ROOM = "EmptyRoom";
export const USER_INACTIVITY_REASON = "User inactivity";
export const EMPTY_ROOM_REASON = "Empty room";
export const MOML_EXIT = "moml.exit";
export const MSML_DIALOG_EXIT = "msml.dialog.exit";
export const DTMF_DETECT = "dtmf.detect";
export const PSTN_DEVICE_TYPE = "PSTN";

export const SENDRECV_DIRECTION_IN_VIDEO_RECVONLY_MID = "SENDRECV_DIRECTION_IN_VIDEO_RECVONLY_MID";
export const NOT_SUPPORTED_CODEC_IN_AUDIO_MID = "CORRUPT_CODEC_IN_AUDIO_MID";
export const NO_PUBLISHER_IN_SS_SDP = "NO_PUBLISHER_IN_SS_SDP";

export const MEDIA_DIRECTION_INACTIVE = "inactive";
export const MEDIA_DIRECTION_RECVONLY = "recvonly";
export const MEDIA_DIRECTION_SENDONLY = "sendonly";
export const MEDIA_DIRECTION_SENDRECV = "sendrecv";

export const VIDEO_MEDIA_DIRECTION_SENDRECV = "video_sendrecv";
export const DECKER_REGISTRY = "harbor.il-labs.mavenir.com/mcu-dev/";

export const HTTP_HEADER_CONTENT_TYPE = "Content-Type";
export const HTTP_CONTENT_TYPE_MULTIPART = "multipart/form-data";
export const HTTP_CONTENT_TYPE_MP3 = "audio/mp3";

export const ONE_MIN = 60;
export const THREE_MIN = 240;

export enum PlatformType {
	SWARM,
	K8S,
}

export const Attributes = {
	RECIEVED_MESSAGES: "recived",
	SUPPORTED: "supported",
	P_EARLY_MEDIA: "p-early-media",
	P_MEETING_ID: "P-Meeting-Id",
	P_REASON: "p-reason",
	P_DIALOG_TYPE: "P-Dialogue-Type",
	P_CALL_RECORDING: "P-Call-Recording",
	X_CALLER_ID: "X-Caller-Id",
	P_DEVICETYPE: "p-devicetype",
	P_ERROR_DESCRIPTION: "p-error-description",
	CALL_ID: "call-id",
	P_CALL_TYPE: "p-calltype",
};

export const CODECS_MAP = {
	"AMR-WB": {
		number: 102,
		rtp: { payload: 102, codec: "AMR-WB", rate: 16000, encoding: 1 },
		fmtp: { payload: 102, config: "mode-set=0,1,2 mode-change-capability=2 max-red=0" },
	},
	OPUS: {
		number: 111,
		rtp: { payload: 111, codec: "opus", rate: 48000, encoding: 2 },
		fmtp: { payload: 111, config: "minptime=10;useinbandfec=1" },
	},
	AMR: {
		number: 104,
		rtp: { payload: 104, codec: "AMR", rate: 8000, encoding: 1 },
		fmtp: { payload: 104, config: "octet-align=1 mode-change-capability=2 max-red=0" },
	},
	PCMU: {
		number: 0,
		rtp: { payload: 0, codec: "PCMU", rate: 8000 },
	},
	PCMA: {
		number: 8,
		rtp: { payload: 8, codec: "PCMA", rate: 8000 },
	},
	G729: {
		number: 18,
		rtp: { payload: 18, codec: "G729", rate: 8000 },
	},
	G722: {
		number: 9,
		//	rtp: { payload: 9, codec: "G722", rate: 8000 },
	},
	G7221: {
		number: 101,
		rtp: { payload: 101, codec: "G7221", rate: 16000 },
		fmtp: { payload: 101, config: "0-15" },
	},
	G719: {
		number: 19,
		rtp: { payload: 19, codec: "G719", rate: 8000 },
	},
};

/**
 * Environments
 */
export interface TestEnviroment {
	name: string;
	type: PlatformType;
	sip: {
		host: string | string[];
		port: number;
	};
	monitor: {
		host: string | string[];
		port: number;
	};
	isPrivate?: boolean;
	skipTests?: string[];
}

export const SipHeaders: { ALLOW: string; P_ERROR: string; CALL_ID: string } = {
	ALLOW: "Allow",
	P_ERROR: "P-Error-Description",
	CALL_ID: "call-id",
};

const SKIP_TLS_TESTS = ["Sanity audio conference with tls", "Notify TLS"];
const SKIP_RECORDER_TESTS = [
	"one on one recording, upload to Mstore replacment",
	"one on one recording with leave participants, upload to Mstore replacment",
	"one on one recording with hold resume, upload to Mstore replacment",
	"one on one recording, with video INVITE",
	"one on one recording with hold resume and play anna and hold switch ,upload to Mstore replacment",
	"basic cloud recorder flow",
	"start recording twice",
	"stop recording twice",
	"stop record before start",
	"transfer wrong source",
	"start record after all recorder clients taken",
	"third transfer succeed to upload file",
	"third transfer succeed to upload file",
	"start record before transfer ends",
	"leave participants before stop record",
];

//############################################
export const DEV_ENV_K8S: TestEnviroment = <TestEnviroment>{
	name: "DEV_ENV_K8S",
	type: PlatformType.K8S,
	sip: {
		host: ["sipsvc-dev.il-labs.mavenir.com", "10.106.9.62", "10.106.9.63", "10.106.9.64", "10.106.9.65"],
		port: 5060,
	},
	monitor: {
		host: "mcu-monitor-service-mcu-staging-common.il-labs.mavenir.com", //Not updated...TODO
		port: 443,
	},
};
export const LOAD_ENV_K8S: TestEnviroment = <TestEnviroment>{
	name: "LOAD_ENV_K8S",
	type: PlatformType.K8S,
	sip: {
		host: ["192.118.51.12", "192.118.51.18", "192.118.51.19", "192.118.51.16", "192.118.51.17"],
		//		port: 30560,
		port: 5060,
	},
	monitor: {
		host: "monitor-dev.il-labs.mavenir.com",
		port: 443,
	},
	skipTests: SKIP_TLS_TESTS,
};
const TEST_ENV_K8S: TestEnviroment = <TestEnviroment>{
	name: "TEST_ENV_K8S",
	type: PlatformType.K8S,
	sip: {
		host: ["sipsvc-master.il-labs.mavenir.com", "10.107.203.12", "10.107.203.13", "10.107.203.14", "10.107.203.15"],
		port: 5060,
	},
	monitor: {
		host: "mcu-monitor-service-mcu-production-common.il-labs.mavenir.com", //Not updated...TODO
		port: 443,
	},
	skipTests: SKIP_TLS_TESTS,
};
export const DEV_ENV_SWARM: TestEnviroment = <TestEnviroment>{
	name: "DEV_ENV_SWARM",
	type: PlatformType.SWARM,
	sip: {
		host: ["10.45.35.61", "10.45.35.62", "10.45.35.63", "10.45.35.64", "sipsvc-swarmdev.il-labs.mavenir.com"],
		port: 5060,
	},
	monitor: {
		host: "10.45.35.61",
		port: 3443,
	},
	skipTests: SKIP_RECORDER_TESTS,
};
const TEST_ENV_SWARM: TestEnviroment = <TestEnviroment>{
	name: "TEST_ENV_SWARM",
	type: PlatformType.SWARM,
	sip: {
		host: ["10.45.35.71", "10.45.35.72", "10.45.35.73"],
		port: 5060,
	},
	monitor: {
		host: "10.45.35.71",
		port: 3443,
	},
	skipTests: [...SKIP_TLS_TESTS, ...SKIP_RECORDER_TESTS],
};

const DMZ_ENV_SWARM: TestEnviroment = <TestEnviroment>{
	name: "TEST_ENV_SWARM",
	type: PlatformType.SWARM,
	sip: {
		host: ["192.118.51.11"],
		port: 5060,
	},
	monitor: {
		host: "192.118.51.11",
		port: 3443,
	},
};

const HA_ENV_SWARM: TestEnviroment = <TestEnviroment>{
	name: "TEST_ENV_SWARM",
	type: PlatformType.SWARM,
	sip: {
		host: ["10.107.206.123", "10.107.206.133", "10.107.206.137"],
		port: 5060,
	},
	monitor: {
		host: "10.107.206.123",
		port: 3443,
	},
};

const LOAD: TestEnviroment = <TestEnviroment>{
	name: "TEST_ENV_K8S",
	type: PlatformType.K8S,
	sip: {
		host: ["10.94.106.28", "10.106.9.231", "10.106.9.233", "10.106.9.235", "10.106.9.237", "10.106.9.238"],
		port: 5060,
	},
};

const LOCAL: TestEnviroment = <TestEnviroment>{
	name: "LOCAL",
	type: PlatformType.SWARM,
	sip: {
		host: getlocalAdreses(true, false),
		port: 5060,
	},
	monitor: {
		host: ip.address(),
		port: 3443,
	},
	isPrivate: true,
};

export const ALPHA_ENV_K8S: TestEnviroment = <TestEnviroment>{
	name: "ALPHA_ENV_K8S",
	type: PlatformType.K8S,
	sip: {
		host: ["sipsvc-alpha.il-labs.mavenir.com"],
		//		port: 30560,
		port: 5060,
	},
	monitor: {
		//host: "mcu-monitor-service-mom-alpha-common.il-labs.mavenir.com",
		host: "mcu-monitor-service-mom-alpha-mwp2.il-labs.mavenir.com",
		port: 443,
	},
};

export const ENVIRONMENTS = [
	DEV_ENV_K8S,
	LOAD_ENV_K8S,
	TEST_ENV_K8S,
	DEV_ENV_SWARM,
	TEST_ENV_SWARM,
	DMZ_ENV_SWARM,
	HA_ENV_SWARM,
	LOAD,
	LOCAL,
	ALPHA_ENV_K8S,
];

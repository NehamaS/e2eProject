import { IsArray, IsNotEmpty, IsNumber, IsObject, IsString, Min, Matches, IsOptional } from "class-validator";
import { CSEQ, ResponseDTO } from "./infoDTO";
import { SipAction } from "../sipAction";
import {
	RoomType,
	UserType,
	StreamFile,
	CaseType,
	SDPCaseType,
	RecorderInfoType,
} from "../../../common/messages/factory";

import { TestEnviroment } from "../../constants";

export class Response {
	public Invite: ResponseDTO = <ResponseDTO>{};
	public Ack: ResponseDTO = <ResponseDTO>{};
	public Info: ResponseDTO = <ResponseDTO>{};
	public Bye: ResponseDTO = <ResponseDTO>{};
}

export interface ContactParams {
	tag: string | undefined;
}

export class FailuresCounter {
	public openRoom: Map<number, boolean> = new Map<number, boolean>();
	public closeRoom: Map<number, boolean> = new Map<number, boolean>();
	public joinParticipant: Map<string, boolean> = new Map<string, boolean>();
	public leaveParticipant: Map<string, boolean> = new Map<string, boolean>();
	public startStream: Map<string, boolean> = new Map<string, boolean>();
	public validateStream: Map<string, boolean> = new Map<string, boolean>();
	public stopStream: Map<string, boolean> = new Map<string, boolean>();
	public mute: Map<string, boolean> = new Map<string, boolean>();

	//public userSessions: Map<string, UserSession> = new Map<string, UserSession>();
}
export interface RecorderAction {
	End: string;
	Location: string;
	Action: string;
}

export interface Dtmf {
	dtmfEnd?: string;
	dtmfLen?: string;
	dtmfDigits?: number;
}

export interface Play {
	playAmt?: string;
	playEnd?: string;
}
export interface FailuresCountSummary {
	joinParticipant: number;
	leaveParticipant: number;
	mute: number;
	startStream: number;
	validateStream: number;
	stopStream: number;
	openRoom: number;
	closeRoom: number;
	allFailures: number;
}

export class ContactDTO {
	@IsString()
	@IsNotEmpty()
	public user = "";
	@IsString()
	@IsNotEmpty()
	public domain = "";

	@IsNumber()
	@IsNotEmpty()
	public port = 5060;
	@IsObject()
	public params: ContactParams = <ContactParams>{};

	public uri = (tls = false): string => {
		const baseUri = `${this.user}@${this.domain}:${this.port}`;
		return tls ? `sips:${baseUri};transport=tls` : `sip:${baseUri}`;
	};
}

export class Session {
	@IsNumber()
	public statusCode;
	@IsObject()
	public to: ContactDTO;
	@IsObject()
	public from: ContactDTO;
	@IsString()
	public callId = "";
	@IsString()
	@IsNotEmpty()
	public meetingId = "";
	public xCallerID = "";
	@IsNumber()
	@Min(0)
	public cseq: CSEQ = <CSEQ>{};
	@IsString()
	public via = "";
	public status = 0;
	@IsString()
	public roomCseq: CSEQ = <CSEQ>{};
	@IsString()
	public env: TestEnviroment = <TestEnviroment>{};
	@IsString()
	@Matches(
		/^mute$|^unmute$|^muteAll$|^unmuteAll$|^hold$|^unhold$|^startRecord$|^stopRecord$|^pauseRecord$|^resumeRecord$|^transferRecord$/i
	)
	public userAction?:
		| "mute"
		| "unmute"
		| "muteAll"
		| "unmuteAll"
		| "hold"
		| "unhold"
		| "startRecord"
		| "stopRecord"
		| "pauseRecord"
		| "resumeRecord"
		| "transferRecord";
	@IsString()
	public roomType = "";
	@IsString()
	public userType: string | undefined = "";
	public newPort?: boolean = false;
	public newIp?: string | undefined = "";
	@IsString()
	public recorderFileName: string | undefined = "";
	@IsString()
	public deviceType: string | undefined = "";
	@IsString()
	public port: string | undefined = "";
	@IsString()
	public infoType?: any;
	@IsString()
	public recordInfoType?: any;
	@IsString()
	public recorderInfoType?: any;
	@IsString()
	public codecType?: any;
	@IsString()
	public codecListInput?: any;
	@IsString()
	public codecOutPut?: any;
	@IsString()
	public caseType?: any;
	public inviteError?: boolean;
	public infoError?: boolean;
	@IsString()
	public SDPcaseType?: any;
	@IsArray()
	public destContact: Array<ContactDTO>;
	@IsString()
	public roomId?: string = "";
	@IsString()
	public sdp?: string = "";
	public room: RoomSession = <RoomSession>{};
	@IsObject()
	public createResponses = new Response();
	@IsObject()
	public destroyResponses = new Response();
	@IsString()
	@IsOptional()
	mstorePath?: string;
	@IsString()
	@IsOptional()
	pMeetingSessionID?: string;
	@IsString()
	@IsOptional()
	xDeviceID?: string;

	public caseTypeStatus?: boolean;

	private tlsSupported = false;

	public get tls() {
		return this.tlsSupported;
	}
	public set tls(tls: boolean) {
		this.tlsSupported = tls;
	}

	constructor(tls = false) {
		this.to = new ContactDTO();
		this.from = new ContactDTO();
		this.destContact = new Array<ContactDTO>();
		this.tls = tls;
	}
}

export class ControlSession extends Session {
	@IsObject()
	public destTo: any = {};

	@IsObject()
	public destFrom: any = {};

	constructor() {
		super();
		this.to = new ContactDTO();
		this.from = new ContactDTO();
	}
}

export interface streamDTO {
	isUserStreamVideo: boolean;
	isUserStream: boolean;
	numOfStratMacmesh: number;
	streamFile: StreamFile;
	assrc_In: string;
	vssrc_In: string[] | number;
	remotePort: string;
	assrc_Out: string;
	vssrc_Out: string;
	localPort: string;
	remoteIP: string;
}

export interface RoomSession {
	id: string;
	callId: string;
	to: ContactDTO;
	from: ContactDTO;
}

export class UserSession extends Session {
	@IsString()
	public connId = "";
	// public room: RoomSession = <RoomSession>{};
	@IsOptional()
	public action?: SipAction;
	public StreamDTO: streamDTO = <streamDTO>{};
	@IsOptional()
	public srtp?: boolean;
	@IsString()
	public callerId?: string;
	@IsString()
	@IsOptional()
	public conf?: string;
	@IsString()
	@IsOptional()
	public displayName?: string;
}
export interface KafkaEvent {
	eventName: string;
	offset: string;
}

export interface KafkaMessageParams {
	eventName?: string;
	eventTime?: string;
	recordType?: string;
	meetingId?: string;
	sessionId?: string;
	nodeId?: string;
	mcuVersion?: string;
	roomId?: string;
	roomType?: "av" | "ss";
	//roomType?: "av" | "ss" | "dc";
	userId?: string;
	connId?: string;
	deviceId?: string;
	responseStatusCode?: number;
	responseStatusDescription?: string;
	errorDescription?: string;
	callId?: string;
	viaBranch?: string;
}
export interface Participant {
	Participant: string;
	meetingID: string;
	roomType: string;
	codecType?: string;
	codecListInput?: string;
	codecOutPut?: string;
	userType?: string;
	deviceType?: string;
	deviceId?: string;
	infoType?: CaseType;
	recorderInfoType?: string;
	port?: string;
	caseType?: string | CaseType;
	inviteError?: boolean;
	infoError?: boolean;
	recorderFileName?: string;
	SDPcaseType?: SDPCaseType;
	streamFile?: string;
	srtp?: boolean;
	statusCode?: number;
	offset?: string;
}

export interface NotificationMeta {
	method: string;
	roomType: string;
	user?: string;
	interval: number; //notification timeout
	sessionId: string;
	sessionType: string;
	recorderAction: RecorderAction;
	dtmf: Dtmf;
	play: Play;
	messageIndex: number;
	infoType?: string;
	description?: string;
}

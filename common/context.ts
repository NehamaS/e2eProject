import { DTO, ResponseDTO } from "./sip/dto/infoDTO";
import { ControlSession, UserSession, FailuresCounter, FailuresCountSummary } from "./sip/dto/controlSession";
import { CaseType, RoomType } from "./messages/factory";
import { PlatformType, TestEnviroment } from "./constants";
import { SIP_PORT } from "./sip/base.sip.client";

export class Context {
	public env: TestEnviroment = <TestEnviroment>{};
	public StreamsInputFilesPath = "";
	public StreamsOutputFilesPath = "";
	public RecorderFilesPath = "";
	public ClaudRecordingFilesPath = "";
	public minioURLStreamFiles = "http://10.107.201.151:9000/files-to-stream-rtp/";
	public minioURLRecorderFiles = "http://10.107.201.151:9000/record-files/";
	public createRoom: Array<DTO> = new Array<DTO>();
	public info?: ResponseDTO;
	public seq = 0;
	public conf?: string;
	//Current meeting data
	private roomSessions: Map<RoomType, ControlSession> = new Map<RoomType, ControlSession>();
	private userSessions: Map<string, UserSession> = new Map<string, UserSession>();

	public platform: PlatformType = PlatformType.SWARM;
	public meetingId = "";
	public numOfVideoPubUsers = 0;
	public currentTest = "";
	public localPort: number = SIP_PORT;
	public tlsPort: number = SIP_PORT;
	public failureMechanism = false;
	public failuresCountMap: FailuresCounter = new FailuresCounter();
	private tlsSupported = false;
	public caseType?: string;
	public infoType?: string;
	public callerId?: string;

	public address(): string {
		return this.env.sip.host[0];
	}

	public port(): number {
		return process.env.OUT_BOUND_PORT ? parseInt(process.env.OUT_BOUND_PORT) : this.env.sip.port;
	}

	public get tls(): boolean {
		return this.tlsSupported;
	}
	public set tls(tls: boolean) {
		this.tlsSupported = tls;
	}

	public setRoomSession(type: RoomType, session: ControlSession) {
		session.tls = this.tls;
		this.roomSessions.set(type, session);
	}
	public getRoomSession(type: RoomType): ControlSession | undefined {
		return this.roomSessions.get(type);
	}
	public setUserSession(id: string, session: UserSession) {
		session.tls = this.tls;
		this.userSessions.set(id, session);
	}
	public getUserSession(id: string): UserSession | undefined {
		return this.userSessions.get(id);
	}
}

export class LoadContext {
	public MultiContext: Array<Context> = new Array<Context>();

	public loadAddress = "";
	public loadUsers = 0;
	public loadSpeakUsers = 0;
	public loadVideoPubUsers = 0;
	public loadRooms = 0;
	public failureMechanism: string | undefined = "false";
	public roomPrefix = "";
	public currentTest = "";

	public failuresCountSummary: FailuresCountSummary = <FailuresCountSummary>{};
}

// export class LoadContext extends Context {
// 	private meetings: Map<string, Map<RoomType, ControlSession>> = new Map<string, Map<RoomType, ControlSession>>();
//
// 	constructor() {
// 		super();
// 	}
//
// 	public addControlSession(meetingId: string, roomType: RoomType, session: ControlSession) {
// 		const meeting: Map<RoomType, ControlSession> = <Map<RoomType, ControlSession>>(
// 			(this.meetings.get(meetingId) ? this.meetings.get(meetingId) : new Map<RoomType, ControlSession>())
// 		);
// 		meeting.set(roomType, session);
// 		//this.roomSessions.set(roomType, session);
// 		this.meetings.set(meetingId, meeting);
// 	}
//
// 	public getControlSession(meetingId: string, roomType: RoomType): ControlSession | undefined {
// 		const meeting: Map<RoomType, ControlSession> = <Map<RoomType, ControlSession>>this.meetings.get(meetingId);
// 		if (meeting) {
// 			return <ControlSession>meeting.get(roomType);
// 		}
// 		return undefined;
// 	}
//
// 	public setMeetingContext(meeting: string) {
// 		const currMeeting: Map<RoomType, ControlSession> | undefined = this.meetings.get(meeting);
// 		if (currMeeting) {
// 			this.roomSessions = currMeeting;
// 		} else {
// 			//"empty" contest
// 			this.roomSessions = new Map<RoomType, ControlSession>();
// 		}
// 	}
// }

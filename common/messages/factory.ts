import { ControlSession, UserSession } from "../sip/dto/controlSession";
import { Context } from "../context";
import { TRANSFER_THIRD_FAILURE } from "../constants";

export enum RoomType {
	AUDIO_VIDEO = 0,
	SCREEN_SHARE,
	//	DATA_CHANNEL,
	AUDIO,
}

export enum CaseType {
	MISSING_CALLER_ID = 0,
	MISSING_MEETING_ID = 1,
	NOT_EXIST_MEETING = 2,
	AUDIO_WRONG_SDP = 3,
	AUDIO_WRONG_MSML = 4,
	REINVITE_WITH_UNKNOWN_TO_TAG_AND_CALLID,
	DTMF_USER,
	DIAL_IN,
	RECORDER,
	CREATE_ROOM_WITH_SDP,
	INVITE_WITHOUT_SDP,
	INVITE_PSTN_ON_HOLD,
	INVITE_WITH_USEDTX,
	MRF_USER,
	MRF_UPDATE,
	RECORD,
	WITH_RECORDING_HEADER,
	SDP_VIDEO_RECVONLY,
	SDP_VIDEO_SENDRECV,
	PSTN,
}

export enum KafkaEventType {
	CREATE_CONF = 1, // create conference
	PARTICIPATE_REQUEST = 2, //participate request
	JOIN_PARTICIPANT = 3, //join participant
	UPDATE_PARTICIPANT = 4, // update participant
	UNJOIN_PARTICIPANT = 5, // unjoin participant
	MUTE_PARTICIPANT = 6, // mute participant
	UNMUTE_PARTICIPANT = 7, // unmute participant
	HOLD_PARTICIPANT = 8, // hold participant
	RESUME_PARTICIPANT = 9, // resume participant
	CAMERA_ON = 10, // camera on
	CAMERA_OFF = 11, // camera off
	SS_STARTS = 12, // screen-share starts
	SS_ENDS = 13, // screen-share ends
	DESTROY_CONF = 14, // destroy conference
}

export enum SDPCaseType {
	SENDRECV_DIRECTION_IN_VIDEO_RECVONLY_MID = 0,
	VP9_CODEC_IN_VIDEO_MID = 1,
	NOT_SUPPORTED_CODEC_IN_AUDIO_MID,
	NO_PUBLISHER_IN_SS_SDP,
}
export enum UserType {
	SENDER = 0,
	MULTISENDER,
	RECEIVER = 2,
	PSTN,
	INACTIVE,
	MRF_USER,
	MRF_UPDATE,
	SENDONLY,
	RECVONLY = 8,
	SENDRECV,
	SSC_USER,
	VIDEO_SENDRECV,
}

export enum DeviceType {
	BROWSER = 0,
	ANDROID_PHONE,
	ANDROID_TABLET,
	iPhone = 3,
	iPad,
	PC_CLIENT,
	PSTN,
	LOAD_PSTN,
}

export enum StreamFile {
	autumn_leaves_15min_opus_vp8,
	Glenn_Gould_Bach_Toccatas_15min_opus_vp8,
	Normal_Equation_Video_15min_opus_vp8,
	Normal_Equation_Video_60min_opus,
	opera_concat_15min_opus_vp8,
	autumn_leaves_15min_opus,
	Glenn_Gould_Bach_Toccatas_15min_opus,
	Normal_Equation_Video_15min_opus,
	opera_concat_15min_opus,
	dtmf1_opus_sr16,
	dtmf1_opus_sr16_delay,
	dtmf_mute,
	rec_eran_gav_Jun_17_2,
	rec_noam_eshkoli_Jun_17_2,
	rec_yotam_toib_Jun_17_2,
}

export enum SipMethod {
	CREATE_ROOM_INFO,
	CREATE_ROOM_INVITE,
	ACK,
	JOIN_PARTICIPANT_INVITE,
	JOIN_PARTICIPANT_INFO,
	DESTROY_ROOM_INFO = 5,
	DESTROY_ROOM_BYE = 6,
	LEAVE_PARTICIPANT_INFO = 7,
	LEAVE_PARTICIPANT_BYE = 8,
	MODIFY_STREAM_INFO,
	OPTIONS,
	NOTIFY,
	MUTE,
	MUTEALL,
	JOIN_PARTICIPANT_REINVITE,
	HOLD,
	RECORD,
	PRACK,
	UPDATE,
}

export enum InfoType {
	COLLECT = 0,
	PLAY = 1,
	PLAY_COLLECT,
	COLLECT_NOINPUT,
	COLLECT_NOMATCH,
	PLAY_WRONG_FOUND,
	PLAY_AMT,
	PLAY_END,
}

export enum RecorderInfoType {
	START = 0,
	STOP = 1,
	TRANSFER,
	PAUSE,
	RESUME = 4,
	TRANSFER_WRONG_SOURCE,
	TRANSFER_THIRD_FAILURE,
	TRANSFER_FULL_PATH,
}

/**
 * Message factory interface
 * @param type: T
 * @param session : ControlSession
 * @param context : Context (optional)
 */
export interface MessageFactory<T, K> {
	message(type: T, session: ControlSession | UserSession, roomType?: RoomType): K;
}

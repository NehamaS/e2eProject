import { ContactDTO } from "./controlSession";
import { CSEQ, DTO } from "./infoDTO";

export interface groups {
	type: string;
	mids: string;
}

export interface rtp {
	payload: number;
	codec: string;
	rate: number;
	encoding: number;
}

export interface sdpMedia {
	rtp: rtp[];
	type: string;
	port: number;
	connection: {
		version: number;
		ip: string;
	};
	direction: string;
}

export interface sdpResponseMedia extends sdpMedia {
	mid: number;
}

export interface SdpDTO {
	groups: groups[];
}

export interface requestSdpDTO extends SdpDTO {
	media: sdpMedia;
}

export interface responseSdpDTO extends SdpDTO {
	origin: {
		address: string;
	};
	media: sdpResponseMedia;
}

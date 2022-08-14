export interface CSEQ {
	method: string;
	seq: number;
}

export interface DTO {
	uri: string;
}

export interface Contact {
	uri: string;
	params?: any;
}

export interface SipDTO extends DTO {
	method: string;
	version: string;
	headers: {
		to: Contact;
		from: Contact;
		"call-id": string;
		cseq: CSEQ;
		contact: Array<Contact>;
		via?: any;
	};
}

export interface ResponseDTO extends SipDTO, DTO {
	duration: number;
	status: number;
	reason: string;
	content: string;
}

export interface RequestDTO extends DTO {
	method: string;
	uri: string;
	version?: string;
	headers: {
		to: Contact;
		from: Contact;
		"call-id": string;
		cseq: { method: string; seq: number };
		"P-Meeting-Id": string;
		"P-Dialogue-Type"?: number;
		//	"Accept-Contact"?: string;
		P_CALL_TYPE?: string;
		"p-devicetype"?: number;
		"X-Caller-Id"?: string;
		"P-Meeting-Session-ID"?: string;
		"X-Displayname"?: string;
		"X-DeviceId"?: string; //@TODO Verify whether it's should P-Device-ID
		contact: Array<Contact>;
		via: Array<Contact>;
		"Content-Type"?: string;
	};
	//Content may be an XML (i.e. string) or a json object based on Content-Type!
	content?: unknown;
}

// export interface InviteRequestDTO extends InfoRequestDTO {
//     "X-Caller-Id": string
// }

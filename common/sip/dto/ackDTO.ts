//import { Contact } from "../../messages/audio.message.factory";
import { Contact, DTO } from "./infoDTO";

export interface AckRequestDTO extends DTO {
	method: string;
	uri: string;
	headers: {
		to: Contact;
		from: Contact;
		"call-id": string;
		"P-Meeting-Id": string;
		cseq: { method: string; seq: number };
		contact: Array<Contact>;
		via: Array<Contact> | string;
		RAck?: string;
	};
}

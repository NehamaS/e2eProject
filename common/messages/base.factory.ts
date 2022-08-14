import { MessageFactory, RoomType } from "./factory";
import { ContactDTO, ControlSession, UserSession } from "../sip/dto/controlSession";
import { Context } from "../context";
import { Contact } from "../sip/dto/infoDTO";

export abstract class BaseFactory<T, K> implements MessageFactory<T, K> {
	abstract message(type: T, session: ControlSession | UserSession, roomType?: RoomType): K;

	protected contact = (tls: boolean, contact: ContactDTO, includeParams = false): Contact => {
		const contactStr: any = contact.uri(tls);
		const result: Contact = { uri: contactStr };
		if (includeParams && contact.params) {
			result.params = contact.params;
		}
		return result;
	};
}

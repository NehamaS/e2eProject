import { MessageFactory, RoomType, SipMethod } from "./factory";
import { DTO } from "../sip/dto/infoDTO";
import { AudioMessageFactory } from "./audio.message.factory";
import { ControlSession } from "../sip/dto/controlSession";
import { ScreenShareMessageFactory } from "./screen.share.message.factory";
//import { DCMessageFactory } from "./dc.message.factory";
import { GenericMessageFactory } from "./generic.message.factory";

export class AbstractRoomFactory {
	message(type: RoomType): MessageFactory<SipMethod, DTO> {
		switch (type) {
			case RoomType.AUDIO:
				return new AudioMessageFactory();
			case RoomType.AUDIO_VIDEO:
				return new AudioMessageFactory();
			case RoomType.SCREEN_SHARE:
				return new ScreenShareMessageFactory();
			// case RoomType.DATA_CHANNEL:
			// 	return new DCMessageFactory();
			default:
				return new GenericMessageFactory();
		}
	}
}

class Example {
	private rommFactory: AbstractRoomFactory;

	constructor() {
		this.rommFactory = new AbstractRoomFactory();
		const audioFactory: MessageFactory<SipMethod, DTO> = this.rommFactory.message(RoomType.AUDIO_VIDEO);
		//const dcFactory: MessageFactory<SipMethod, DTO> = this.rommFactory.message(RoomType.DATA_CHANNEL);
	}

	private exampleUse(): DTO {
		const factory: MessageFactory<SipMethod, DTO> = this.rommFactory.message(RoomType.AUDIO_VIDEO);

		const result: DTO = factory.message(SipMethod.CREATE_ROOM_INVITE, <ControlSession>{});

		return result;
	}
}

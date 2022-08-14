import { RoomType } from "../factory";
import * as _ from "lodash";
import { SipAction } from "../../sip/sipAction";

export interface StreamMessage {
	modifystream: { $: any; stream: any };
}

export class ModifyStreamBuilder {
	private stream: Array<StreamMessage> = new Array<StreamMessage>();

	constructor(
		private streamType: RoomType,
		private action: SipAction,
		private connId: string,
		private confId: string,
		private toConnId?: string
	) {}

	public construct(): void {
		//From
		const streamObj: StreamMessage = <StreamMessage>{
			modifystream: {
				$: {
					id1: `conn:${this.connId}`,
					id2: `conf:${this.confId}`,
				},
				stream: {
					$: {
						media: this.getRoomType(this.streamType),
						dir: "from-id1",
					},
				},
			},
		};

		//To
		if (this.streamType == RoomType.SCREEN_SHARE && this.toConnId) {
			const streamObj: StreamMessage = <StreamMessage>{
				modifystream: {
					$: {
						id1: `conn:${this.toConnId}`,
						id2: `conf:${this.confId}`,
					},
					stream: {
						$: {
							media: this.getRoomType(this.streamType),
							dir: "to-id1",
						},
					},
				},
			};
			this.stream.push(streamObj);
		}

		if (this.streamType == RoomType.AUDIO_VIDEO) {
			const gain: {
				gain: { $: { amt: string } };
			} = {
				gain: { $: { amt: this.streamActionStr(this.action) } },
			};

			streamObj.modifystream.stream = _.merge(streamObj.modifystream.stream, gain);
		}

		this.stream.push(streamObj);
	}

	private getRoomType(streamType: RoomType): string {
		switch (streamType) {
			case RoomType.AUDIO_VIDEO:
				return "video";
			// case RoomType.DATA_CHANNEL:
			// 	return "data-channel";
			case RoomType.SCREEN_SHARE:
				return "screenshare";
		}
		return "audio";
	}

	public getResult(): Array<StreamMessage> {
		return this.stream;
	}

	private streamActionStr(action: SipAction) {
		switch (action) {
			case SipAction.UNDEFINED:
				return "";
			case SipAction.MUTE:
			case SipAction.MUTE_ALL:
				return "mute";
			case SipAction.UNMUTE:
			case SipAction.UNMUTE_ALL:
				return "unmute";
			case SipAction.HOLD:
				return "hold";
			case SipAction.UNHOLD:
				return "unhold";
			default:
				return "unsupported!!!";
		}
		return "Unsupported";
	}
}

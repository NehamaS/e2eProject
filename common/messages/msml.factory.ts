import { InfoType, MessageFactory, RecorderInfoType, RoomType } from "./factory";
import { MsmlType } from "./msml/msml.message";
import { ControlSession, UserSession } from "../sip/dto/controlSession";
import { getAddress, strToDtmfType, strToRecorderType, strToRoomType } from "../utils";

import * as _ from "lodash";
import { MsmlService } from "../sip/msml.service";
import { ModifyStreamBuilder, StreamMessage } from "./msml/modify.stream.builder";
import { SipAction } from "../sip/sipAction";
import { MEDIA_TYPE_AUDIO, MEDIA_TYPE_DC, MEDIA_TYPE_SCRSH } from "../constants";

const DEFAULT_MSML_VERSION = "1.1";
const DEFAULT_AUDIO_MIX = "mix491230";

export interface MsmlMsgType {
	msgType: MsmlType;
	roomType: RoomType;
	sipAction?: SipAction;
}

interface StartRecord {
	dialogstart: {
		$: {
			target?: string;
			name: string;
		};
		group: {
			$: {
				topology: string;
			};
			record: {
				$: {
					id: string;
					append: string;
					maxtime: string;
					recordingdest: string;
				};
				recordexit: {
					send: {
						$: {
							target: string;
							event: string;
							namelist: string;
						};
					};
				};
			};
			transfer?: {
				host_id: string;
				fileobj: {
					$: {
						objid: string;
						delete: string;
						src: string;
						dest: string;
					};
					transferexit: {
						send: {
							$: {
								target: string;
								event: string;
								namelist: string;
							};
						};
					};
				};
			};
		};
	};
}

export class MsmlFactory implements MessageFactory<MsmlMsgType, string> {
	private msmlSrv: MsmlService;

	constructor() {
		this.msmlSrv = new MsmlService();
	}

	public message(type: MsmlMsgType, session: ControlSession | UserSession): string {
		switch (type.msgType) {
			case MsmlType.CREATE_CONF:
				return this.createConferenceRoom(<ControlSession>session);
			case MsmlType.CREATE_CONF_WITHOUT_NAME:
				return this.createConferenceRoomWithoutName(<ControlSession>session);
			case MsmlType.JOIN_WITHOUT_NAME:
				return this.joinParticipantWithoutName(<UserSession>session, type.roomType);
			case MsmlType.DESTROY_CONF:
				return this.destroyConference(<ControlSession>session);
			case MsmlType.JOIN:
				return this.joinParticipant(<UserSession>session, type.roomType);
			case MsmlType.UNJOIN:
				return this.unjoinParticipant(<UserSession>session);
			case MsmlType.MODIFY_STREAM:
				return this.modifyStream(<UserSession>session, <SipAction>type.sipAction);
			case MsmlType.MUTE:
				return this.performUserAction(<UserSession>session, type.roomType);
			case MsmlType.HOLD:
				return this.performUserAction(<UserSession>session, type.roomType, true);
			case MsmlType.MUTEALL:
				return this.muteAll(<UserSession>session, type.roomType);
			case MsmlType.DIAL_IN:
				return this.dialogInUser(<UserSession>session);
			case MsmlType.RECORDER:
				return this.recorder(<ControlSession>session);
			case MsmlType.WRONG_MSML:
				return this.joinParticipantWithWrongMSML(<UserSession>session, type.roomType);
			default:
				throw new Error(`Option not supported. [${type.msgType}]`);
		}
	}

	private messageToString(body: any): string {
		const msml: { msml: any } = {
			msml: {
				$: {
					version: DEFAULT_MSML_VERSION,
				},
			},
		};
		msml.msml = _.merge(msml.msml, body);
		const xml: string = this.msmlSrv.Object2xmlString(msml);
		return xml;
	}

	private dialogInUser(session: UserSession) {
		const dialogend: any = {
			dialogend: {
				$: {
					id: `conn:${session.to.params.tag}/dialog:playPromptCollect`,
				},
			},
		};
		const dialogstart: any = {
			dialogstart: {
				$: {
					type: "application/moml+xml",
					target: `conn:${session.to.params.tag}`,
					name: "playPromptCollect",
				},
			},
		};
		const group: any = {
			group: {
				$: {
					topology: "parallel",
				},
			},
		};
		const play: any = {
			play: {
				$: {
					barge: true,
					cleardb: true,
					id: "annc",
				},
				audio: {
					$: {
						uri: "file://mrfp/tones/Sorry no valid input received .wav",
					},
				},
				playexit: {
					send: { $: { target: "collect", event: "starttimer" } },
				},
			},
		};
		const amt: any = {
			exit: {
				$: {
					namelist: "play.amt play.end",
				},
			},
		};
		const collect: any = {
			collect: {
				$: {
					fdt: "30s",
					idt: "30s",
					edt: "30s",
					starttimer: false,
					cleardb: true,
				},
				pattern: {
					$: {
						digits: "rtk=#",
					},
					exit: {
						$: {
							namelist: "dtmf.end dtmf.len dtmf.digits",
						},
					},
				},
				noinput: {
					exit: {
						$: {
							namelist: "dtmf.end",
						},
					},
				},
				nomatch: {
					exit: {
						$: {
							namelist: "dtmf.end dtmf.len dtmf.digits",
						},
					},
				},
			},
		};

		switch (strToDtmfType(session.infoType)) {
			case InfoType.PLAY_END:
				return this.messageToString(dialogend);
			case InfoType.PLAY_COLLECT:
			case InfoType.COLLECT_NOINPUT:
			case InfoType.COLLECT_NOMATCH:
				_.merge(group.group, play);
				_.merge(group.group, collect);
				_.merge(dialogstart.dialogstart, group);
				if (session.infoType == "COLLECT_NOINPUT") {
					dialogstart.dialogstart.group.collect.$.fdt = "4s";
					dialogstart.dialogstart.group.collect.$.idt = "4s";
					dialogstart.dialogstart.group.collect.$.edt = "4s";
				}
				if (session.infoType == "COLLECT_NOMATCH") {
					dialogstart.dialogstart.group.collect.pattern.$.digits = "111#";
				}
				return this.messageToString(dialogstart);
			case InfoType.COLLECT:
				_.merge(group, collect);
				_.merge(dialogstart.dialogstart, group);
				dialogstart.dialogstart.collect.pattern.$.digits = "11#";
				return this.messageToString(dialogstart);
			case InfoType.PLAY:
			case InfoType.PLAY_WRONG_FOUND:
			case InfoType.PLAY_AMT:
				_.merge(group, play);
				_.merge(dialogstart.dialogstart, group);
				if (session.infoType == "PLAY_WRONG_FOUND")
					dialogstart.dialogstart.play.audio.$.uri = "file://mrfp/tones/test.txt";
				if (session.infoType == "PLAY")
					dialogstart.dialogstart.play.audio.$.uri =
						"file://mrfp/tones/Sorry no valid input received XXX.txt";
				if (session.infoType == "PLAY_AMT") _.merge(dialogstart.dialogstart.play.playexit, amt);
				return this.messageToString(dialogstart);
			default:
				throw new Error("unsupported dtmf type!!");
		}
	}

	private recorder(session: ControlSession | UserSession) {
		const recorderFileName = session.recorderFileName;
		let mstorePath: string;
		const FMS_API = "uccAs/V1/FMS/Upload/MeetingRecord";
		const FCS_API = "uccAs/V1/FCS/Upload/MeetingRecord";
		if (session.mstorePath) {
			mstorePath = session.mstorePath;
		} else if (session.infoType == "ONE_ON_ONE") {
			mstorePath =
				session.recorderInfoType == "TRANSFER_FULL_PATH"
					? `http://${getAddress()}:6051/${FMS_API}/` + session.meetingId + "_" + recorderFileName + ".mp3"
					: `http://${getAddress()}:6051/${FMS_API}`;
		} else {
			mstorePath = `http://${getAddress()}:6050//${FCS_API}`;
		}
		switch (strToRecorderType(session.recorderInfoType)) {
			case RecorderInfoType.START:
			case RecorderInfoType.RESUME:
				const dest = `file://conferenceRecordDestination/${session.meetingId}/${session.meetingId}_${recorderFileName}`;

				const start: StartRecord = {
					dialogstart: {
						$: {
							target: `conf:${session.destContact[0].user}`,
							name: "call-record",
						},
						group: {
							$: { topology: "parallel" },
							record: {
								$: {
									id: "1",
									append: "false",
									maxtime: "3600",
									recordingdest: dest,
								},
								recordexit: {
									send: {
										$: { target: "source", event: "done", namelist: "record.len record.end" },
									},
								},
							},
						},
					},
				};
				if (session.infoType !== "ONE_ON_ONE") {
					start.dialogstart.group.transfer = {
						host_id: "e2e-hostId",
						fileobj: {
							$: {
								objid: "xyz",
								delete: "true",
								src: dest,
								dest: mstorePath,
							},
							transferexit: {
								send: {
									$: {
										target: "source",
										event: "done",
										namelist: "transfer.duration transfer.end",
									},
								},
							},
						},
					};
				}

				if (session.recorderInfoType == "START_MISSING_DEST") {
					delete start.dialogstart.$.target;
				}
				if (session.recorderInfoType === "RESUME") {
					start.dialogstart.group.record.$.append = "true";
				}

				return this.messageToString(start);
			case RecorderInfoType.STOP:
				const stop: any = {
					dialogend: {
						$: {
							id: `conf:${session.destContact[0].user}/dialog:call-record`,
						},
					},
				};
				return this.messageToString(stop);
			case RecorderInfoType.TRANSFER:
				if (session.recorderInfoType == "TRANSFER_WRONG_SOURCE") mstorePath = mstorePath + "noValid";
				const src = `file://conferenceRecordDestination/${session.meetingId}/${session.meetingId}_${session.recorderFileName}`;
				// const src =
				// 	session.recorderInfoType == "TRANSFER_WRONG_SOURCE"
				// 		? `file://conferenceRecordWrongDestination/${session.meetingId}/${session.meetingId}_${session.recorderFileName}`
				// 		: `file://conferenceRecordDestination/${session.meetingId}/${session.meetingId}_${session.recorderFileName}`;
				const transfer: any = {
					dialogstart: {
						$: {
							target: `conf:${session.roomId ? session.roomId : session.destContact[0].user}`,
							type: "application/moml+xml",
							name: "transfer",
						},
						transfer: {
							host_id: "e2e-hostId",
							fileobj: {
								$: {
									objid: "xyz",
									delete: "true",
									src: src,
									dest: mstorePath,
								},
								transferexit: {
									send: {
										$: {
											target: "source",
											event: "done",
											namelist: "transfer.duration transfer.end",
										},
									},
								},
							},
						},
					},
				};
				return this.messageToString(transfer);
			default:
				throw new Error("unsupported record info type!!");
		}
	}

	/**
     * <?xml version="1.0" encoding="US-ASCII"?>
     * <msml version="1.1">'
     *  <createconference name="session.roomId" deletewhen="nocontrol" mark="1" term="true">
     *      <audiomix id="mix491230"/>
     *  "</createconference>
     "</msml>"
     */
	private createConferenceRoom(session: ControlSession): string {
		const body: any = {
			createconference: {
				$: {
					name: session.roomId,
					deletewhen: "nocontrol",
					mark: "1",
					term: "true",
				},
				audiomix: { $: { id: DEFAULT_AUDIO_MIX } },
			},
		};

		return this.messageToString(body);
	}

	/**
	 * <?xml version="1.0" encoding="US-ASCII"?>
	 * <msml version="1.1">'
	 *  <createconference deletewhen="never" term="false">
	 *  "</createconference>
	 "</msml>"
	 */
	private createConferenceRoomWithoutName(session: ControlSession): string {
		const body: any = {
			createconference: {
				$: {
					deletewhen: "never",
					term: "false",
				},
			},
		};

		return this.messageToString(body);
	}

	private participantAttributes(
		session: UserSession,
		id1: string,
		id2: string,
		mark?: string
	): { id1: string; id2: string; mark?: string } {
		const result = {
			// id1: `conn:${session.connId}`,
			// id2: `conf:${session.room.id}`,
			id1: id1,
			id2: id2,
		};
		if (mark) {
			result["mark"] = mark;
		}

		return result;
	}

	/**
	 * <?xml version="1.0" encoding="US-ASCII"?>
	 * <msml version="1.1">
	 *     <join id1="conn:session.connId" id2="conf:roomID" mark="2">
	 *         <stream media="audio"/>
	 *     </join>
	 * </msml>
	 * @param session
	 * @private
	 */
	private joinParticipant(session: UserSession, type: RoomType): string {
		const body: any = {
			join: {
				$: this.participantAttributes(session, `conn:${session.connId}`, `conf:${session.room.id}`, "2"),
				stream: {
					$: {
						media: this.getMediaType(type),
					},
				},
			},
		};

		return this.messageToString(body);
	}

	private joinParticipantWithoutName(session: UserSession, type: RoomType): string {
		const body: any = {
			join: {
				$: this.participantAttributes(session, `conn:${session.connId}`, `conf:${session.conf}`, "2"),
				stream: {
					$: {
						media: this.getMediaType(type),
					},
				},
			},
		};

		return this.messageToString(body);
	}

	/**
	 * Hold/Unhold
	 *  <?xml version="1.0" encoding="US-ASCII"?>\r\n'
	 *  <msml version="1.1">
	 *  <modifystream id1="conf:roomId" id2="conn:CreatePublisherConnId">
	 *  <stream media="audio" dir="to-id1">
	 *  <gain amt="unmute"/>
	 *  </stream>
	 *  <stream media="audio" dir="from-id1">
	 *  <gain amt="unmute"/>
	 *  </stream>
	 *  </modifystream>
	 *  </msml>
	 * @param session : UserSession
	 * @param type : RoomType
	 * @private
	 */
	private performUserAction(session: UserSession, type: RoomType, expand = false): string {
		const stream: any = {
			$: {
				media: this.getMediaType(type),
				dir: "from-id1",
			},
			gain: {
				$: {
					amt:
						session.userAction && (<string>session.userAction).search("hold") > -1
							? session.userAction.replace("hold", "mute")
							: session.userAction,
				},
			},
		};

		const body: any = {
			modifystream: {
				$: this.participantAttributes(session, `conn:${session.connId}`, `conf:${session.room.id}`),
				stream: stream,
			},
		};

		if (expand) {
			const streamArr: Array<{ $: any; gain: any }> = new Array<{ $: any; gain: any }>();
			streamArr.push(body.modifystream.stream);
			const to: any = {
				$: {
					media: this.getMediaType(type),
					dir: "to-id1",
				},
				gain: {
					$: {
						amt:
							session.userAction && (<string>session.userAction).search("hold") > -1
								? session.userAction.replace("hold", "mute")
								: session.userAction,
					},
				},
			};
			streamArr.push(to);
			body.modifystream.stream = <any>streamArr;
		}

		return this.messageToString(body);
	}

	private muteAll(session: UserSession, tpye: RoomType): string {
		const body: any = {
			modifystream: {
				$: this.participantAttributes(session, `conf:${session.room.id}`, "*"),
				stream: {
					$: {
						media: this.getMediaType(tpye),
						dir: "to-id1",
					},
					gain: {
						$: {
							amt: session.userAction,
						},
					},
				},
			},
		};

		return this.messageToString(body);
	}

	/**
	 * <?xml version="1.0" encoding="US-ASCII"?>
	 * <msml version="1.1">
	 *     <unjoin id1="conn:session.connId" id2="conf:roomID"/>
	 * </msml>"
	 *
	 */
	private unjoinParticipant(session: UserSession): string {
		const body: any = {
			unjoin: {
				$: this.participantAttributes(
					session,
					`conn:${session.connId}`,
					`conf:${session.room.id ? session.room.id : session.conf}`
				),
			},
		};

		return this.messageToString(body);
	}

	/**
	 *  <?xml version="1.0" encoding="US-ASCII"?>
	 *  <msml version="1.1">
	 *    <destroyconference id="conf:session.roomId" mark="1" />
	 *  </msml>",
	 * @param session
	 * @private
	 */
	private destroyConference(session: ControlSession) {
		const body: any = {
			destroyconference: {
				$: {
					id: `conf:${session.roomId}`,
					mark: "1",
				},
			},
		};

		return this.messageToString(body);
	}

	/**
	 * //Screen share
	 * <?xml version="1.0" encoding="US-ASCII"?>
	 * <msml version="1.1">
	 *  <modifystream id1="conn:1825622" id2="conf:1598059452792137">
	 *      <stream media="screenshare" dir="to-id1"/>
	 *  </modifystream>
	 *  <modifystream id1="conn:1826022" id2="conf:1598059452792137">
	 *      <stream media="screenshare" dir="from-id1"/>
	 *  </modifystream>
	 *  </msml>
	 *
	 * //Audio
	 * <?xml version="1.0" encoding="US-ASCII"?>
	 * <msml version="1.1">
	 *  <modifystream id1="conf:' + roomId + '" id2="conn:' + connId + '">
	 *    <stream media="video" dir="from-id1">
	 *      <gain amt="mute"/>
	 *    </stream>
	 *  </modifystream>
	 * </msml>
	 */
	private modifyStream(session: UserSession, action: SipAction) {
		const baseXML: string = this.messageToString({ tmp: "tmp" });
		const baseArr: Array<string> = baseXML.split("\n");

		const builder: ModifyStreamBuilder = new ModifyStreamBuilder(
			strToRoomType(session.roomType),
			action ? action : SipAction.UNDEFINED,
			session.connId ? session.connId : "*",
			session.room ? session.room.id : "NA",
			session.connId ? session.connId : "*"
		);
		builder.construct();
		const body: Array<StreamMessage> = builder.getResult();
		let modifyStreamXml: string = this.msmlSrv.Object2xmlString(body);
		const tmpXmlArr: Array<string> = modifyStreamXml.split("\n");
		tmpXmlArr.shift();
		tmpXmlArr.shift();
		tmpXmlArr.pop();
		tmpXmlArr.unshift(baseArr[0], baseArr[1]);
		tmpXmlArr.push(<string>baseArr.pop());
		modifyStreamXml = tmpXmlArr.join("\n");
		//
		//const result: string = baseXML.replace('<tmp>[\\s\\S]*?<\\/tmp>', modifyStreamXml);

		return modifyStreamXml;
	}

	private getMediaType(roomType: RoomType): string {
		switch (roomType) {
			case RoomType.AUDIO_VIDEO:
				return MEDIA_TYPE_AUDIO;
			case RoomType.SCREEN_SHARE:
				return MEDIA_TYPE_SCRSH;
			// case RoomType.DATA_CHANNEL:
			// 	return MEDIA_TYPE_DC;
			default:
				return MEDIA_TYPE_AUDIO;
		}
		return "NA";
	}

	/*
    <?xml version=\"1.0\" encoding=\"UTF-8\"?>\n
    <msml xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" version=\"1.1\">
    <dialogstart type=\"application/moml+xml\" target=\"conn:none2720211\" name=\"playPromptCollect\">
    <group topology=\"parallel\">
    <play barge=\"true\" cleardb=\"true\">
    <audio uri=\"file://mrfp/tones/P200    1a Welcome to Mavenier connect conferencing 2.wav\"/>
    <audio uri=\"file://mrfp/tones/P2002 - Enter meeting id followed by pound.wav\"/>
    <playexit>
    <send target=\"collect\" event=\"starttimer\"/>
    </playexit>
    </play>
    <collect fdt=\"15s\" idt=\"4s\" edt=\"4s\" starttimer=\"false\" cleardb=\"true\">
    <pattern digits=\"rtk=#\">
    <exit namelist=\"dtmf.end dtmf.len dtmf.digits\"/>
    </pattern>
    <noinput>
    <exit namelist=\"dtmf.end\"/>
    </noinput>
    <nomatch>
    <exit namelist=\"dtmf.end dtmf.len dtmf.digits\"/>
    </nomatch>
    </collect>
    </group>
    </dialogstart>
    </msml>\n"}
    */
	private playAndCollect(session: UserSession) {
		const body: any = {
			dialogstart: {
				$: {
					type: "application/moml+xml",
					target: `conn:${session.to.params.tag}`,
					name: "playPromptCollect",
				},
				group: {
					$: {
						topology: "parallel",
					},
					play: {
						$: {
							barge: true,
							cleardb: true,
						},
						audio: {
							$: {
								uri: "file://mrfp/tones/P200   1a Welcome to Mavenier connect conferencing 2.wav",
							},
						},
						// audio : {
						//        $: {
						//           uri : "file://mrfp/tones/P2002 - Enter meeting id followed by pound.wav"
						//        }
						//     }
						playexit: {
							send: { $: { target: "collect", event: "starttimer" } },
						},
					},
					collect: {
						$: {
							fdt: "15s",
							idt: "4s",
							edt: "4s",
							starttimer: false,
							cleardb: true,
						},
						pattern: {
							$: {
								digits: "rtk=#",
							},
							exit: {
								$: {
									namelist: "dtmf.end dtmf.len dtmf.digits",
								},
							},
						},
						noinput: {
							exit: {
								$: {
									namelist: "dtmf.end",
								},
							},
						},
						nomatch: {
							exit: {
								$: {
									namelist: "dtmf.end dtmf.len dtmf.digits",
								},
							},
						},
					},
				},
			},
		};
		return this.messageToString(body);
	}

	private joinParticipantWithWrongMSML(session: UserSession, tpye: RoomType): string {
		const body: any = {
			join: {
				$: this.participantAttributes(session, "conn:undefined", "conf:undefined", "2"),
				stream: {
					$: {
						media: this.getMediaType(tpye),
					},
				},
			},
		};

		return this.messageToString(body);
	}
}

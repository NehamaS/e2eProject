import { CaseType, RoomType, UserType } from "../common/messages/factory";
import { SdpType } from "../common/sip/sdp.factory";
import { SIP_PORT } from "../common/sip/base.sip.client";
import { ContactDTO, ControlSession, UserSession } from "../common/sip/dto/controlSession";
import { Contact } from "../common/sip/dto/infoDTO";
import { Context } from "../common/context";
import { LOGGER } from "../common/logger.service";

export const sdpResolver = (roomType: RoomType, userType?: UserType, caseType?: CaseType): SdpType => {
	switch (roomType) {
		case RoomType.AUDIO:
			switch (caseType) {
				case CaseType.INVITE_WITHOUT_SDP:
				case CaseType.INVITE_PSTN_ON_HOLD:
					return SdpType.ack;
				default:
					return SdpType.createRoom;
			}
		case RoomType.SCREEN_SHARE:
			return SdpType.SSPublisher;
		// case RoomType.DATA_CHANNEL:
		// 	return SdpType.dataChannel;
		case RoomType.AUDIO_VIDEO:
			switch (userType) {
				case UserType.SENDER:
					return SdpType.VideoSender;
				case UserType.RECEIVER:
					return SdpType.receiver;
				case UserType.PSTN:
					return SdpType.pstn;
				case UserType.MULTISENDER:
					return SdpType.VideoMultiSender;
				case UserType.INACTIVE:
					return SdpType.inactive;
				case UserType.MRF_USER:
				case UserType.MRF_UPDATE:
					return SdpType.mrf;
				case UserType.SENDRECV:
				case UserType.SENDONLY:
				case UserType.RECVONLY:
					return SdpType.oneAudioMid;
				case UserType.SSC_USER:
					return SdpType.ssc_user;
				case UserType.VIDEO_SENDRECV:
					return SdpType.video_sendrecv;
				default:
					return SdpType.receiver;
			}
	}
};

export interface JestMatchResponse {
	message: string;
	pass: boolean;
}

expect.extend({
	handleException: function (expected: any) {
		const pass: boolean = typeof expected === "undefined";
		return {
			message: () => `${pass ? "[Exception]" : "[Error]"} ${expected}`,
			pass: pass,
		};
	},
});

declare global {
	namespace jest {
		interface Matchers<R> {
			handleException(): JestMatchResponse;
		}

		interface Expect {
			handleException(): JestMatchResponse;
		}
	}
}

// declare global {
//     namespace jest {
//         interface Matchers<JestMatchResponse> {
//             handleExcaption(e : Error): JestMatchResponse;
//         }
//
//         class MatchersImpl implements Matchers<JestMatchResponse> {
//             handleExcaption = (e: Error): JestMatchResponse => {
//                 return e ? <JestMatchResponse>{message: "", pass: false} : <JestMatchResponse>{message: "", pass: true};
//             };
//         }}
// }

export const calcSipClientPort = (port: number = SIP_PORT, fixed = false): number => {
	if (fixed) {
		return port;
	}

	let tmp: number = Math.random() * (9999 - port + 1);
	tmp = tmp + port;
	const result = tmp.toString().split(".")[0];

	const sipPort: number = parseInt(result);

	//Floor return undefined...not sure why. using an alternative solution
	//const sipPort: number = Math.floor(tmp);

	// //default is K8s!
	// const sipPort: number =
	// 	process.env.PLATFORM_TYPE && process.env.PLATFORM_TYPE.toUpperCase() == "SWARM" ? port + 1 : port; /* K8S */

	return sipPort;
};

/**
 * contact":[{"uri":"sip:1011606303753530@10.45.35.62:5060"}],
 * @param session
 * @param contact
 */

export const editDestContact = (
	session: UserSession | ControlSession,
	contact: Contact | ContactDTO,
	context?: Context
) => {
	let dto: ContactDTO;
	if (typeof contact.uri == "string") {
		dto = new ContactDTO();
		const uriParts: Array<string> = (<Contact>contact).uri.split(":");
		const port: number = context ? context.port() : parseInt(uriParts[2] ? uriParts[2] : "5060");
		//username@domain
		const user: Array<string> = uriParts[1].split("@");
		dto.user = user[0];
		dto.domain = user[1];
		dto.port = port;
	} else {
		dto = <ContactDTO>contact;
	}
	session.destContact.length = 0;
	session.destContact.push(dto);
};

export const skipByEnvironment = (then: any, context: Context) => {
	then("enable skip by environment", async (address) => {
		if (context.env.skipTests && context.env.skipTests.some((entry) => entry == context.currentTest)) {
			LOGGER.warn({
				test: context.currentTest,
				action: "Skip",
				description: "test not allowed to run on thin env!!",
			});
			pending("Test should not run on this env!");
			return;
		}
	});
};

import { UserSession } from "../../common/sip/dto/controlSession";
import { Context } from "../../common/context";
import { McuService } from "../../common/sip/mcu.service";
import { strToRoomType } from "../../common/utils";
import { ResponseDTO } from "../../common/sip/dto/infoDTO";
import { LOGGER } from "../../common/logger.service";

export const loadMuteParticipant = async (
	service: McuService,
	context: Context,
	Participant: string,
	mute: string
): Promise<void> => {
	try {
		const userId = `${Participant}_${strToRoomType("audio")}`;
		const userSession: UserSession = <UserSession>context.getUserSession(userId);
		userSession.userAction = "mute";

		userSession.roomCseq.seq++;
		const muteR: ResponseDTO = await service.mute(userSession);
		LOGGER.info({ test: context.currentTest, action: `after ${mute} => `, data: muteR });
	} catch (e) {
		if (!context.failureMechanism) {
			LOGGER.error({ test: context.currentTest, action: "############# loadMuteParticipant", data: e.message });
			console.assert(false, `[${context.currentTest}] mute, error: ${e.message}`);
			expect(e).handleException();
		} else {
			context.failuresCountMap.mute.set(Participant, true);
		}
	}
};

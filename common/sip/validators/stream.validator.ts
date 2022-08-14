import { UserSession } from "../dto/controlSession";
import { Context } from "../../context";
import * as fs from "fs";
import { strToDeviceType } from "../../utils";
import { DeviceType } from "../../messages/factory";
import { LOGGER } from "../../logger.service";

export class ValidateStream {
	public async validateStreamFilesAmount(userId: string, session: UserSession, context: Context): Promise<void> {
		let VideoStreamFiles = 0;
		let AudioStreamFiles = 0;
		try {
			const OutputFilesPath: string = context.StreamsOutputFilesPath;
			const meetingId: string = session.meetingId;

			const filesFolder = `${OutputFilesPath}/${meetingId}/${session.from.user}`;

			const fsPromises = fs.promises;
			const files: any = await fsPromises.readdir(filesFolder);

			await Promise.all(
				files.map(async (element) => {
					const file: any = fs.statSync(`${filesFolder}/${element}`);
					LOGGER.info({ action: `validate ${element} file size` });
					expect(file.size).toBeGreaterThan(606);
					element.split("_").length > 1 ? VideoStreamFiles++ : AudioStreamFiles++;
				})
			);

			LOGGER.info({ test: context.currentTest, action: "validate num of audio stream files" });
			expect(AudioStreamFiles).toEqual(1 * session.StreamDTO.numOfStratMacmesh);

			LOGGER.info({ test: context.currentTest, action: "validate num of video stream files" });
			switch (strToDeviceType(session.deviceType)) {
				case DeviceType.PSTN: {
					expect(VideoStreamFiles).toEqual(0);
					break;
				}
				default: {
					if (session.StreamDTO.isUserStreamVideo) {
						expect(VideoStreamFiles).toBeGreaterThanOrEqual(
							(context.numOfVideoPubUsers - 1) * session.StreamDTO.numOfStratMacmesh
						);
					} else {
						expect(VideoStreamFiles).toEqual(
							context.numOfVideoPubUsers * session.StreamDTO.numOfStratMacmesh
						);
					}
				}
			}
		} catch (e) {
			if (!context.failureMechanism) {
				LOGGER.error({ test: context.currentTest, action: context.currentTest, err: e.message });
				console.assert(false, `[${context.currentTest}] validate stream, error: ${e.message}`);
				expect(e).handleException();
			} else {
				context.failuresCountMap.validateStream.set(userId, true);
				LOGGER.info({
					test: context.currentTest,
					action: "==--==failure stream files validate for user: ",
					data: userId,
				});
			}
		}
	}
}

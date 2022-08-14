import { Context } from "../../context";
import { FilesActions } from "../filesActions";
import { LOGGER } from "../../logger.service";
import * as fs from "fs";

const recorederFiles = new FilesActions();

export class ValidateRecorder {
	public async srmrValidate(meetingID: string, context: Context): Promise<void> {
		try {
			await recorederFiles.downLoadFile(
				`${context.minioURLRecorderFiles}/cutRecorderFile.mp4`,
				`${context.RecorderFilesPath}${meetingID}`
			);

			await recorederFiles.convertFile(
				`${context.RecorderFilesPath}${meetingID}/cutRecorderFile.mp4`,
				`${context.RecorderFilesPath}${meetingID}/cutRecorderFile.wav`,
				"wav"
			);
			const srmrValue = await recorederFiles.srmrOnMediaFile(
				`${context.RecorderFilesPath}${meetingID}/`,
				"cutRecorderFile.wav"
			);

			LOGGER.info({ test: context.currentTest, action: "srmrValue: ", data: srmrValue });
			expect(Number(srmrValue)).toBeGreaterThanOrEqual(1);
		} catch (e) {
			LOGGER.error({ test: context.currentTest, action: context.currentTest, err: e.message });
			console.assert(false, `[${context.currentTest}] recorderInfo, error: ${e.message}`);
			expect(e).handleException();
		}
	}

	public async fileSizeValidate(context: Context): Promise<void> {
		try {
			const recorderFilesName: string[] = fs
				.readdirSync(`${context.ClaudRecordingFilesPath}/`)
				.filter((file: string) => file.split("_")[0] == context.meetingId);

			const fileSize = await recorederFiles.getFileSize(
				`${context.ClaudRecordingFilesPath}/`,
				recorderFilesName[0]
			);
			expect(fileSize).toBeGreaterThanOrEqual(1000);
		} catch (e) {
			LOGGER.error({ test: context.currentTest, action: context.currentTest, err: e.message });
			console.assert(false, `[${context.currentTest}] recorderInfo, error: ${e.message}`);
			expect(e).handleException();
		}
	}
}

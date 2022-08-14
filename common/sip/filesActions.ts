import * as fs from "fs";
import rimraf from "rimraf";
import exec from "await-exec";
import ffmpeg = require("fluent-ffmpeg");
import * as childProcess from "child_process";
import { LOGGER } from "../logger.service";
import { MakeDirectoryOptions } from "fs";
import { DECKER_REGISTRY } from "../constants";

export class FilesActions {
	public createFolder(folderPath: string) {
		if (!fs.existsSync(folderPath)) {
			fs.mkdirSync(folderPath, <MakeDirectoryOptions>{ recursive: true });
			//shell.mkdir("-p", folderPath);
		}
	}

	public copyFile(sourceFile: string) {
		const date = Date.now();
		const destFile = `${sourceFile}.${date}`;
		fs.copyFile(sourceFile, destFile, (err) => {
			if (err) throw err;
		});
	}

	public deleteFolder(folderPath: string) {
		rimraf(folderPath, function () {
			LOGGER.info({ action: "done: ", data: folderPath });
		});
	}

	public async downLoadFile(sourceUrl: string, targetUrl: string): Promise<void> {
		await exec(`wget -P ${targetUrl} ${sourceUrl}`);
	}

	public async convertFile(sourceUrl: string, targetUrl: string, format: string): Promise<void> {
		return new Promise((resolve, reject) => {
			ffmpeg(sourceUrl)
				.toFormat(format)
				.on("error", function (err) {
					reject(err);
				})
				.on("end", () => {
					resolve();
				})
				.save(targetUrl);
		});
	}

	public async srmrOnMediaFile(sourceUrl: string, fileName: string): Promise<string> {
		const DOCKER_IAMGE = `${DECKER_REGISTRY}srmr:01`;

		return new Promise(function (resolve, reject) {
			const command = `docker run --network host -v ${sourceUrl}${fileName}:/var/tmp/RecorderFile ${DOCKER_IAMGE}`;
			LOGGER.info({ action: "srmr command: ", data: command });

			childProcess.exec(command, function (err, standardOutput) {
				if (err) {
					reject(err);
					return;
				}
				LOGGER.info({ action: "standardOutput: ", data: standardOutput });
				resolve(standardOutput.split(":")[1]);
			});
		});
	}

	public async getFileSize(sourceUrl: string, fileName: string): Promise<number> {
		return new Promise(function (resolve, reject) {
			fs.stat(sourceUrl + "/" + fileName, (err, stats) => {
				if (err) {
					reject(err);
					return;
				}
				resolve(stats.size);
			});
		});
	}
}

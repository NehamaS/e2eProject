/* eslint-disable @typescript-eslint/no-var-requires */

import * as fs from "fs";
import { ReadStream } from "fs";
import { Buffer } from "buffer";
import request = require("request");
import FormData = require("form-data");
import { AxiosRequestConfig } from "axios";
//import * as fetch from "node-fetch";
//const fetch = require("node-fetch");
const axios = require("axios");

axios.defaults.adapter = require("axios/lib/adapters/http");

/*
 * Mock recorder controller upload to mStore api
 * */
export class FileUploadService {
	public async healthcheck() {
		return new Promise<boolean>((resolve, reject) => {
			request.get("http://127.0.0.1:6050/", (err, httpResponse, body) => {
				if (err) {
					return reject(err);
				}
				console.debug("healthcheck response", body);
				return resolve(httpResponse.statusCode == 200 ? true : false);
			});
		});
	}

	public async upload(filePath = `${process.cwd()}/StreamFiles/Input/dtmf_mute.mkv`): Promise<boolean> {
		const fileName: string = filePath.split("/") ? <string>filePath.split("/").pop() : "test.txt";
		const uploadUrl = `http://127.0.0.1:6050/uccAs/V1/FMS/Upload/MeetingRecord/${fileName}`;

		const headers = {
			"Content-Length": fs.statSync(filePath).size,
			"Content-Type": "audio/mp3",
			Accept: "*/*",
			"X-Device-Type": "WebClient",
			"Content-Transfer-Encoding": "BINARY",
			"User-Agent": "MCU",
			"Content-Disposition": `attachment; filename="${fileName}"`,
		};

		try {
			const data: Buffer = fs.readFileSync(filePath);
			const response = await axios.put(uploadUrl, data, <AxiosRequestConfig>{ headers: headers });
		} catch (e) {
			console.error(e);
			return false;
		}
		return true;
	}

	public async uploadMultipart(filePath = `${process.cwd()}/StreamFiles/Input/dtmf_mute.mkv`): Promise<boolean> {
		console.info(`uploading file ${filePath}`);

		const uploadUrl = "http://127.0.0.1:6050/uccAs/V1/FCS/Upload/MeetingRecord";

		const formData = new FormData();
		const fileName: string = filePath.split("/") ? <string>filePath.split("/").pop() : "test.txt";
		formData.append("file", fs.createReadStream(filePath));

		try {
			const response = await axios.post(uploadUrl, formData, {
				headers: {
					...formData.getHeaders(),
					enctype: "multipart/form-data",
					//"Content-Length": 100//formData.getLengthSync()
				},
			});
			return true;
		} catch (e) {
			console.error(e);
			throw e;
		}
		return false;
	}
}

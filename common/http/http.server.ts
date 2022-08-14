import parser = require("body-parser");
import multer = require("multer");
import express = require("express");
import * as fs from "fs";
import morgan from "morgan";
import { MakeDirectoryOptions, Mode } from "fs";
import { Request, Response } from "express";
import { LOGGER, LoggerService } from "../logger.service";
import { HTTP_CONTENT_TYPE_MP3, HTTP_CONTENT_TYPE_MULTIPART, HTTP_HEADER_CONTENT_TYPE } from "../constants";

interface UploadHeader {
	value: any;
	mandatory: boolean;
	isAttr?: boolean;
}

interface MediaFile {
	filename: string;
	size: number;
	mimetype: string;
	mv?: any;
	data?: any;
}

export class HttpServer {
	private app: any;
	private storage: any;
	private httpServer: any;

	private readonly storagePath: string = `${process.cwd()}/uploads`;

	constructor(private readonly logger: LoggerService, isCloud: boolean) {
		this.app = express();
		//Access logger
		this.app.use(morgan("tiny"));

		//     this.app.use(parser.urlencoded({
		//     limit: "500mb",
		//     parameterLimit: 100000,
		//     extended: true
		// }));
		//this.app.use(parser.raw({ type: "*/*", limit: Infinity }), function (req, res, next) {
		if (isCloud) {
			console.log("Cloud platform");
			this.app.use(parser.raw({ limit: Infinity }), function (req, res, next) {
				console.debug({ body: req.body, file: req.file, files: req.files });
				return next();
			});
		} else {
			this.app.use(parser.raw({ type: "*/*", limit: Infinity }), function (req, res, next) {
				console.debug({ body: req.body, file: req.file, files: req.files });
				return next();
			});
		}

		/*CORS Cross Origin Request Security*/
		// this.app.use((req, res, next) => {
		//     res.header("Access-Control-Allow-Credentials", true);
		//
		//     res.header("Access-Control-Allow-Origin", "*");
		//     res.header("Access-Control-Allow-Methods", "GET, POST, HEAD, OPTIONS, PUT, PATCH, DELETE");
		//     res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
		// });

		try {
			if (!fs.existsSync(this.storagePath)) {
				fs.mkdirSync(this.storagePath, <MakeDirectoryOptions>{ mode: <Mode>0o777, recursive: true });
			}
		} catch (e) {
			console.warn(e.message);
		}

		console.log("creating upload directory:", this.storagePath);
		const self = this;
		const localStorage = multer.diskStorage({
			destination: function (req, file, cb) {
				cb(null, self.storagePath);
			},
			filename: function (req, file, cb) {
				console.log("File written to storage", file);
				// cb(null, `${file.fieldname}-${Date.now()}.${file.originalname.split(".")[1]}`);
				cb(null, `${file.originalname}`);
			},
		});

		this.storage = multer({ storage: localStorage });
	}

	private getHeadersMap(isCloudRecording: boolean, recordingFileName: string): Map<string, UploadHeader> {
		const uploadHeadersMap: Map<string, UploadHeader> = new Map<string, UploadHeader>();
		//common
		uploadHeadersMap.set("Content-Length", { value: "size", mandatory: true, isAttr: true });
		uploadHeadersMap.set("Authorization", { value: undefined, mandatory: false });
		//mMCU additional headers

		if (isCloudRecording) {
			uploadHeadersMap.set("User-Agent", { value: "MCU", mandatory: true });
			uploadHeadersMap.set(HTTP_HEADER_CONTENT_TYPE, { value: HTTP_CONTENT_TYPE_MULTIPART, mandatory: true });
			//Cloud recording
			//Acording to document reqired for GET operation only
			uploadHeadersMap.set("X-3GPP-Asserted-Identity", { value: "originalname", mandatory: false, isAttr: true });
			uploadHeadersMap.set("X-FileUpload-Service", { value: "OneDrive", mandatory: false });
			uploadHeadersMap.set("Content-Range", { value: undefined, mandatory: false });
			uploadHeadersMap.set("Retry-After", { value: undefined, mandatory: false });
			uploadHeadersMap.set("x-up-calling-line-id", { value: undefined, mandatory: false });
			uploadHeadersMap.set("X-Target-Id", { value: undefined, mandatory: false });
		} else {
			//1-1 recording
			uploadHeadersMap.set(HTTP_HEADER_CONTENT_TYPE, { value: HTTP_CONTENT_TYPE_MP3, mandatory: true });

			uploadHeadersMap.set("Content-Transfer-Encoding", { value: "BINARY", mandatory: false });
			uploadHeadersMap.set("Content-Disposition", {
				value: `attachment; filename="${recordingFileName}"`,
				mandatory: false,
			});
			//Server generated headers
			//uploadHeadersMap.set("X-mStoreFE-Addr", {value: undefined, mandatory: false});
			//this.uploadHeadersMap.set("ETag", {value: undefined, mandatory: false});
			uploadHeadersMap.set("X-Device-Type", { value: "WebClient", mandatory: false }); //document states it mandatory!!!
		}

		return uploadHeadersMap;
	}

	private upload(req: Request, res: Response, validateHeadersFunc?: any, isCloudRecording?: boolean) {
		if (isCloudRecording && req.body) {
			const file: string = req.headers["x-3gpp-asserted-identity"];
			if (!file || Object.keys(file).length === 0) {
				res.status(400);
				res.send("Please upload a file");
			}

			const localFilePath = `${this.storagePath}/${file.split("_")[0]}`;
			// fs.mkdirSync(localFilePath)
			// fs.writeFileSync(localFilePath, req.body);

			// const mediaFile: { filename: string; size: number; mimetype: string; mv?: any; data?: any } = file;
			// if (validateHeadersFunc) {
			// 	if (!validateHeadersFunc(req.headers, file, isCloudRecording)) {
			// 		res.status(400).send("Bad request - headers are missing/invalid");
			// 		return;
			// 	}
			// }
			res.send("<file><file-info><data url='e2e-mStore-url'></data></file-info></file>");
		} else {
			if (req.body) {
				const localFilePath = `${this.storagePath}/${req.params.filename}`;
				fs.writeFileSync(localFilePath, req.body);
				if (validateHeadersFunc) {
					const fileSize: number = fs.statSync(localFilePath).size;
					const mediaFile: { filename: string; size: number; mimetype: string; mv?: any; data?: any } = {
						filename: req.params.filename,
						size: fileSize,
						mimetype: req.headers["Content-Type"],
					};
					if (!validateHeadersFunc(req.headers, mediaFile, isCloudRecording)) {
						res.status(400).send("Bad request - headers are missing/invalid");
						return;
					}
				}
			} else {
				res.status(400);
				res.send("Please upload a file");
				return;
			}
		}
		res.setHeader(HTTP_HEADER_CONTENT_TYPE, HTTP_CONTENT_TYPE_MP3);
		res.send("OK");
		return;
	}

	private validateHeaders(headers: Map<string, string>, mediaFile: MediaFile, isCloudRecording: boolean) {
		const uploadHeadersMap: Map<string, UploadHeader> = this.getHeadersMap(isCloudRecording, mediaFile.filename);
		for (const entry of uploadHeadersMap.entries()) {
			const key: string = entry[0].toLowerCase();
			const data: UploadHeader = <UploadHeader>entry[1];
			this.logger.debug({ header: key, data: data });

			//validate missing header
			if (data.mandatory && !headers[key]) {
				this.logger.error({ header: key, data: data, error: "header is missing" });
				return false;
			}

			//Only if header exists, validate its value. Mandatory is validate previosly
			if (headers[key]) {
				const headerValue = data.isAttr ? mediaFile[data.value] : data.value;
				const isValid = isNaN(headerValue)
					? (<string>headers[key]).includes(headerValue)
					: Math.abs(headers[key] - headerValue) < 500; //size diff up to 0.5MB;
				if (!isValid) {
					this.logger.error({
						header: key,
						data: data,
						actual: headerValue /*actual value recived*/,
						error: "header is invalid",
					});
					return false;
				}
			}
		}

		return true;
	}

	public init() {
		this.app.get("/", function (req, res) {
			res.json({ message: "WELCOME to mStore Mock Service :-)" });
		});

		this.app.post("/uploadfile", this.storage.single("file"), this.upload);

		const self = this;
		// FOR CLOUD RECORDER
		this.app.post(
			"//uccAs/V1/FCS/Upload/MeetingRecord/",
			self.storage.single("file"),
			(req: Request, res: Response) => {
				const url = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
				LOGGER.info({ action: "POST", api: url, headers: req.headers });
				self.upload(req, res, self.validateHeaders.bind(self), true);
			}
		);

		// FOR 1-1 RECORDER
		this.app.put(
			"/uccAs/V1/FMS/Upload/MeetingRecord/:filename",
			self.storage.single("file"),
			(req: Request, res: Response) => {
				const url = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
				LOGGER.info({ action: "PUT", api: url, headers: req.headers });
				self.upload(req, res, self.validateHeaders.bind(self), false);
			}
		);
	}

	public delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	public start(hostname: string, port = 6050): Promise<boolean> {
		return new Promise((resolve) => {
			this.httpServer = this.app.listen(port, hostname, () => {
				console.log(`HTTP Server started on host ${hostname} port ${port}`);
				return resolve(true);
			});
		});
	}

	public stop() {
		this.httpServer.close();
	}
}

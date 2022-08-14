import { HttpServer } from "../../../common/http/http.server";
import { LoggerService } from "../../../common/logger.service";
import { FileUploadService } from "./file.upload.service";

jest.setTimeout(900000);

describe("Http server (mStore mock)", () => {
	const server: HttpServer = new HttpServer(new LoggerService(), false);
	const uploadService: FileUploadService = new FileUploadService();

	beforeAll(async () => {
		server.init();
		await server.start("127.0.0.1");
		await new Promise((resolve) => {
			setTimeout(() => {
				return resolve();
			}, 6000);
		});
	});

	afterAll(async () => {
		await server.stop();
	});

	test("Sanity", async () => {
		try {
			//Do healthcheck
			const response: boolean = await uploadService.healthcheck();
			expect(response).toBeTruthy();

			// const upload: boolean = await uploadService.upload(
			// 	`${process.cwd()}/StreamFiles/Input/file_example_MP3_700KB.mp3`
			// );
			// if (!upload) {
			// 	fail("Upload verification failed!!!");
			// }
		} catch (e) {
			fail(e);
		}
	});
});

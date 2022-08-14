import { StreamFile } from "../messages/factory";
import { Context } from "../context";
import { UserSession } from "./dto/controlSession";

import { dockerCommand, IOptions } from "docker-cli-js";
import { LOGGER } from "../logger.service";
import { DECKER_REGISTRY } from "../constants";

const DOCKER_IAMGE = `${DECKER_REGISTRY}macmesh:01`;

export class SipStream {
	public async startMacmesh(session: UserSession, context: Context, streamFile: StreamFile): Promise<void> {
		const dockerName: string = session.StreamDTO.localPort;
		const InputFilesPath: string = context.StreamsInputFilesPath;
		const InputFileName: string = StreamFile[streamFile] + ".mkv";
		const OutputFilesPath: string = context.StreamsOutputFilesPath;
		const meetingId: string = session.meetingId;
		const mcuIPAddress: string = context.address();
		const remoteIP: string = session.StreamDTO.remoteIP;
		const localPort: string = session.StreamDTO.localPort;
		const remotePort: string = session.StreamDTO.remotePort;
		const assrc_In: string = session.StreamDTO.assrc_In;
		const vssrc_In: string[] | number = session.StreamDTO.vssrc_In;
		const assrc_Out = Number(session.StreamDTO.assrc_Out);
		const vssrc_Out = Number(session.StreamDTO.vssrc_Out);

		LOGGER.info({
			test: context.currentTest,
			action: "startMacmesh",
			data: {
				dockerName: dockerName,
				meetingId: meetingId,
				localPort: localPort,
				remotePort: remotePort,
				assrc_In: assrc_In,
				vssrc_In: vssrc_In,
				remoteIP: remoteIP,
				assrc_Out: typeof assrc_Out,
				vssrc_Out: typeof vssrc_Out,
			},
		});

		const startCommand: string =
			vssrc_Out == 0
				? `run -itd --name ${dockerName} --rm --network host -v ${InputFilesPath}:/input/ -v ${OutputFilesPath}/${meetingId}/${session.from.user}:/output/ ${DOCKER_IAMGE} -file_in /input/${InputFileName} -out_dir /output -rip ${remoteIP} -lport ${localPort}  -rport ${remotePort} -assrc_in ${assrc_In}  -vssrc_in ${vssrc_In}  -assrc_out ${assrc_Out}  -vpt_out 125 -vpt_in 125 -apt_out 111 -apt_in 111 -vp8_payload_descriptor --loop -run_time 1000000 -verbose 1`
				: `run -itd --name ${dockerName} --rm --network host -v ${InputFilesPath}:/input/ -v ${OutputFilesPath}/${meetingId}/${session.from.user}:/output/ ${DOCKER_IAMGE} -file_in /input/${InputFileName} -out_dir /output -rip ${remoteIP} -lport ${localPort}  -rport ${remotePort} -assrc_in ${assrc_In}  -vssrc_in ${vssrc_In} -vssrc_out ${vssrc_Out} -assrc_out ${assrc_Out}  -vpt_out 125 -vpt_in 125 -apt_out 111 -apt_in 111 -vp8_payload_descriptor --loop -run_time 1000000 -verbose 1`;

		LOGGER.info({ test: context.currentTest, action: "startCommand: ", data: startCommand });

		// startCommand=`run -itd --name ${dockerName} --rm --network host -v ${InputFilesPath}:/input/ -v ${OutputFilesPath}/${meetingId}/${session.from.user}:/output/ macmesh:0 -file_in /input/${InputFileName} -out_dir /output -rip ${mcuIPAddress} -lport ${localPort}  -rport ${remotePort} -assrc_in ${assrc_In} -assrc_out ${assrc_Out} --loop -run_time 1000000 -verbose 1`
		// LOGGER.log("startCommand: "+startCommand)

		const options: IOptions = {
			echo: true, // echo command output to stdout/stderr
		};

		try {
			const data = await dockerCommand(startCommand, options);
		} catch (e) {
			LOGGER.error({
				test: context.currentTest,
				action: "startMacmesh, Failed to execute docker command ",
				data: e.message ? e.message : e,
			});
		}
	}

	public async stopMacmesh(session: UserSession): Promise<void> {
		const dockerName: string = session.StreamDTO.localPort;

		const options: IOptions = {
			echo: true,
		};
		try {
			await dockerCommand(`stop ${dockerName}`, options);
		} catch (e) {
			LOGGER.error({ action: "stopMacmesh, Failed to execute docker command ", data: e.message ? e.message : e });
		}
	}

	public async checkMacmeshStatus(session: UserSession): Promise<boolean> {
		const dockerName: string = session.StreamDTO.localPort;
		const options: IOptions = {
			echo: true,
		};

		let result = true;

		try {
			const data = await dockerCommand(`ps -q -f name=${dockerName}`, options);
			if (data.raw == "") {
				result = false;
			}
		} catch (e) {
			LOGGER.error({
				action: "checkMacmeshStatus, Failed to execute docker command ",
				data: e.message ? e.message : e,
			});
		}
		return result;
	}
}

export interface SDP {
	getSdp(): any;
}

/**
 * `<?xml version="1.0" encoding="US-ASCII"?>\r\n
 <msml version="1.1">\r\n
 <createconference name="${roomId} '" deletewhen="nocontrol" mark="1" term="true">\r\n
 <audiomix id="mix491230"/>\r\n
 </createconference>\r\n
 </msml>`
 */
export class CreateRoom implements SDP {
	constructor(private roomId: string) {}

	public getSdp = () => {
		const sdp = {
			msml: {
				$: {
					version: "1.1",
				},
				createconference: {
					$: {
						name: this.roomId,
						deletewhen: "nocontrol",
						mark: "1",
						term: "true",
					},
					audiomix: {
						$: {
							id: "mix491230",
						},
					},
				},
			},
		};
		return sdp;
	};
}

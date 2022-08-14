import * as xml2js from "xml2js";
const parser = new xml2js.Parser();
const builder = new xml2js.Builder();

export class MsmlService {
	public Object2xmlString(obj: any): string {
		const xml = builder.buildObject(obj);
		return xml;
	}
	public async xmlString2Object(msml: string | unknown): Promise<any> {
		return new Promise((resolve, reject) => {
			parser.parseString(msml, function (err, result) {
				if (err) return reject(err);
				else return resolve(result);
			});
		});
	}
}

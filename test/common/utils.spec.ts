import { getAddress } from "../../common/utils";
import { isIP } from "class-validator";
import { ContactDTO, UserSession } from "../../common/sip/dto/controlSession";
import { editDestContact } from "../../steps/common.steps.utils";
import { doc } from "prettier";
import { Contact } from "../../common/sip/dto/infoDTO";

describe("test get address", () => {
	xtest("test vpn address ", () => {
		const address = getAddress();
		expect(address).toBeDefined();
		expect(isIP(address)).toBeTruthy();
	});
});

describe("test destination contact assingment", () => {
	test("test contact ", () => {
		const session: UserSession = new UserSession();
		const contact: Contact = <Contact>{ uri: "sip:1011606303753530@10.45.35.62:5060" };
		editDestContact(session, contact);
		expect(session.destContact).toBeDefined();
		expect(session.destContact.length).toEqual(1);
		expect(session.destContact[0].uri()).toEqual(contact.uri);
	});

	test("test contactDTO ", () => {
		const session: UserSession = new UserSession();
		const contact: ContactDTO = new ContactDTO();
		contact.domain = "10.45.35.62";
		contact.user = "1011606303753530";
		contact.port = 5060;
		editDestContact(session, contact);
		expect(session.destContact).toBeDefined();
		expect(session.destContact.length).toEqual(1);
		expect(session.destContact[0].uri()).toEqual(contact.uri());
	});

	xtest("test custom message ", () => {
		expect(true, "this is an error message test").toBeFalsy();
	});
});

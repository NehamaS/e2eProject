import { RequestDTO, ResponseDTO } from "../dto/infoDTO";
import { Context } from "../../context";
import { ControlSession, UserSession } from "../dto/controlSession";

export interface Validator {
	validate(request: RequestDTO, response: ResponseDTO, session: ControlSession | UserSession): void;
}

export abstract class BaseValidator implements Validator {
	abstract validate(request: RequestDTO, response: ResponseDTO, session: ControlSession | UserSession): void;
}

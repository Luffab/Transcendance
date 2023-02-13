export class TfaDTO {
	token: string;
	is_2fa: boolean;
}

export class VerifyCodeDTO {
	token: string;
	code: string;
}

export class RecupDTO {
	token: string
	email: string
}
export class ChannelDTO {
	socket: string;
	token: string;
	channel_name: string;
	channel_type: string;
	password: string;
}

export class UserInChanDTO {
	token: string;
	channel_id: number;
	Users: [{
		username: string,
		user_id: string,
	}
	];
}

export class UserNotInChanDTO {
	token: string;
	channel_id: number;
}

export class ChangePswDTO {
	jwt: string;
	chanId: number;
	password: string;
}

export class DeleteChanDTO {
	token: string;
	chan_id: number;
}

export class MessageInChanDTO {
	token: string;
	chan_id: number;
}

export class JoinChanDTO {
	token: string;
	chan_id: number;
	password: string;
}

export class LeaveChanDTO {
	jwt: string;
	chanId: number;
}
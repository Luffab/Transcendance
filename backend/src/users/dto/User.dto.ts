

export interface UserDTO {
	 photos: string;
	 emails: string;
	 username: string;
	 password: string;
}

export class ImageDTO {
	token: string;
	image: string;
}

export class UsernameDTO {
	token: string;
	username: string;
}

export class AddFriendDTO {
	token: string;
	friend_id: string;
}

export class BlockuserDTO {
	token: string;
	block_id: string;
}

export class UpdateUserDTO {
	user_id: string;
	victory: boolean;
	defeat: boolean;
}

export class GameHistoryDTO {
	user_id: string;
	is_win: boolean;
	p1Score: number;
	p2Score: number;
	opponent: string;
}

export class EmailDTO {
	token: string
	email: string
}
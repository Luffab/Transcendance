import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Inject, Param, Post, Put, Query } from '@nestjs/common';
import { AddFriendDTO, BlockuserDTO, EmailDTO, GameHistoryDTO, ImageDTO, UpdateUserDTO, UserDTO, UsernameDTO } from 'src/users/dto/User.dto';
import { IUserService } from 'src/users/user';
import { UserService } from 'src/users/services/user/user.service';
import { Observable } from 'rxjs';


// /api/users
@Controller('users')
export class UsersController {
	constructor(
	private readonly usersService: UserService) {}

	@Post('change_avatar')
	async modifyimage(@Body() body: ImageDTO) {
		return await this.usersService.changeimage(body);
	}

	@Post('change_username')
	async changeusername(@Body() body: UsernameDTO) {
		return await this.usersService.changeusername(body);
	}

	@Post('change_email')
	async changeemail(@Body() body: EmailDTO) {
		return await this.usersService.changeEmail(body)
	}

	@Get('user_information')
	async getusersinfo(@Query() query: { token: string, id: string }) {
		console.log(query.token)
		return await this.usersService.getUsersInfos(query.token, query.id);
	}

	@Post('block_user')
	async blockuser(@Body() body: BlockuserDTO) {
		return await this.usersService.blockUser(body);
	}

	@Post('deblock_user')
	async deblockuser(@Body() body: BlockuserDTO) {
		return await this.usersService.deblockUser(body);
	}

	@Post('remove_friend')
	async removefriend(@Body() body: AddFriendDTO) {
		return await this.usersService.removeFriend(body);
	}

	@Get('friends')
	async getfriends(@Query() query: { token: string }) {
		return await this.usersService.getFriends(query.token);
	}

	@Get('wait_friends')
	async getwaitfriends(@Query() query: { token: string }) {
		return await this.usersService.getWaitFriends(query.token);
	}

	@Post('update_user')
	async updateuser(@Body() body: UpdateUserDTO) {
		return await this.usersService.updateUser(body);
	}

	@Get('my_info')
	async myinfo(@Query() query: { token: string }) {
		return await this.usersService.getMyInfos(query.token);
	}

	@Get('is_block')
	async isuserblocked(@Query() query: { token: string, id: string }) {
		return await this.usersService.isUserBlock(query.token, query.id)
	}

	@Get('is_friend')
	async isuserfriend(@Query() query: { token: string, id: string }) {
		return await this.usersService.isUserFriend(query.token, query.id)
	}

	@Get('is_waiting_friend')
	async iswaiting(@Query() query: { token: string, id: string }) {
		return await this.usersService.isUserWaitingFriend(query.token, query.id)
	}

	@Get('blocked_users')
	async blockedusers(@Query() query: { token: string }) {
		return await this.usersService.blockedUsers(query.token);
	}

	@Post('update_game_history')
	async updategamehistory(@Body() body: GameHistoryDTO) {
		return await this.usersService.updateGameHistory(body)
	}

	@Get('get_game_history')
	async getgamehistory(@Query() query: { token: string, id: string }) {
		return await this.usersService.getGameHistory(query.token, query.id)
	}

	@Get('get_id')
	async getid(@Query() query: {token: string}) {
		return await this.usersService.getId(query.token)
	}
}

import { Body, Controller, Get, HttpException, Post, Query } from '@nestjs/common';
import { BlockuserDTO, EmailDTO, ImageDTO, UsernameDTO } from 'src/users/dto/User.dto';
import { UserService } from 'src/users/services/user/user.service';

@Controller('users')
export class UsersController {
	constructor(
	private readonly usersService: UserService) {}

	@Post('change_avatar')
	async modifyImage(@Body() body: ImageDTO) {
		let decoded = await this.usersService.validateUser(body.token)
		if (!decoded)
			throw new HttpException('Error: You are not authentified.', 500)
		if (body.image.length > 10485760)
			throw new HttpException('Error: Image is too large.', 500)
		return await this.usersService.changeImage(decoded.ft_id, body.image);
	}

	@Post('change_username')
	async changeUsername(@Body() body: UsernameDTO) {
		let decoded = await this.usersService.validateUser(body.token)
		if (!decoded)
			throw new HttpException('Error: You are not authentified.', 500)
		if (body.username.length > 20)
			throw new HttpException('Error: Username must not exceed 20 characters.', 500)
		if (body.username.length < 3)
			throw new HttpException('Error: Username must have at least 3 characters.', 500)
		if (await this.usersService.isSameUsername(decoded.ft_id, body.username) === true)
			throw new HttpException('Error: You already use this username.', 500)
		if (await this.usersService.usernameExists(body.username) === true)
			throw new HttpException('Error: This username is already in use by someone else.', 500)
		await this.usersService.changeUsername(decoded.ft_id, body.username);
	}

	@Post('change_email')
	async changeEmail(@Body() body: EmailDTO) {
		let decoded = await this.usersService.validateUser(body.token)
		if (!decoded)
			throw new HttpException('Error: You are not authentified.', 500)
		if (body.email.length > 254)
			throw new HttpException('Error: Email must exceed 254 characters.', 500)
		return await this.usersService.changeEmail(decoded.ft_id, body.email)
	}

	@Get('user_information')
	async getUsersInfo(@Query() query: { token: string, id: string }) {
		let decoded = await this.usersService.validateUser(query.token)
		if (!decoded)
			throw new HttpException('Error: You are not authentified.', 500)
		let user = await this.usersService.getUsersInfos(query.id);
		if (user)
			return user
		throw new HttpException('Error: User does not exist.', 500);
	}

	@Post('deblock_user')
	async deblockUser(@Body() body: BlockuserDTO) {
		let decoded = await this.usersService.validateUser(body.token)
		if (!decoded)
			throw new HttpException('Error: You are not authentified.', 500)
		if (await this.usersService.userExists(body.block_id) === false)
			throw new HttpException('Error: User does not exist.', 500)
		if (await this.usersService.isBlockedBy(decoded.ft_id, body.block_id) === false)
			throw new HttpException('Error: This user is not blocked.', 500)
		await this.usersService.deblockUser(decoded.ft_id, body.block_id);
	}

	@Get('friends')
	async getFriends(@Query() query: { token: string }) {
		let decoded = await this.usersService.validateUser(query.token)
		if (!decoded)
			throw new HttpException('Error: You are not authentified.', 500);
		return await this.usersService.getFriends(decoded.ft_id);
	}

	@Get('wait_friends')
	async getWaitFriends(@Query() query: { token: string }) {
		let decoded = await this.usersService.validateUser(query.token)
		if (!decoded)
			throw new HttpException('Error: You are not authentified.', 500);
		return await this.usersService.getWaitFriends(decoded.ft_id);
	}

	@Get('my_info')
	async myInfo(@Query() query: { token: string }) {
		let decoded = await this.usersService.validateUser(query.token)
		if (!decoded)
			throw new HttpException('Error: You are not authentified.', 500);
		let infos = await this.usersService.getMyInfos(decoded.ft_id);
		if (infos)
			return infos
		throw new HttpException('Error: User does not exist.', 500);
	}

	@Get('is_block')
	async isUserBlocked(@Query() query: { token: string, id: string }) {
		let decoded = await this.usersService.validateUser(query.token)
		if (!decoded)
			throw new HttpException('Error: You are not authentified.', 500);
		return await this.usersService.isUserBlock(decoded.ft_id, query.id)
	}

	@Get('is_friend')
	async isUserFriend(@Query() query: { token: string, id: string }) {
		let decoded = await this.usersService.validateUser(query.token)
		if (!decoded)
			throw new HttpException('Error: You are not authentified.', 500);
		return await this.usersService.isUserFriend(decoded.ft_id, query.id)
	}

	@Get('is_waiting_friend')
	async isWaiting(@Query() query: { token: string, id: string }) {
		let decoded = await this.usersService.validateUser(query.token)
		if (!decoded)
			throw new HttpException('Error: You are not authentified.', 500);
		if (await this.usersService.userExists(query.id) === false)
			throw new HttpException('Error: User does not exist.', 500);
		return await this.usersService.isUserWaitingFriend(decoded.ft_id, query.id)
	}

	@Get('blocked_users')
	async blockedUsers(@Query() query: { token: string }) {
		let decoded = await this.usersService.validateUser(query.token)
		if (!decoded)
			throw new HttpException('Error: You are not authentified.', 500);
		return await this.usersService.blockedUsers(decoded.ft_id);
	}

	@Get('get_game_history')
	async getGameHistory(@Query() query: { token: string, id: string }) {
		let decoded = await this.usersService.validateUser(query.token)
		if (!decoded)
			throw new HttpException('Error: You are not authentified.', 500);
		return await this.usersService.getGameHistory(query.id)
	}
}

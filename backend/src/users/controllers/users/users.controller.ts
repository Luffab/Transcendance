import { Body, Controller, Get, HttpException, Post, Query } from '@nestjs/common';
import { BlockuserDTO, EmailDTO, ImageDTO, UsernameDTO } from 'src/users/dto/User.dto';
import { UserService } from 'src/users/services/user/user.service';

@Controller('users')
export class UsersController {
	constructor(
	private readonly usersService: UserService) {}

	isImage(data: string){
		let knownTypes: any = {
		  '/': 'data:image/jpeg;base64,',
		  'i': 'data:image/png;base64,',
		}
		  
		let image = new Image()
		
		let i = data.search(",")
		if(!knownTypes[data[i + 1]]) {
			return false;
		}
		else {
			image.src = knownTypes[0]+data
			image.onload = function(){
			  //This should load the image so that you can actually check
			  //height and width.
			  if(image.height === 0 || image.width === 0){
				return false;
			  }
		  	}
		  return true;
		}
	}

	@Post('change_avatar')
	async modifyImage(@Body() body: ImageDTO) {
		if (typeof(body.image) != "string")
			throw new HttpException('Error: Wrong data types.', 400)
		let decoded = await this.usersService.validateUser(body.token)
		if (decoded === "error")
			throw new HttpException('Error: Wrong data types.', 400)
		if (!decoded)
			throw new HttpException('Error: You are not authentified.', 400)
		if (body.image.length > 10485760)
			throw new HttpException('Error: Image is too large.', 400)
		if (!this.isImage(body.image))
			throw new HttpException('Error: Bad Type for Image', 400)
		let ret = await this.usersService.changeImage(decoded.ft_id, body.image);
		if (ret === "error")
			throw new HttpException('Error: Wrong data types.', 400)
	}

	@Post('change_username')
	async changeUsername(@Body() body: UsernameDTO) {
		if (typeof(body.username) != "string")
			throw new HttpException('Error: Wrong data types.', 400)
		let decoded = await this.usersService.validateUser(body.token)
		if (decoded === "error")
			throw new HttpException('Error: Wrong data types.', 400)
		if (!decoded)
			throw new HttpException('Error: You are not authentified.', 400)
		if (body.username.length > 20)
			throw new HttpException('Error: Username must not exceed 20 characters.', 400)
		if (body.username.length < 3)
			throw new HttpException('Error: Username must have at least 3 characters.', 400)
		if (await this.usersService.isSameUsername(decoded.ft_id, body.username) === "error")
			throw new HttpException('Error: Wrong data types.', 400)
		if (await this.usersService.isSameUsername(decoded.ft_id, body.username) === true)
			throw new HttpException('Error: You already use this username.', 400)
		if (await this.usersService.usernameExists(body.username) === "error")
			throw new HttpException('Error: Wrong data types.', 400)
		if (await this.usersService.usernameExists(body.username) === true)
			throw new HttpException('Error: This username is already in use by someone else.', 400)
		let ret = await this.usersService.changeUsername(decoded.ft_id, body.username);
		if (ret === "error")
			throw new HttpException('Error: Wrong data types.', 400)
	}

	@Post('change_email')
	async changeEmail(@Body() body: EmailDTO) {
		if (typeof(body.email) != "string")
			throw new HttpException('Error: Wrong data types.', 400)
		let decoded = await this.usersService.validateUser(body.token)
		if (decoded === "error")
			throw new HttpException('Error: Wrong data types.', 400)
		if (!decoded)
			throw new HttpException('Error: You are not authentified.', 400)
		if (body.email.length > 254)
			throw new HttpException('Error: Email must not exceed 254 characters.', 400)
		let ret = await this.usersService.changeEmail(decoded.ft_id, body.email)
		if (ret === "error")
			throw new HttpException('Error: Wrong data types.', 400)
	}

	@Get('user_information')
	async getUsersInfo(@Query() query: { token: string, id: string }) {

		let decoded = await this.usersService.validateUser(query.token)
		if (decoded === "error")
			throw new HttpException('Error: Wrong data types.', 400)
		if (!decoded)
			throw new HttpException('Error: You are not authentified.', 400)
		if (await this.usersService.userExists(query.id) === "error")
			throw new HttpException('Error: Wrong data types.', 400)
		if (await this.usersService.userExists(query.id) === false) {
			throw new HttpException('Error: User does not exist.', 400);
		}
		let user = await this.usersService.getUsersInfos(query.id);
		if (user === "error")
			throw new HttpException('Error: Wrong data types.', 400)
		if (user)
			return user
		throw new HttpException('Error: User does not exist.', 400);
	}

	@Post('deblock_user')
	async deblockUser(@Body() body: BlockuserDTO) {
		let decoded = await this.usersService.validateUser(body.token)
		if (decoded === "error")
			throw new HttpException('Error: Wrong data types.', 400)
		if (!decoded)
			throw new HttpException('Error: You are not authentified.', 400)
		if (await this.usersService.userExists(body.block_id) === "error")
			throw new HttpException('Error: Wrong data types.', 400)
		if (await this.usersService.userExists(body.block_id) === false)
			throw new HttpException('Error: User does not exist.', 400)
		if (await this.usersService.isBlockedBy(decoded.ft_id, body.block_id) === "error")
			throw new HttpException('Error: Wrong data types.', 400)
		if (await this.usersService.isBlockedBy(decoded.ft_id, body.block_id) === false)
			throw new HttpException('Error: This user is not blocked.', 400)
		let ret = await this.usersService.deblockUser(decoded.ft_id, body.block_id);
		if (ret === "error")
			throw new HttpException('Error: Wrong data types.', 400)
	}

	@Get('friends')
	async getFriends(@Query() query: { token: string }) {
		let decoded = await this.usersService.validateUser(query.token)
		if (decoded === "error")
			throw new HttpException('Error: Wrong data types.', 400)
		if (!decoded)
			throw new HttpException('Error: You are not authentified.', 400);
		let ret = await this.usersService.getFriends(decoded.ft_id);
		if (ret === "error")
			throw new HttpException('Error: Wrong data types.', 400)
		return ret
	}

	@Get('wait_friends')
	async getWaitFriends(@Query() query: { token: string }) {
		let decoded = await this.usersService.validateUser(query.token)
		if (decoded === "error")
			throw new HttpException('Error: Wrong data types.', 400)
		if (!decoded)
			throw new HttpException('Error: You are not authentified.', 400);
		let ret = await this.usersService.getWaitFriends(decoded.ft_id);
		if (ret === "error")
			throw new HttpException('Error: Wrong data types.', 400)
		return ret
	}

	@Get('my_info')
	async myInfo(@Query() query: { token: string }) {
		let decoded = await this.usersService.validateUser(query.token)
		if (decoded === "error")
			throw new HttpException('Error: Wrong data types.', 400)
		if (!decoded)
			throw new HttpException('Error: You are not authentified.', 400);
		let infos = await this.usersService.getMyInfos(decoded.ft_id);
		if (infos === "error")
			throw new HttpException('Error: Wrong data types.', 400)
		if (infos)
			return infos
		throw new HttpException('Error: User does not exist.', 400);
	}

	@Get('is_block')
	async isUserBlocked(@Query() query: { token: string, id: string }) {
		let decoded = await this.usersService.validateUser(query.token)
		if (decoded === "error")
			throw new HttpException('Error: Wrong data types.', 400)
		if (!decoded)
			throw new HttpException('Error: You are not authentified.', 400);
		if (await this.usersService.userExists(query.id) === "error")
			throw new HttpException('Error: Wrong data types.', 400)
		if (await this.usersService.userExists(query.id) === false)
			throw new HttpException('Error: User does not exist.', 400);
		let ret = await this.usersService.isUserBlock(decoded.ft_id, query.id)
		if (ret === "error")
			throw new HttpException('Error: Wrong data types.', 400)
		return ret
	}

	@Get('is_friend')
	async isUserFriend(@Query() query: { token: string, id: string }) {
		let decoded = await this.usersService.validateUser(query.token)
		if (decoded === "error")
			throw new HttpException('Error: Wrong data types.', 400)
		if (!decoded)
			throw new HttpException('Error: You are not authentified.', 400);
		if (await this.usersService.userExists(query.id) === "error")
			throw new HttpException('Error: Wrong data types.', 400)
		if (await this.usersService.userExists(query.id) === false)
			throw new HttpException('Error: User does not exist.', 400);
		let ret = await this.usersService.isUserFriend(decoded.ft_id, query.id)
		if (ret === "error")
			throw new HttpException('Error: Wrong data types.', 400)
		return ret
	}

	@Get('is_waiting_friend')
	async isWaiting(@Query() query: { token: string, id: string }) {
		let decoded = await this.usersService.validateUser(query.token)
		if (decoded === "error")
			throw new HttpException('Error: Wrong data types.', 400)
		if (!decoded)
			throw new HttpException('Error: You are not authentified.', 400);
		if (await this.usersService.userExists(query.id) === "error")
			throw new HttpException('Error: Wrong data types.', 400)
		if (await this.usersService.userExists(query.id) === false)
			throw new HttpException('Error: User does not exist.', 400);
		let ret = await this.usersService.isUserWaitingFriend(decoded.ft_id, query.id)
		if (ret === "error")
			throw new HttpException('Error: Wrong data types.', 400)
		return ret
	}

	@Get('blocked_users')
	async blockedUsers(@Query() query: { token: string }) {
		let decoded = await this.usersService.validateUser(query.token)
		if (decoded === "error")
			throw new HttpException('Error: Wrong data types.', 400)
		if (!decoded)
			throw new HttpException('Error: You are not authentified.', 400);
		let ret = await this.usersService.blockedUsers(decoded.ft_id)
		if (ret === "error")
			throw new HttpException('Error: Wrong data types.', 400)
		return ret
	}

	@Get('get_game_history')
	async getGameHistory(@Query() query: { token: string, id: string }) {
		let decoded = await this.usersService.validateUser(query.token)
		if (decoded === "error")
			throw new HttpException('Error: Wrong data types.', 400)
		if (!decoded)
			throw new HttpException('Error: You are not authentified.', 400)
		if (await this.usersService.userExists(query.id) === "error")
			throw new HttpException('Error: Wrong data types.', 400)
		if (await this.usersService.userExists(query.id) === false)
			throw new HttpException('Error: User does not exist.', 400);
		let ret = await this.usersService.getGameHistory(query.id)
		if (ret === "error")
			throw new HttpException('Error: Wrong data types.', 400)
		return ret
	}
}

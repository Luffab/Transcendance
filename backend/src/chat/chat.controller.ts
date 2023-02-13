import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChangePswDTO, ChannelDTO, DeleteChanDTO, JoinChanDTO, LeaveChanDTO, MessageInChanDTO, UserInChanDTO, UserNotInChanDTO } from './dto/chat.dto';

@Controller('chat')
export class ChatController {
	constructor(
		private readonly chatService: ChatService,
	) {}

	@Get('channels')
	async getChannels(@Query() query: { token: string }) {
		return await this.chatService.getAllChannels(query.token);
	}

	@Get('users_for_dms')
	async getUsersForDMS(@Query() query: { token: string }) {
		let decoded = await this.chatService.validateUser(query.token)
		if (!decoded)
			return
		let usersToReturn = await this.chatService.getUsersForDMS(decoded.ft_id);	
		return usersToReturn;
	}

	@Get('direct_messages')
	async getDirectMessages(@Query() query: { token: string, discussionId: number }) {
		let decoded = this.chatService.validateUser(query.token)
		if (!decoded)
			return(console.log("getDM Error: User is not authentified."))
		if (await this.chatService.discussionExists(query.discussionId) === false)
			return(console.log("Error: Private discussion does not exist."))
		return await this.chatService.getDirectMessages(query.discussionId);
	}

	@Get('discussions')
	async getDiscussions(@Query() query: { token: string }) {
		let decoded = this.chatService.validateUser(query.token)
		if (!decoded)
			return(console.log("getDiscussions Error: User is not authentified."))
		return await this.chatService.getDiscussions(decoded.ft_id);
	}

	@Get('users')
	async getUsers(@Query() query: { token: string }) {
		return await this.chatService.getAllUsers(query.token);
	}

	@Get('users_in_chan')
	async getUsersInChan(@Query() query: { token: string, channel_id: number }) {
		let decoded = this.chatService.validateUser(query.token)
		if (!decoded)
			return(console.log("Error: You are not authentified"))
		if (await this.chatService.isUserInChan(decoded.ft_id, query.channel_id) === false)
			return(console.log("Error: You are not in this channel."))
		if (await this.chatService.isBannedInChan(decoded.ft_id, query.channel_id) === true)
			return(console.log("Error: You are banned from this channel."))
		let inChan = await this.chatService.getUsersInChan(query.channel_id);
		let usersToReturn = []
		for (let i = 0; i < inChan.length; i++) {
			let username = await this.chatService.getUsernameById(inChan[i].user_id)
			if (inChan[i].user_id != decoded.ft_id) {
				let json = {
					"ft_id": inChan[i].user_id,
					"username": username,
					"is_admin": inChan[i].is_admin,
					"is_owner": inChan[i].isowner,
					"is_banned": inChan[i].is_banned,
					"action": 1
				}
				usersToReturn.push(json)
			}
		}
		return usersToReturn;
	}

	@Post('create')
	async createChannel(@Body() body: ChannelDTO) {
		return await this.chatService.createChannel(body);
	}

	@Post('add_users')
	async addusers(@Body() body: UserInChanDTO) {
		return await this.chatService.addUserInChan(body);
	}

	@Get('get_users_not_in_chan')
	async getusersnotinchan(@Query() query: { token: string, channel_id: number }) {
		let notInChan = await this.chatService.getUserNotInChan(query);
		let usersToReturn = []
		for (let i = 0; i < notInChan.length; i++) {
			let isInvited = await this.chatService.isInvitedToChan(notInChan[i].ft_id, query.channel_id)
			let json = {
				"ft_id": notInChan[i].ft_id,
				"username": notInChan[i].username,
				"is_invited": isInvited
			}
			usersToReturn[i] = json
		}
		return usersToReturn;
	}

	@Post('change_password_of_chan')
	async changechanpassowrd(@Body() body: ChangePswDTO) {
		let decoded = this.chatService.validateUser(body.jwt)
		if (!decoded)
			return(console.log("Error: You are not authentified"))
		if (await this.chatService.channelExists(body.chanId) === false)
			return(console.log("Error: Channel does not exist."))
		if (await this.chatService.isUserInChan(decoded.ft_id, body.chanId) === false)
			return(console.log("Error: User is not in this channel."))
		if (await this.chatService.isOwner(decoded.ft_id, body.chanId) === false)
			return(console.log("Error: User is not the owner of this channel."))
		let ret = await this.chatService.changePassword(decoded.ft_id, body.chanId, body.password);
	}

	@Post('delete_channel')
	async delete_channel(@Body() body: DeleteChanDTO) {
		return await this.chatService.deletechannel(body);
	}

	@Get('channel_messages')
	async getchanmsg(@Query() query: { token: string, chan_id: number }) {
		return await this.chatService.getChanMsg(query);
	}

	@Post('join_channel')
	async joinchannel(@Body() body: JoinChanDTO) {
		return await this.chatService.joinChannel(body);
	}
}
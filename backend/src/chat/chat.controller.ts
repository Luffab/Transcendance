import { Body, Controller, Get, HttpCode, HttpException, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChangePswDTO, ChannelDTO, DeleteChanDTO, JoinChanDTO, LeaveChanDTO, MessageInChanDTO, UserInChanDTO, UserNotInChanDTO } from './dto/chat.dto';

@Controller('chat')
export class ChatController {
	constructor(
		private readonly chatService: ChatService,
	) {}

	@Get('channels')
	async getChannels(@Query() query: { token: string }) {
		let decoded = await this.chatService.validateUser(query.token)
		if (decoded === "error")
			throw new HttpException('Error: Wrong data types.', 500)
		if (!decoded)
			throw new HttpException('Error: You are not authentified.', 500)
		let ret = await this.chatService.getAllChannels(decoded.ft_id);
		if (ret === "error")
			throw new HttpException('Error: Wrong data types.', 500)
		return ret
	}

	@Get('users_for_dms')
	async getUsersForDMS(@Query() query: { token: string }) {
		let decoded = await this.chatService.validateUser(query.token)
		if (decoded === "error")
			throw new HttpException('Error: Wrong data types.', 500)
		if (!decoded)
			throw new HttpException('Error: You are not authentified.', 500)
		let usersToReturn = await this.chatService.getUsersForDMS(decoded.ft_id)
		if (usersToReturn === "error")
			throw new HttpException('Error: Wrong data types.', 500)
		return usersToReturn;
	}

	@Get('direct_messages')
	async getDirectMessages(@Query() query: { token: string, discussionId: number }) {
		let decoded = await this.chatService.validateUser(query.token)
		if (decoded === "error")
			throw new HttpException('Error: Wrong data types.', 500)
		if (!decoded)
			throw new HttpException('Error: You are not authentified.', 500)
		if (await this.chatService.discussionExists(query.discussionId) === "error")
			throw new HttpException('Error: Wrong data types.', 500)
		if (await this.chatService.discussionExists(query.discussionId) === false)
			throw new HttpException("Error: Private discussion does not exist.", 500)
		if (await this.chatService.isInDiscussion(decoded.ft_id, query.discussionId) === "error")
			throw new HttpException('Error: Wrong data types.', 500)
		if (await this.chatService.isInDiscussion(decoded.ft_id, query.discussionId) === false)
			throw new HttpException("Error: You are not part of that discussion.", 500)
		let ret = await this.chatService.getDirectMessages(query.discussionId);
		if (ret === "error")
			throw new HttpException('Error: Wrong data types.', 500)
		return ret
	}

	@Get('discussions')
	async getDiscussions(@Query() query: { token: string }) {
		let decoded = await this.chatService.validateUser(query.token)
		if (decoded === "error")
			throw new HttpException('Error: Wrong data types.', 500)
		if (!decoded)
			throw new HttpException('Error: You are not authentified.', 500)
		let ret = await this.chatService.getDiscussions(decoded.ft_id);
		if (ret === "error")
			throw new HttpException('Error: Wrong data types.', 500)
		return ret
	}

	@Get('users_in_chan')
	async getUsersInChan(@Query() query: { token: string, channel_id: number }) {
		let decoded = await this.chatService.validateUser(query.token)
		if (decoded === "error")
			throw new HttpException('Error: Wrong data types.', 500)
		if (!decoded)
			throw new HttpException('Error: You are not authentified.', 500)
		if (await this.chatService.channelExists(query.channel_id) === "error")
			throw new HttpException('Error: Wrong data types.', 500)
		if (await this.chatService.channelExists(query.channel_id) === false)
			throw new HttpException('Error: Channel does not exist.', 500)
		if (await this.chatService.isUserInChan(decoded.ft_id, query.channel_id) === "error")
			throw new HttpException('Error: Wrong data types.', 500)
		if (await this.chatService.isUserInChan(decoded.ft_id, query.channel_id) === false)
			throw new HttpException('Error: You are not in this channel.', 500)
		if (await this.chatService.isBannedInChan(decoded.ft_id, query.channel_id) === "error")
			throw new HttpException('Error: Wrong data types.', 500)
		if (await this.chatService.isBannedInChan(decoded.ft_id, query.channel_id) === true)
			throw new HttpException('Error: You are banned from this channel.', 500)
		let inChan
		if ((inChan = await this.chatService.getUsersInChan(query.channel_id)) === "error")
			throw new HttpException('Error: Wrong data types.', 500)
		let usersToReturn = []
		for (let i = 0; i < inChan.length; i++) {
			let username = await this.chatService.getUsernameById(inChan[i].user_id)
			if (typeof(username) != "string")
				throw new HttpException('Error: Wrong data types.', 500)
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
		return usersToReturn
	}

	@Get('get_users_not_in_chan')
	async getUsersNotInchan(@Query() query: { token: string, channel_id: number }) {
		let decoded = await this.chatService.validateUser(query.token)
		if (decoded === "error")
			throw new HttpException('Error: Wrong data types.', 500)
		if (!decoded)
			throw new HttpException('Error: You are not authentified.', 500)
		if (await this.chatService.channelExists(query.channel_id) === "error")
			throw new HttpException('Error: Wrong data types.', 500)
		if (await this.chatService.channelExists(query.channel_id) === false)
			throw new HttpException('Error: Channel does not exist.', 500)
		if (await this.chatService.isAdmin(decoded.ft_id, query.channel_id) === "error")
			throw new HttpException('Error: Wrong data types.', 500)
		if (await this.chatService.isAdmin(decoded.ft_id, query.channel_id) === false)
			throw new HttpException('Error: You are not admin in this channel.', 500)
		if (await this.chatService.isBannedInChan(decoded.ft_id, query.channel_id) === "error")
			throw new HttpException('Error: Wrong data types.', 500)
		if (await this.chatService.isBannedInChan(decoded.ft_id, query.channel_id) === true)
			throw new HttpException('Error: You are banned from this channel.', 500)
		let notInChan
		if ((notInChan = await this.chatService.getUsersNotInChan(query.channel_id)) === "error")
			throw new HttpException('Error: Wrong data types.', 500)
		let usersToReturn = []
		for (let i = 0; i < notInChan.length; i++) {
			let isInvited = await this.chatService.isInvitedToChan(notInChan[i], query.channel_id)
			if (isInvited === "error")
				throw new HttpException('Error: Wrong data types.', 500)
			let username = await this.chatService.getUsernameById(notInChan[i])
			if (typeof(username) != "string")
				throw new HttpException('Error: Wrong data types.', 500)
			let json = {
				"ft_id": notInChan[i],
				"username": username,
				"is_invited": isInvited
			}
			usersToReturn.push(json)
		}
		return usersToReturn;
	}


	@Get('channel_messages')
	async getChanMsg(@Query() query: { token: string, chan_id: number }) {
		let decoded = await this.chatService.validateUser(query.token)
		if (decoded === "error")
			throw new HttpException('Error: Wrong data types.', 500)
		if (!decoded)
			throw new HttpException('Error: You are not authentified.', 500)
		if (await this.chatService.channelExists(query.chan_id) === "error")
			throw new HttpException('Error: Wrong data types.', 500)
		if (await this.chatService.channelExists(query.chan_id) === false)
			throw new HttpException('Error: Channel does not exist.', 500)
		if (await this.chatService.isUserInChan(decoded.ft_id, query.chan_id) === "error")
			throw new HttpException('Error: Wrong data types.', 500)
		if (await this.chatService.isUserInChan(decoded.ft_id, query.chan_id) === false)
			throw new HttpException('Error: You are not in this channel.', 500)
		if (await this.chatService.isBannedInChan(decoded.ft_id, query.chan_id) === "error")
			throw new HttpException('Error: Wrong data types.', 500)
		if (await this.chatService.isBannedInChan(decoded.ft_id, query.chan_id) === true)
			throw new HttpException('Error: You are banned from this channel.', 500)
		let msgs =  await this.chatService.getChanMsg(decoded.ft_id, query.chan_id)
		if (msgs === "error")
			throw new HttpException('Error: Wrong data types.', 500)
		return msgs
	}
}
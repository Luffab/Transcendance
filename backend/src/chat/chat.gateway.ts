import { WebSocketGateway, SubscribeMessage, MessageBody, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, ConnectedSocket,} from '@nestjs/websockets';
import { ChatService } from './chat.service';
import { Server, Socket } from 'socket.io';
import { ChangePswDTO, ChannelDTO, JoinChanDTO, LeaveChanDTO } from './dto/chat.dto';
import { UserService } from 'src/users/services/user/user.service';
import { AddFriendDTO, BlockuserDTO, UserDTO } from 'src/users/dto/User.dto';
import { decode } from 'punycode';
import { send } from 'process';
import { User } from 'src/typeorm';
import UsersInChan from 'src/typeorm/entities/UserinChan';
import Channels from 'src/typeorm/entities/Channels';
import { use } from 'passport';

export interface msgFromClient {
	jwt: string;
	author: string;
	chanId: number;
	content: string;
}

export interface declineChannelDetails {
	token: string;
	chan_id: number;
}

export interface channelInvitationDetails {
	jwt: string;
	receiverId: string;
	chanId: number;
}

export interface banUserDetails {
	jwt: string;
	receiverId: string;
	chanId: number;
}

export interface muteUserDetails {
	jwt: string;
	receiverId: string;
	chanId: number;
	time: number;
}

export interface inviteToPlayDetails {
	jwt: string;
	receiverId: string;
	mode: string
}

export interface friendRequestAnswer {
	token: string;
	friend_id: string;
	answer: boolean;
}

export interface discussionDetails {
	jwt: string;
	receiverId: string;
}

export interface directMessage {
	jwt: string;
	discussionId: number;
	receiverId: string;
	content: string;
}

@WebSocketGateway({
	cors: {
		origine: '*',
	},
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
	@WebSocketServer()
	server: Server;

	constructor(private readonly chatService: ChatService, private readonly userService: UserService) {}

	async sendErrorMessage(socket: string, event: string, error: string) {
			this.server.to(socket).emit(event, error)
	}

	@SubscribeMessage('changePassword')
	async changePassowrd(@ConnectedSocket() socket: Socket, @MessageBody() body: ChangePswDTO) {
		console.log("\n\n--------------------|--------------------|--------------------| CHANGE PASSWORD |--------------------|--------------------|--------------------\n")
		if (typeof(body.chanId) != "number" || typeof(body.password) != "string" || typeof(body.jwt) != "string")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		let decoded = await this.chatService.validateUser(body.jwt)
		if (decoded === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if (!decoded)
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: You are not authentified."))
		if (await this.chatService.channelExists(body.chanId) === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if (await this.chatService.channelExists(body.chanId) === false)
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Channel does not exist."))
		if (await this.chatService.isUserInChan(decoded.ft_id, body.chanId) === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if (await this.chatService.isUserInChan(decoded.ft_id, body.chanId) === false)
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: User is not in this channel."))
		if (await this.chatService.isOwner(decoded.ft_id, body.chanId) === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if (await this.chatService.isOwner(decoded.ft_id, body.chanId) === false)
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: User is not the owner of this channel."))
		if (body.password.length > 0 && body.password.length < 5)
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Password should be at least 5 characters long."))
		if (body.password.length < 20)
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Password should not exceed 20 characters."))
		if (await this.chatService.changePassword(decoded.ft_id, body.chanId, body.password) === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		let notInChan = await this.chatService.getUsersNotInChan(body.chanId)
		if (notInChan === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		let targetedSockets = []
		for (let i = 0; i < notInChan.length; i++) {
			let tempTab = this.chatService.getSocketsByUser(notInChan[i])
			if (tempTab)
				targetedSockets.push(tempTab)
		}
		let chanName = await this.chatService.getChannelNameById(body.chanId)
		if (typeof(chanName) != "string")
				return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		let ownerId = await this.chatService.getOwnerIdById(body.chanId)
		if (ownerId === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		let chanType = await this.chatService.getChannelTypeById(body.chanId)
		if (chanType === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		let json = {
			"name": chanName,
			"owner_id": ownerId,
			"channel_type": chanType,
			"id": body.chanId,
			"is_admin": false,
			"is_in_chan": false,
			"is_owner": false,
			"is_banned": false,
			"is_selected": false,
			"color": 'none'
		}
		if (targetedSockets.length > 0) {
			for (let i = 0; i < targetedSockets.length; i++)
				this.server.to(targetedSockets[i]).emit('updateChannel', json)
		}
	}

	@SubscribeMessage('leaveChannel')
	async leaveChannel(@ConnectedSocket() socket: Socket, @MessageBody() details: LeaveChanDTO) {
		console.log("\n\n--------------------|--------------------|--------------------| LEAVE CHANNEL |--------------------|--------------------|--------------------\n")
		if (typeof(details.chanId) != "number" || typeof(details.jwt) != "string")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		let decoded = await this.chatService.validateUser(details.jwt)
		if (decoded === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if (!decoded)
			return(console.log("Error: You are not authentified."))
		let senderSockets = this.chatService.getSocketsByUser(decoded.ft_id)
		if (await this.chatService.channelExists(details.chanId) === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if (await this.chatService.channelExists(details.chanId) === false)
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Channel does not exist."))
		if (await this.chatService.isUserInChan(decoded.ft_id, details.chanId) === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if (await this.chatService.isUserInChan(decoded.ft_id, details.chanId) === false)
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: You are not in this channel."))
		let ret
		if ((ret = await this.chatService.leaveChannel(decoded.ft_id, details.chanId)) === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		let targetedUsers
		if ((targetedUsers = await this.chatService.getUsersInChan(details.chanId)) === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		let channel
		if ((channel = await this.chatService.getChannelById(details.chanId)) === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		let allUsers
		if ((allUsers = await this.chatService.getAllUsers()) === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		let targetedSockets = []
		let allSockets = []
		for (let i = 0; i < allUsers.length; i++) {
			let tempTab = this.chatService.getSocketsByUser(allUsers[i].ft_id)
			if (tempTab)
				allSockets.push(tempTab)
		}
		for (let i = 0; i < targetedUsers.length; i++) {
			let tempTab = this.chatService.getSocketsByUser(targetedUsers[i].user_id)
			if (tempTab)
				targetedSockets.push(tempTab)
		}
		if (ret.ownerLeft == true) {
			if (allSockets.length > 0) {
				for (let i = 0; i < allSockets.length; i++)
					this.server.to(allSockets[i]).emit('deleteChannel', details.chanId);
			}
		}
		else {
			if (ret.channelType === "private") {
				if (senderSockets)
					this.server.to(senderSockets).emit('deleteChannel', details.chanId);
			}
			else {
				let isBanned = await this.chatService.isBannedInChan(decoded.ft_id, details.chanId)
				if (isBanned === "error")
					return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
				let jsonToSender = {
					"name": channel.name,
					"owner_id": channel.owner_id,
					"channel_type": channel.channel_type,
					"id": details.chanId,
					"is_admin": false,
					"is_in_chan": false,
					"is_owner": false,
					"is_banned": isBanned
				}
				if (senderSockets)
					this.server.to(senderSockets).emit('updateChannel', jsonToSender);
			}
			let jsonToOther = {
				"ft_id": decoded.ft_id,
				"channel_id": details.chanId
			}
			if (targetedSockets.length > 0) {
				for (let i = 0; i < targetedSockets.length; i++) {
					this.server.to(targetedSockets[i]).emit('deleteUserInChan', jsonToOther);
				}
			}
		}
	}

	@SubscribeMessage('inviteToPlay')
	async inviteToPlay(@ConnectedSocket() socket: Socket, @MessageBody() details: inviteToPlayDetails) {
		console.log("\n\n--------------------|--------------------|--------------------| NEW GAME INVITATION |--------------------|--------------------|--------------------\n")
		if (typeof(details.receiverId) != "string" || typeof(details.jwt) != "string" || typeof(details.mode) != "string")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		let decoded = await this.chatService.validateUser(details.jwt)
		if (decoded === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if (!decoded)
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: You are not authentified."))
		if (await this.chatService.userExists(details.receiverId) === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if (await this.chatService.userExists(details.receiverId) === false)
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Invited user does not exist."))
		if (await this.chatService.isBlockedBy(details.receiverId, decoded.ft_id) === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if (await this.chatService.isBlockedBy(details.receiverId, decoded.ft_id) === true)
			return
		let invitation
		if ((invitation = await this.chatService.createGameInvitation(decoded.ft_id, details.receiverId, details.mode)) === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		let username = await this.chatService.getUsernameById(decoded.ft_id)
		if (typeof(username) != "string")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		let json = {
			"sender_id": invitation.sender_id,
			"sender_username": username,
			"mode": details.mode
		}
		let targetedSockets = this.chatService.getSocketsByUser(invitation.receiver_id)
		if (targetedSockets)
			this.server.to(targetedSockets).emit('newGameInvitation', json);
	}

	@SubscribeMessage('sendDirectMessage')
	async sendDirectMessage(@ConnectedSocket() socket: Socket, @MessageBody() msg: directMessage) {
		console.log("\n\n--------------------|--------------------|--------------------| NEW DIRECT MESSAGE |--------------------|--------------------|--------------------\n")
		if (typeof(msg.content) != "string" || typeof(msg.jwt) != "string" || typeof(msg.receiverId) != "string" || typeof(msg.discussionId) != "number")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		let decoded = await this.chatService.validateUser(msg.jwt)
		if (decoded === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if (!decoded)
			return(console.log("Error: You are not authentified."))
		let senderSockets = this.chatService.getSocketsByUser(decoded.ft_id)
		if (await this.chatService.discussionExists(msg.discussionId) === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if (await this.chatService.discussionExists(msg.discussionId) === false)
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Private discussion does not exist."))
		if (await this.chatService.isBlockedBy(msg.receiverId, decoded.ft_id) === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if (await this.chatService.isBlockedBy(msg.receiverId, decoded.ft_id) === true)
			return
		if (!msg.content)
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Your message is empty."))
		if (msg.content.length > 1000)
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Your message is too long. Maximum characters is 1000."))
		let newMessage
		if ((newMessage = await this.chatService.createDirectMessage(decoded.ft_id, msg.discussionId, msg.content)) === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		let username = await this.chatService.getUsernameById(newMessage.author)
		if (typeof(username) != "string")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		let messageToSend = {
			"id": newMessage.id,
			"author": newMessage.author,
			"author_name": username,
			"discussion_id": newMessage.discussion_id,
			"content": newMessage.content
		}
		let targetedSockets = this.chatService.getSocketsByUser(msg.receiverId)
		if (targetedSockets)
			this.server.to(targetedSockets).emit('newDirectMessage', messageToSend);
		if(senderSockets)
			this.server.to(senderSockets).emit('newDirectMessage', messageToSend);
	}

	@SubscribeMessage('createDiscussion')
	async createDiscussion(@ConnectedSocket() socket: Socket, @MessageBody() details: discussionDetails) {
		console.log("\n\n--------------------|--------------------|--------------------| NEW DISCUSSION |--------------------|--------------------|--------------------\n")
		if (typeof(details.jwt) != "string" || typeof(details.receiverId) != "string")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		let decoded = await this.chatService.validateUser(details.jwt)
		if (decoded === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if (!decoded)
			return(console.log("Error: You are not authentified."))
		let senderSockets = this.chatService.getSocketsByUser(decoded.ft_id)
		if (await this.chatService.discussionAlreadyExists(decoded.ft_id, details.receiverId) === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if (await this.chatService.discussionAlreadyExists(decoded.ft_id, details.receiverId) === true)
			return(this.sendErrorMessage(socket.id, "receiveError", "Error: A discussion between you and the targeted user already exists."))
		if (await this.chatService.userExists(details.receiverId) === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if (await this.chatService.userExists(details.receiverId) === false)
			return(this.sendErrorMessage(socket.id, "receiveError", "Error: Targeted user does not exist."))
		if (await this.chatService.isBlockedBy(decoded.ft_id, details.receiverId) === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if (await this.chatService.isBlockedBy(decoded.ft_id, details.receiverId) === true)
			return
		let newDiscussion
		if ((newDiscussion = await this.chatService.createDiscussion(decoded.ft_id, details.receiverId)) === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		let username2 = await this.chatService.getUsernameById(details.receiverId)
		if (typeof(username2) != "string")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		let toSendtoSender = {
			"id": newDiscussion.id,
			"other_user": newDiscussion.user2,
			"other_user_name": username2
		}
		let username1 = await this.chatService.getUsernameById(decoded.ft_id)
		if (typeof(username1) != "string")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		let toSendtoOther = {
			"id": newDiscussion.id,
			"other_user": newDiscussion.user1,
			"other_user_name": username1
		}
		if (senderSockets)
			this.server.to(senderSockets).emit('newDiscussion', toSendtoSender)
		const otherSockets = this.chatService.getSocketsByUser(newDiscussion.user2)
		if (otherSockets)
			this.server.to(otherSockets).emit('newDiscussion', toSendtoOther);
	}

	@SubscribeMessage('muteUser')
	async muteUser(@ConnectedSocket() socket: Socket, @MessageBody() details: muteUserDetails) {
		console.log("\n\n--------------------|--------------------|--------------------| MUTE USER |--------------------|--------------------|--------------------\n")
		if (typeof(details.jwt) != "string" || typeof(details.receiverId) != "string" || typeof(details.chanId) != "number" || typeof(details.time) != "number")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		let decoded = await this.chatService.validateUser(details.jwt)
		if (decoded === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if (!decoded)
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: You are not authentified."))
		if (await this.chatService.userExists(details.receiverId) === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if (await this.chatService.userExists(details.receiverId) === false)
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Targeted user does not exist."))
		if (await this.chatService.userExists(details.receiverId) === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if (await this.chatService.userExists(details.receiverId) === false)
			return(this.sendErrorMessage(socket.id, "receiveError", "Error: Channel does not exist."))
		if (await this.chatService.isAdmin(decoded.ft_id, details.chanId) === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if (await this.chatService.isAdmin(decoded.ft_id, details.chanId) === false)
			return(this.sendErrorMessage(socket.id, "receiveError", "Error: You are not admin in this channel."))
		if (await this.chatService.isUserInChan(details.receiverId, details.chanId) === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if (await this.chatService.isUserInChan(details.receiverId, details.chanId) === false)
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Targeted user is not in this channel."))
		if (decoded.ft_id === details.receiverId)
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: You can not ban yourself."))
		if ((await this.chatService.isAdmin(details.receiverId, details.chanId) === "error") || (await this.chatService.isOwner(decoded.ft_id, details.chanId) === "error"))
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if ((await this.chatService.isAdmin(details.receiverId, details.chanId) === true) && (await this.chatService.isOwner(decoded.ft_id, details.chanId) === false))
			return(this.sendErrorMessage(socket.id, "receiveError", "Error: Targeted user is an admin in this channel and only the channel owner can perform such operations."))
		if (await this.chatService.isBannedInChan(details.receiverId, details.chanId) === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if (await this.chatService.isBannedInChan(details.receiverId, details.chanId) === true)
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Targeted user is already banned in this channel."))
		if (details.time < 1)
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Mute duration is minimum 1 minute."))
		if (details.time > 525000)
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Mute duration is maximum 525000 minutes (365 days)."))
		let ret = await this.chatService.muteUser(details.receiverId, details.chanId, details.time)
		if (ret === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
	}

	@SubscribeMessage('banUser')
	async banUser(@ConnectedSocket() socket: Socket, @MessageBody() details: banUserDetails) {
		console.log("\n\n--------------------|--------------------|--------------------| BAN USER |--------------------|--------------------|--------------------\n")
		if (typeof(details.jwt) != "string" || typeof(details.receiverId) != "string" || typeof(details.chanId) != "number")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		let decoded = await this.chatService.validateUser(details.jwt)
		if (!decoded)
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: You are not authentified."))
		if (await this.chatService.userExists(details.receiverId) === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if (await this.chatService.userExists(details.receiverId) === false)
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Targeted user does not exist."))
		if (await this.chatService.channelExists(details.chanId) === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if (await this.chatService.channelExists(details.chanId) === false)
			return(this.sendErrorMessage(socket.id, "receiveError", "Error: Channel does not exist."))
		if (await this.chatService.isAdmin(decoded.ft_id, details.chanId) === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if (await this.chatService.isAdmin(decoded.ft_id, details.chanId) === false)
			return(this.sendErrorMessage(socket.id, "receiveError", "Error: You are not admin in this channel."))
		if (await this.chatService.isUserInChan(details.receiverId, details.chanId) === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if (await this.chatService.isUserInChan(details.receiverId, details.chanId) === false)
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Targeted user is not in this channel."))
		if (decoded.ft_id === details.receiverId)
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: You can not ban yourself."))
		if ((await this.chatService.isAdmin(details.receiverId, details.chanId) === "error") || (await this.chatService.isOwner(decoded.ft_id, details.chanId) === "error"))
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if ((await this.chatService.isAdmin(details.receiverId, details.chanId) === true) && (await this.chatService.isOwner(decoded.ft_id, details.chanId) === false))
			return(this.sendErrorMessage(socket.id, "receiveError", "Error: Targeted user is an admin in this channel and only the channel owner can perform such operations."))
		if (await this.chatService.isBannedInChan(details.receiverId, details.chanId) === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if (await this.chatService.isBannedInChan(details.receiverId, details.chanId) === true)
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Targeted user is already banned in this channel."))
		let ret = await this.chatService.banUser(details.receiverId, details.chanId)
		if (ret === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		let username = await this.chatService.getUsernameById(details.receiverId)
		if (typeof(username) != "string")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		let	isAdmin = await this.chatService.isAdmin(details.receiverId, details.chanId)
		if (isAdmin === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		let json = {
			"ft_id": details.receiverId,
			"username": username,
			"is_admin": isAdmin,
			"is_owner": false,
			"is_banned": true,
			"action": 1
		}
		let bannedSockets = this.chatService.getSocketsByUser(details.receiverId)
		if (bannedSockets)
			this.server.to(bannedSockets).emit('deleteChannel', details.chanId);
		let targetedUsers
		if ((targetedUsers = await this.chatService.getUsersInChan(details.chanId)) === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		let targetedSockets = []
		for (let i = 0; i < targetedUsers.length; i++) {
			if (targetedUsers[i].user_id != details.receiverId) {
				let tempTab = this.chatService.getSocketsByUser(targetedUsers[i].user_id)
				if (tempTab)
					targetedSockets.push(tempTab)
			}
		}
		if (targetedSockets.length > 0) {
			for (let i = 0; i < targetedSockets.length; i++) {
				this.server.to(targetedSockets[i]).emit('updateUserInChan', json);
			}
		}
	}

	@SubscribeMessage('unbanUser')
	async unbanUser(@ConnectedSocket() socket: Socket, @MessageBody() details: banUserDetails) {
		console.log("\n\n--------------------|--------------------|--------------------| UNBAN USER |--------------------|--------------------|--------------------\n")
		if (typeof(details.jwt) != "string" || typeof(details.receiverId) != "string" || typeof(details.chanId) != "number")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		let decoded = await this.chatService.validateUser(details.jwt)
		if (decoded === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if (!decoded)
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: You are not authentified."))
		if (await this.chatService.userExists(details.receiverId) === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if (await this.chatService.userExists(details.receiverId) === false)
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Targeted user does not exist."))
		if (await this.chatService.channelExists(details.chanId) === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if (await this.chatService.channelExists(details.chanId) === false)
			return(this.sendErrorMessage(socket.id, "receiveError", "Error: Channel does not exist."))
		if (await this.chatService.isAdmin(decoded.ft_id, details.chanId) === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if (await this.chatService.isAdmin(decoded.ft_id, details.chanId) === false)
			return(this.sendErrorMessage(socket.id, "receiveError", "Error: You are not admin in this channel."))
		if (await this.chatService.isUserInChan(details.receiverId, details.chanId) === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if (await this.chatService.isUserInChan(details.receiverId, details.chanId) === false)
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Targeted user is not in this channel."))
		if (decoded.ft_id === details.receiverId)
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: You can not unban yourself."))
		if ((await this.chatService.isAdmin(details.receiverId, details.chanId) === "error") || (await this.chatService.isOwner(decoded.ft_id, details.chanId) === "error"))
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if ((await this.chatService.isAdmin(details.receiverId, details.chanId) === true) && (await this.chatService.isOwner(decoded.ft_id, details.chanId) === false))
			return(this.sendErrorMessage(socket.id, "receiveError", "Error: Targeted user is an admin in this channel and only the channel owner can perform such operations."))
		if (await this.chatService.isBannedInChan(details.receiverId, details.chanId) === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if (await this.chatService.isBannedInChan(details.receiverId, details.chanId) === false)
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Targeted user is not banned in this channel."))
		let ret = await this.chatService.unbanUser(details.receiverId, details.chanId)
		if (ret === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		let username = await this.chatService.getUsernameById(details.receiverId)
		if (typeof(username) != "string")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		let	isAdmin = await this.chatService.isAdmin(details.receiverId, details.chanId)
		if (isAdmin === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		let json = {
			"ft_id": details.receiverId,
			"username": username,
			"is_admin": isAdmin,
			"is_owner": false,
			"is_banned": false
		}
		let chanName = await this.chatService.getChannelNameById(details.chanId)
		if (typeof(chanName) != "string")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		let ownerId = await this.chatService.getOwnerIdById(details.chanId)
		if (ownerId === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		let chanType = await this.chatService.getChannelTypeById(details.chanId)
		if (chanType === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		let isAdmin2
		if ((isAdmin2 = await this.chatService.isAdmin(details.receiverId, details.chanId)) === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		let youAreUnbanned = {
			"name": chanName,
			"owner_id": ownerId,
			"channel_type": chanType,
			"id": details.chanId,
			"is_admin": isAdmin2,
			"is_in_chan": true,
			"is_owner": false,
			"is_banned": false,
			"is_selected": false,
			"color": "none"
		}
		let unbannedSockets = this.chatService.getSocketsByUser(details.receiverId)
		if (unbannedSockets)
			this.server.to(unbannedSockets).emit('addChannel', youAreUnbanned);
		let targetedUsers
		if ((targetedUsers = await this.chatService.getUsersInChan(details.chanId)) === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		let targetedSockets = []
		for (let i = 0; i < targetedUsers.length; i++) {
			if (targetedUsers[i].user_id != details.receiverId) {
				let tempTab = this.chatService.getSocketsByUser(targetedUsers[i].user_id)
				targetedSockets.push(tempTab)
			}
		}
		if (targetedSockets.length > 0) {
			for (let i = 0; i < targetedSockets.length; i++) {
				this.server.to(targetedSockets[i]).emit('updateUserInChan', json);
			}
		}
	}

	@SubscribeMessage('giveAdminRole')
	async setAsAdmin(@ConnectedSocket() socket: Socket, @MessageBody() details: banUserDetails) {
		console.log("\n\n--------------------|--------------------|--------------------| SET AS ADMIN |--------------------|--------------------|--------------------\n")
		if (typeof(details.jwt) != "string" || typeof(details.receiverId) != "string" || typeof(details.chanId) != "number")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		let decoded = await this.chatService.validateUser(details.jwt)
		if (decoded === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if (!decoded)
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: You are not authentified."))
		if (await this.chatService.userExists(details.receiverId) === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if (await this.chatService.userExists(details.receiverId) === false)
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Targeted user does not exist."))
		if (await this.chatService.channelExists(details.chanId) === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if (await this.chatService.channelExists(details.chanId) === false)
			return(this.sendErrorMessage(socket.id, "receiveError", "Error: Channel does not exist."))
		if (await this.chatService.isOwner(decoded.ft_id, details.chanId) === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if (await this.chatService.isOwner(decoded.ft_id, details.chanId) === false)
			return(this.sendErrorMessage(socket.id, "receiveError", "Error: You are not the channel owner."))
		if (await this.chatService.isUserInChan(details.receiverId, details.chanId) === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if (await this.chatService.isUserInChan(details.receiverId, details.chanId) === false)
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Targeted user is not in this channel."))
		if (decoded.ft_id === details.receiverId)
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: You can not set yourself as admin."))
		if (await this.chatService.isBannedInChan(details.receiverId, details.chanId) === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if (await this.chatService.isBannedInChan(details.receiverId, details.chanId) === true)
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Targeted user is banned in this channel."))
		if (await this.chatService.isAdmin(details.receiverId, details.chanId) === true)
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if (await this.chatService.isAdmin(details.receiverId, details.chanId) === true)
			return(this.sendErrorMessage(socket.id, "receiveError", "Error: Targeted user is already an admin in this channel."))
		let ret = await this.chatService.setAsAdmin(details.receiverId, details.chanId)
		if (ret === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		let username = await this.chatService.getUsernameById(details.receiverId)
		let json = {
			"ft_id": details.receiverId,
			"username": username,
			"is_admin": true,
			"is_owner": false,
			"is_banned": false
		}
		let targetedUsers
		if ((targetedUsers = await this.chatService.getUsersInChan(details.chanId)) === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		let targetedSockets = []
		for (let i = 0; i < targetedUsers.length; i++) {
			let tempTab = this.chatService.getSocketsByUser(targetedUsers[i].user_id)
			if (tempTab)
				targetedSockets.push(tempTab)
		}
		if (targetedSockets.length > 0) {
			for (let i = 0; i < targetedSockets.length; i++) {
				this.server.to(targetedSockets[i]).emit('updateUserInChan', json);
			}
		}
		let newAdminSockets = this.chatService.getSocketsByUser(details.receiverId)
		if (newAdminSockets) {
			let chanName
			if ((chanName = await this.chatService.getChannelNameById(details.chanId)) === "error")
				return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
			let ownerId = await this.chatService.getOwnerIdById(details.chanId)
			if (ownerId === "error")
				return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
			let chanType = await this.chatService.getChannelTypeById(details.chanId)
			if (chanType === "error")
				return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
			let json = {
				"name": chanName,
				"owner_id": ownerId,
				"channel_type": chanType,
				"id": details.chanId,
				"is_admin": true,
				"is_in_chan": true,
				"is_owner": false,
				"is_banned": false,
				"is_selected": false,
				"color": "none"
			}
			this.server.to(newAdminSockets).emit('updateChannel', json);
		}
	}

	@SubscribeMessage('declineChannelInvitation')
	async declineChannelInvitation(@ConnectedSocket() socket: Socket, @MessageBody() details: declineChannelDetails) {
		console.log("\n\n--------------------|--------------------|--------------------| CHANNEL INVITATION DECLINED |--------------------|--------------------|--------------------\n")
		if (typeof(details.token) != "string" || typeof(details.chan_id) != "number")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		let decoded = await this.chatService.validateUser(details.token)
		if (decoded === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if (!decoded)
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: You are not authentified."))
		if (await this.chatService.channelExists(details.chan_id) === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if (await this.chatService.channelExists(details.chan_id) === false)
			return(this.sendErrorMessage(socket.id, "receiveError", "Error: Channel does not exist."))
		let ret = await this.chatService.deleteChannelInvitations(decoded.ft_id, details.chan_id)
		if (ret === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
	}

	@SubscribeMessage('joinChannel')
	async joinChannel(@ConnectedSocket() socket: Socket, @MessageBody() details: JoinChanDTO) {
		console.log("\n\n--------------------|--------------------|--------------------| JOINING CHANNEL |--------------------|--------------------|--------------------\n")
		if (typeof(details.token) != "string" || typeof(details.chan_id) != "number" || typeof(details.password) != "string")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		let decoded = await this.chatService.validateUser(details.token)
		if (decoded === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if (!decoded)
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: You are not authentified."))
		const senderSockets = this.chatService.getSocketsByUser(decoded.ft_id)
		if (await this.chatService.channelExists(details.chan_id) === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if (await this.chatService.channelExists(details.chan_id) === false)
			return(this.sendErrorMessage(socket.id, "receiveError", "Error: Channel does not exist."))
		if (await this.chatService.isBannedInChan(decoded.ft_id, details.chan_id) === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if (await this.chatService.isBannedInChan(decoded.ft_id, details.chan_id) === true)
			return(this.sendErrorMessage(socket.id, "receiveError", "Error: You are banned in this channel."))
		let channel
		if ((channel= await this.chatService.joinChannel(details)) === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		let chanName = await this.chatService.getChannelNameById(details.chan_id)
		if (typeof(chanName) != "string")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		let ownerId = await this.chatService.getOwnerIdById(details.chan_id)
		if (ownerId === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		let chanType = await this.chatService.getChannelTypeById(details.chan_id)
		if (chanType === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if (channel.status === "OK") {
			let jsonToOwner = {
				"name": chanName,
				"owner_id": ownerId,
				"channel_type": chanType,
				"id": details.chan_id,
				"is_admin": false,
				"is_in_chan": true,
				"is_owner": false,
				"is_banned": false
			}
			if (chanType === "private")
				this.chatService.deleteChannelInvitations(decoded.ft_id, details.chan_id)
			if (senderSockets)
				this.server.to(senderSockets).emit('channelJoined', jsonToOwner)
			let otherUsers
			if ((otherUsers = await this.chatService.getUsersInChan(details.chan_id)) === "error")
				return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
			let otherSockets = []
			for (let i = 0; i < otherUsers.length; i++) {
				if (otherUsers[i].user_id != decoded.ft_id) {
					let tempTab = this.chatService.getSocketsByUser(otherUsers[i].user_id)
					if (tempTab)
						otherSockets.push(tempTab)
				}
			}
			let username = await this.chatService.getUsernameById(decoded.ft_id)
			if (typeof(username) != "string")
				return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
			let isAdmin = await this.chatService.isAdmin(decoded.ft_id, details.chan_id)
			if (isAdmin === "error")
				return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
			let tmpJson = {
				"ft_id": decoded.ft_id,
				"username": username,
				"is_admin": isAdmin,
				"is_owner": false,
				"is_banned": false,
			}
			let jsonToOther = {
				"channel_id": details.chan_id,
				"user": tmpJson
			}
			if (otherSockets.length > 0) {
				for (let i = 0; i < otherSockets.length; i++)
					this.server.to(otherSockets[i]).emit('newUserInChan', jsonToOther);
			}
		}
		else
			this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong password.")
	}

	@SubscribeMessage('createChannel')
	async createChannel(@ConnectedSocket() socket: Socket, @MessageBody() details: ChannelDTO) {
		console.log("\n\n--------------------|--------------------|--------------------| NEW CHANNEL REQUESTED |--------------------|--------------------|--------------------\n")
		if (typeof(details.token) != "string" || typeof(details.channel_name) != "string" || typeof(details.channel_type) != "string" || typeof(details.password) != "string")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		let decoded = await this.chatService.validateUser(details.token)
		if (decoded === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if (!decoded)
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: You are not authentified."))
		let ownerSockets = this.chatService.getSocketsByUser(decoded.ft_id)
		if (await this.chatService.channelNameExists(details.channel_name) === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if (await this.chatService.channelNameExists(details.channel_name) === true)
			return(this.sendErrorMessage(socket.id, "receiveError", "Error: Channel name is already taken."))
		if (details.channel_type === "password") {
			if (details.password.length < 5)
				return (this.sendErrorMessage(socket.id, "receiveError", "Error: Password should be at least 5 characters long."))
			if (details.password.length > 20)
				return (this.sendErrorMessage(socket.id, "receiveError", "Error: Password should not exceed 20 characters."))
		}
		if (details.channel_type != "password" && details.password.length > 0)
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: No password should be specified when creating a public or private channel."))
		if (details.channel_name.length < 3)
			return(this.sendErrorMessage(socket.id, "receiveError", "Error: Channel name is too short. A minimum of 3 characters is required."))
		if (details.channel_name.length > 20)
			return(this.sendErrorMessage(socket.id, "receiveError", "Error: Channel name is too long. Maximum characters is 20."))
		let newChannel
		if ((newChannel = await this.chatService.createChannel(decoded.ft_id, details.channel_name, details.channel_type, details.password)) === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		let toSendtoOwner = {
			"name": newChannel.name,
			"owner_id": newChannel.owner_id,
			"channel_type": newChannel.channel_type,
			"id": newChannel.id,
			"is_admin": true,
			"is_in_chan": true,
			"is_owner": true,
			"is_banned": false,
			"is_selected": false,
			"color": "none"
		}
		if (ownerSockets)
			this.server.to(ownerSockets).emit('channelCreated', toSendtoOwner)
		if (newChannel.channel_type != "private") {
			let toSendtoOther = {
				"name": newChannel.name,
				"owner_id": newChannel.owner_id,
				"channel_type": newChannel.channel_type,
				"id": newChannel.id,
				"is_admin": false,
				"is_in_chan": false,
				"is_owner": false,
				"is_banned": false,
				"is_selected": false,
				"color": "none"
			}
			const otherSockets = this.chatService.getAllOtherSockets(newChannel.owner_id)
			if (otherSockets.length > 0) {
				for (let i = 0; i < otherSockets.length; i++)
					this.server.to(otherSockets[i]).emit('channelCreated', toSendtoOther);
			}
		}
	}

	@SubscribeMessage('sendFriendRequest')
	async sendFriendRequest(@ConnectedSocket() socket: Socket, @MessageBody() details: AddFriendDTO) {
		console.log("\n\n--------------------|--------------------|--------------------| NEW FRIEND REQUEST |--------------------|--------------------|--------------------\n")
		if (typeof(details.token) != "string" || typeof(details.friend_id) != "string")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		let decoded = await this.chatService.validateUser(details.token)
		if (decoded === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if (!decoded)
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: You are not authentified."))
		if (await this.chatService.userExists(details.friend_id) === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if (await this.chatService.userExists(details.friend_id) === false)
			return(this.sendErrorMessage(socket.id, "receiveError", "Error: This user does not exist."))
		if (await this.chatService.areFriends(decoded.ft_id, details.friend_id) === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if (await this.chatService.areFriends(decoded.ft_id, details.friend_id) === true)
			return(this.sendErrorMessage(socket.id, "receiveError", "Error: You are already friend with targeted user."))
		if (await this.chatService.friendRequestIsWaiting(decoded.ft_id, details.friend_id) === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if (await this.chatService.friendRequestIsWaiting(decoded.ft_id, details.friend_id) === true)
			return(this.sendErrorMessage(socket.id, "receiveError", "Error: You or targeted user need to accept or refuse the already existing friend request."))
		if (await this.chatService.isBlockedBy(decoded.ft_id, details.friend_id) === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if (await this.chatService.isBlockedBy(decoded.ft_id, details.friend_id) === true)
			return
		const targetedSockets = this.chatService.getSocketsByUser(details.friend_id)
		let username = await this.chatService.getUsernameById(decoded.ft_id)
		if (typeof(username) != "string")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		let isBlocked = await this.chatService.isBlockedBy(details.friend_id, decoded.ft_id)
		if (isBlocked === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if (isBlocked == false) {
			this.userService.addFriend(decoded.ft_id, details.friend_id)
			let json = {
				ft_id: decoded.ft_id,
				username: username
			}
			if (targetedSockets)
				this.server.to(targetedSockets).emit('receiveFriendRequest', json)
		}
	}

	@SubscribeMessage('removeFriend')
	async removeFriend(@ConnectedSocket() socket: Socket, @MessageBody() details: AddFriendDTO) {
		console.log("\n\n--------------------|--------------------|--------------------| NEW REMOVE REQUEST |--------------------|--------------------|--------------------\n")
		if (typeof(details.token) != "string" || typeof(details.friend_id) != "string")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		let decoded = await this.chatService.validateUser(details.token)
		if (decoded === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if (!decoded)
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: You are not authentified."))
		let senderSockets = this.chatService.getSocketsByUser(decoded.ft_id)
		if (await this.chatService.userExists(details.friend_id) === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if (await this.chatService.userExists(details.friend_id) === false)
			return(this.sendErrorMessage(socket.id, "receiveError", "Error: This user does not exist."))
		if (await this.chatService.areFriends(decoded.ft_id, details.friend_id) === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if (await this.chatService.areFriends(decoded.ft_id, details.friend_id) === false)
			return(this.sendErrorMessage(socket.id, "receiveError", "Error: You are not friend with targeted user."))
		if (await this.chatService.friendRequestIsWaiting(decoded.ft_id, details.friend_id) === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if (await this.chatService.friendRequestIsWaiting(decoded.ft_id, details.friend_id) === true)
			return(this.sendErrorMessage(socket.id, "receiveError", "Error: You or targeted user need to accept or refuse the already existing friend request."))
		let targetedSockets = this.chatService.getSocketsByUser(details.friend_id)
		let username = await this.chatService.getUsernameById(decoded.ft_id)
		if (typeof(username) != "string")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		this.userService.removeFriend(decoded.ft_id, details.friend_id)
		let json = {
			ft_id: decoded.ft_id,
			username: username
		}
		let senderUsername = await this.chatService.getUsernameById(details.friend_id)
		if (typeof(senderUsername) != "string")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		let json2 = {
			ft_id: details.friend_id,
			username: senderUsername
		}
		if (targetedSockets)
			this.server.to(targetedSockets).emit('removeFriendRequest', json)
		if (senderSockets)
			this.server.to(senderSockets).emit('removeFriendRequest', json2)
	}

	@SubscribeMessage('friendRequestResponse')
	async getFriendRequestResponse(@ConnectedSocket() socket: Socket, @MessageBody() details: friendRequestAnswer) {
		console.log("\n\n--------------------|--------------------|--------------------| NEW FRIEND REQUEST RESPONSE |--------------------|--------------------|--------------------\n")
		if (typeof(details.token) != "string" || typeof(details.friend_id) != "string" || typeof(details.answer) != "boolean")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		let decoded = await this.chatService.validateUser(details.token)
		if (decoded === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if (!decoded)
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: You are not authentified."))
		let senderSockets = this.chatService.getSocketsByUser(decoded.ft_id)
		if (await this.chatService.userExists(details.friend_id) === "error")
		if (await this.chatService.userExists(details.friend_id) === false)
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Accepted or refused user does not exist."))
		if (await this.chatService.isBlockedBy(details.friend_id, decoded.ft_id) === "error")
		if (await this.chatService.isBlockedBy(details.friend_id, decoded.ft_id) === true) {
			if (senderSockets)
				this.server.to(senderSockets).emit('receiveBlockedError', details.friend_id)
		}
		let targetedSockets = this.chatService.getSocketsByUser(details.friend_id)
		let username = await this.chatService.getUsernameById(decoded.ft_id)
		if (typeof(username) != "string")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if (details.answer === true) {
			this.userService.acceptFriend(decoded.ft_id, details.friend_id)
			let status = await this.chatService.getStatusById(decoded.ft_id)
			if (status === "error")
				return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
			let json = {
				ft_id: decoded.ft_id,
				username: username,
				status: status
			}
			if (targetedSockets)
				this.server.to(targetedSockets).emit('receiveFriendRequestAnswer', json)
			let sendeUsername = await this.chatService.getUsernameById(details.friend_id)
			if (typeof(sendeUsername) != "string")
				return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
			let status2 = await this.chatService.getStatusById(details.friend_id)
			if (status2 === "error")
				return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
			let json2 = {
				ft_id: details.friend_id,
				username: sendeUsername,
				status: status2
			}
			if (senderSockets)
				this.server.to(senderSockets).emit('receiveMyFriendRequestAnswer', json2)
		}
		else {
			let sendeUsername = await this.chatService.getUsernameById(details.friend_id)
			if (typeof(sendeUsername) != "string")
				return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
			let json3 = {
				ft_id: details.friend_id,
				username: sendeUsername
			}
			if (senderSockets)
				this.server.to(senderSockets).emit('receiveMyFriendRequestFailed', json3)
			if (targetedSockets)
				this.server.to(targetedSockets).emit('receiveMyFriendRequestFailed', json3)
			let ret = await this.userService.removeRelation(details.friend_id, decoded.ft_id)
			if (ret === "error")
				return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		}
	}

	@SubscribeMessage('inviteToChannel')
	async inviteToChannel(@ConnectedSocket() socket: Socket, @MessageBody() details: channelInvitationDetails) {
		console.log("\n\n--------------------|--------------------|--------------------| NEW CHANNEL INVITATION |--------------------|--------------------|--------------------\n")
		if (typeof(details.jwt) != "string" || typeof(details.receiverId) != "string" || typeof(details.chanId) != "number")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		let decoded = await this.chatService.validateUser(details.jwt)
		if (decoded === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if (!decoded)
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: You are not authentified."))
		if (await this.chatService.userExists(details.receiverId) === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if (await this.chatService.userExists(details.receiverId) === false)
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Invited user does not exist."))
		if (await this.chatService.channelExists(details.chanId) === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if (await this.chatService.channelExists(details.chanId) === false)
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Channel does not exist."))
		if (await this.chatService.isAdmin(decoded.ft_id, details.chanId) === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if (await this.chatService.isAdmin(decoded.ft_id, details.chanId) === false)
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: You are not authorized to invite people to this channel."))
		if (await this.chatService.isUserInChan(details.receiverId, details.chanId) === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if (await this.chatService.isUserInChan(details.receiverId, details.chanId) === true)
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Invited user is already in this channel."))
		if (await this.chatService.isBlockedBy(details.receiverId, decoded.ft_id) === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if (await this.chatService.isBlockedBy(details.receiverId, decoded.ft_id) === true)
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: You are blocked by this user."))
		if (await this.chatService.isAlreadyInvitedBy(decoded.ft_id, details.receiverId, details.chanId) === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if (await this.chatService.isAlreadyInvitedBy(decoded.ft_id, details.receiverId, details.chanId) === true)
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: You already have invited this user."))
		let channelInvitation
		if ((channelInvitation = await this.chatService.createChannelInvitation(decoded.ft_id, details.receiverId, details.chanId)) === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		let chanName = await this.chatService.getChannelNameById(details.chanId)
		if (typeof(chanName) != "string")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		let ownerId = await this.chatService.getOwnerIdById(details.chanId)
		if (ownerId === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		let chanType = await this.chatService.getChannelTypeById(details.chanId)
		if (chanType === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		let json = {
			"status": "OK",
			"error": "",
			"id": channelInvitation.channel_id,
			"name": chanName,
			"channel_type": chanType,
			"owner_id": ownerId,
			"is_admin": false,
			"is_in_chan": false
		}
		let targetedSockets = this.chatService.getSocketsByUser(channelInvitation.receiver_id)
		if (targetedSockets)
			this.server.to(targetedSockets).emit('emitChannelInvitation', json)
	}

	@SubscribeMessage('messageEmitted')
	async sendMessage(@ConnectedSocket() socket: Socket, @MessageBody() msgFromClient: msgFromClient) {
		console.log("\n\n--------------------|--------------------|--------------------| NEW MESSAGE RECEIVED |--------------------|--------------------|--------------------\n")
		if (typeof(msgFromClient.jwt) != "string" || typeof(msgFromClient.author) != "string" || typeof(msgFromClient.content) != "string" || typeof(msgFromClient.chanId) != "number")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		let decoded = await this.chatService.validateUser(msgFromClient.jwt)
		if (decoded === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if (!decoded)
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: You are not authentified."))
		if (await this.chatService.channelExists(msgFromClient.chanId) === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if (await this.chatService.channelExists(msgFromClient.chanId) === false)
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Channel does not exist."))
		if (await this.chatService.isUserInChan(decoded.ft_id, msgFromClient.chanId) === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if (await this.chatService.isUserInChan(decoded.ft_id, msgFromClient.chanId) === false)
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: You are not in this channel."))
		if (await this.chatService.isBannedInChan(decoded.ft_id, msgFromClient.chanId) === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if (await this.chatService.isBannedInChan(decoded.ft_id, msgFromClient.chanId) === true)
			return(this.sendErrorMessage(socket.id, "receiveError", "Error: You are banned in this channel."))
		if (await this.chatService.isMuted(decoded.ft_id, msgFromClient.chanId) === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if (await this.chatService.isMuted(decoded.ft_id, msgFromClient.chanId) === true)
			return(this.sendErrorMessage(socket.id, "receiveError", "Error: You are muted in this channel."))
		if (msgFromClient.content.length < 1)
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Your message is empty."))
		if (msgFromClient.content.length > 1000)
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Your message is too long. Maximum characters is 1000."))
		let newMessage
		if ((newMessage = await this.chatService.createMessage(decoded.ft_id, msgFromClient.chanId, msgFromClient.content)) === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		let messageToSend
		if ((messageToSend = await this.chatService.setUsernameToMessage(newMessage)) === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		let targetedUsers
		if ((targetedUsers = await this.chatService.getUsersInChan(newMessage.chan_id)) === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		let targetedSockets = []
		for (let i = 0; i < targetedUsers.length; i++) {
			let isBlocked = await this.chatService.isBlockedBy(targetedUsers[i].user_id, messageToSend.author)
			if (isBlocked === "error")
				return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
			if (isBlocked === false) {
				let tempTab = this.chatService.getSocketsByUser(targetedUsers[i].user_id)
				if (tempTab)
					targetedSockets.push(tempTab)
			}
		}
		if (targetedSockets.length > 0) {
			for (let i = 0; i < targetedSockets.length; i++) {
				this.server.to(targetedSockets[i]).emit('messageEmitted', messageToSend);
			}
		}
	}

	@SubscribeMessage('blockUser')
	async blockUser(@ConnectedSocket() socket: Socket, @MessageBody() details: BlockuserDTO) {
		console.log("\n\n--------------------|--------------------|--------------------| NEW BLOCK REQUEST |--------------------|--------------------|--------------------\n")
		if (typeof(details.token) != "string" || typeof(details.block_id) != "string")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		let decoded = await this.chatService.validateUser(details.token)
		if (decoded === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if (!decoded)
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: You are not authentified."))
		if (await this.chatService.userExists(details.block_id) === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if (await this.chatService.userExists(details.block_id) === false)
			return(this.sendErrorMessage(socket.id, "receiveError", "Error: This user does not exist."))
		if (await this.chatService.isBlockedBy(decoded.ft_id, details.block_id) === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if (await this.chatService.isBlockedBy(decoded.ft_id, details.block_id) === true)
			return(this.sendErrorMessage(socket.id, "receiveError", "Error: You have already blocked targeted user."))
		let ret = await this.userService.blockUser(decoded.ft_id, details.block_id)
		if (ret === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		let ret2 = await this.userService.removeWaitFriend(decoded.ft_id, details.block_id)
		if (ret2 === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		const targetedSockets = this.chatService.getSocketsByUser(details.block_id)
		if (targetedSockets)
			this.server.to(targetedSockets).emit('receiveBlock', decoded.ft_id)
	}

	async handleConnection(client: Socket, ...args: any[]) {
		//console.log("\n\n--------------------|--------------------|--------------------| NEW SOCKET CONNECTION |--------------------|--------------------|--------------------\n")
		//console.log("--------------------|--------------------| ChatGateway: handleConnection: new socket id:", client.id)
		//console.log("query in socket = ", client.handshake.query)
		if (client.handshake.query.jwt === "null")
			return (this.sendErrorMessage(client.id, "receiveError", "Error: No token provided."))
		if (client.handshake.query.jwt) {
			let token = client.handshake.query.jwt.toString()
			let decoded = await this.chatService.validateUser(token)
			if (!decoded)
				return (this.sendErrorMessage(client.id, "receiveError", "Error: You are not authentified."))
			this.chatService.addSocketToUser(decoded.ft_id, client.id)
			await this.chatService.setOnlineStatus(decoded.ft_id)
			//await this.chatService.showSockets()
		}
	}

	async handleDisconnect(client: Socket, ...args: any[]) {
		//console.log("\n\n--------------------|--------------------|--------------------| SOCKET DISCONNECTED |--------------------|--------------------|--------------------\n")
		//console.log("--------------------|--------------------| ChatGateway: handleDisconnect: socket id disconnected:")
		//console.log(client.id)
		await this.chatService.removeSocketFromUser(client.id)
		//this.chatService.showSockets()
	}
}

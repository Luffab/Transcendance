import { WebSocketGateway, SubscribeMessage, MessageBody, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, ConnectedSocket,} from '@nestjs/websockets';
import { ChatService } from './chat.service';
import { Server, Socket } from 'socket.io';
import { ChangePswDTO, ChannelDTO, JoinChanDTO, LeaveChanDTO } from './dto/chat.dto';
import { UserService } from 'src/users/services/user/user.service';
import { AddFriendDTO, BlockuserDTO } from 'src/users/dto/User.dto';
import { decode } from 'punycode';
import { send } from 'process';

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

//export interface channelInfos {
//	token: string;
//	channel_name: string;
//	channel_type: string;
//	password: string;
//}

@WebSocketGateway({
	cors: {
		origine: '*',
	},
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
	@WebSocketServer()
	server: Server;

	constructor(private readonly chatService: ChatService, private readonly userService: UserService) {}

	async sendErrorMessage(userId: string, socket: string, event: string, error: string) {
		//for (let i = 0; i < sockets.length; i++) {
			this.server.to(socket).emit(event, error)
		//}
		console.log("Error message sent to " + userId + " :" + error)
	}

	@SubscribeMessage('changePassword')
	async changePassowrd(@ConnectedSocket() socket: Socket, @MessageBody() body: ChangePswDTO) {
		console.log("\n\n--------------------|--------------------|--------------------| CHANGE PASSWORD |--------------------|--------------------|--------------------\n")
		let decoded = await this.chatService.validateUser(body.jwt)
		if (!decoded) {
			this.server.to(socket.id).emit("Error: You are not authentified")
			return(console.log("Error: You are not authentified"))
		}		
		if (await this.chatService.channelExists(body.chanId) === false)
			return (this.sendErrorMessage(decoded.ft_id, socket.id, "receiveError", "Error: Channel does not exist."))
		if (await this.chatService.isUserInChan(decoded.ft_id, body.chanId) === false)
			return (this.sendErrorMessage(decoded.ft_id, socket.id, "receiveError", "Error: User is not in this channel."))
		if (await this.chatService.isOwner(decoded.ft_id, body.chanId) === false)
			return(console.log("Error: User is not the owner of this channel."))
		if (body.password.length > 0 && body.password.length < 5)
		await this.chatService.changePassword(decoded.ft_id, body.chanId, body.password);
		let notInChan = await this.chatService.getUsersNotInChan(body.chanId)
		//console.log("notInChan = ", notInChan)
		let targetedSockets = []
		for (let i = 0; i < notInChan.length; i++) {
			let tempTab = this.chatService.getSocketsByUser(notInChan[i])
			if (tempTab)
				targetedSockets.push(tempTab)
		}
		let chanName = await this.chatService.getChannelNameById(body.chanId)
		let ownerId = await this.chatService.getOwnerIdById(body.chanId)
		let chanType = await this.chatService.getChannelTypeById(body.chanId)
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
		//console.log("sockets = ", targetedSockets)
		//console.log("json = ", json)
		if (targetedSockets.length > 0) {
			for (let i = 0; i < targetedSockets.length; i++)
				this.server.to(targetedSockets[i]).emit('updateChannel', json)
		}
	}

	@SubscribeMessage('leaveChannel')
	async leaveChannel(@ConnectedSocket() socket: Socket, @MessageBody() details: LeaveChanDTO) {
		console.log("\n\n--------------------|--------------------|--------------------| LEAVE CHANNEL |--------------------|--------------------|--------------------\n")
		let decoded = await this.chatService.validateUser(details.jwt)
		console.log("details = ", details)
		if (!decoded)
			return(console.log("Error: You are not authentified."))
		let senderSockets = this.chatService.getSocketsByUser(decoded.ft_id)
		if (await this.chatService.channelExists(details.chanId) === false)
			return (this.sendErrorMessage(decoded.ft_id, socket.id, "receiveError", "Error: Channel does not exist."))
		if (await this.chatService.isUserInChan(decoded.ft_id, details.chanId) === false)
			return (this.sendErrorMessage(decoded.ft_id, socket.id, "receiveError", "Error: You are not in this channel."))
		let ret = await this.chatService.leaveChannel(decoded.ft_id, details.chanId)
		let targetedUsers = await this.chatService.getUsersInChan(details.chanId);
		let channel = await this.chatService.getChannelById(details.chanId)
		let targetedSockets = []
		let allUsers = await this.chatService.getAllUsers()
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
				//for (let i = 0; i < senderSockets.length; i++)
				if (senderSockets)
					this.server.to(senderSockets).emit('deleteChannel', details.chanId);
			}
			else {
				//let isBanned = await this.chatService.isBannedInChan(decoded.ft_id, details.chanId)
				let jsonToSender = {
					"name": channel.name,
					"owner_id": channel.owner_id,
					"channel_type": channel.channel_type,
					"id": details.chanId,
					"is_admin": false,
					"is_in_chan": false,
					"is_owner": false,
					"is_banned": false
				}
				console.log("user other than owner left public/password channel : ", jsonToSender, " sent to leaver to 'updateChannel'")
				if (senderSockets)
					this.server.to(senderSockets).emit('updateChannel', jsonToSender);
			}
			let jsonToOther = {
				"ft_id": decoded.ft_id,
				"channel_id": details.chanId
			}
			console.log("user other than owner left public/private/password channel : ", jsonToOther, " sent to users im channel to 'deleteUserInChan'")
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
		let decoded = await this.chatService.validateUser(details.jwt)
		if (!decoded)
			return(console.log("Error: You are not authentified."))
		if (await this.chatService.userExists(details.receiverId) === false)
			return (this.sendErrorMessage(decoded.ft_id, socket.id, "receiveError", "Error: Invited user does not exist."))
		if (await this.chatService.isBlockedBy(details.receiverId, decoded.ft_id) === true)
			return (this.sendErrorMessage(decoded.ft_id, socket.id, "receiveError", "Error: You are blocked by targeted user."))
		let invitation = await this.chatService.createGameInvitation(decoded.ft_id, details.receiverId, details.mode)
		let username = await this.chatService.getUsernameById(decoded.ft_id)
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
		let decoded = await this.chatService.validateUser(msg.jwt)
		console.log("received from front : ", msg)
		if (!decoded)
			return(console.log("New DM Error: You are not authentified."))
		let senderSockets = this.chatService.getSocketsByUser(decoded.ft_id)
		if (await this.chatService.discussionExists(msg.discussionId) === false)
			return (this.sendErrorMessage(decoded.ft_id, socket.id, "receiveError", "Error: Private discussion does not exist."))
		if (await this.chatService.isBlockedBy(msg.receiverId, decoded.ft_id) === true)
			return (this.sendErrorMessage(decoded.ft_id, socket.id, "receiveError", "Error: You are blocked by targeted user."))
		if (!msg.content)
			return (this.sendErrorMessage(decoded.ft_id, socket.id, "receiveError", "Error: Your message is empty."))
		if (msg.content.length > 1000)
			return (this.sendErrorMessage(decoded.ft_id, socket.id, "receiveError", "Error: Your message is too long. Maximum characters is 1000."))
		const newMessage = await this.chatService.createDirectMessage(decoded.ft_id, msg.discussionId, msg.content)
		let username = await this.chatService.getUsernameById(newMessage.author)
		let messageToSend = {
			"id": newMessage.id,
			"author": newMessage.author,
			"author_name": username,
			"discussion_id": newMessage.discussion_id,
			"content": newMessage.content
		}
		let targetedSockets = this.chatService.getSocketsByUser(msg.receiverId)
		console.log("message to send to " + targetedSockets + " = ", messageToSend)
		if (targetedSockets)
			this.server.to(targetedSockets).emit('newDirectMessage', messageToSend);
		if(senderSockets)
			this.server.to(senderSockets).emit('newDirectMessage', messageToSend);
	}

	@SubscribeMessage('createDiscussion')
	async createDiscussion(@ConnectedSocket() socket: Socket, @MessageBody() details: discussionDetails) {
		console.log("\n\n--------------------|--------------------|--------------------| NEW DISCUSSION |--------------------|--------------------|--------------------\n")
		let decoded = await this.chatService.validateUser(details.jwt)
		if (!decoded)
			return(console.log("New Discussion Error: You are not authentified."))
		let senderSockets = this.chatService.getSocketsByUser(decoded.ft_id)
		if (await this.chatService.discussionAlreadyExists(decoded.ft_id, details.receiverId) === true)
			return(this.sendErrorMessage(decoded.ft_id, socket.id, "receiveError", "Error: A discussion between you and the targeted user already exists."))
		if (await this.chatService.userExists(details.receiverId) === false)
			return(this.sendErrorMessage(decoded.ft_id, socket.id, "receiveError", "Error: Targeted user does not exist."))
		if (await this.chatService.isBlockedBy(decoded.ft_id, details.receiverId) === true)
			return(this.sendErrorMessage(decoded.ft_id, socket.id, "receiveError", "Error: You are blocked by targeted user."))
		const newDiscussion = await this.chatService.createDiscussion(decoded.ft_id, details.receiverId)
		let username2 = await this.chatService.getUsernameById(details.receiverId)
		let toSendtoSender = {
			"id": newDiscussion.id,
			"other_user": newDiscussion.user2,
			"other_user_name": username2
		}
		let username1 = await this.chatService.getUsernameById(decoded.ft_id)
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
		let decoded = await this.chatService.validateUser(details.jwt)
		if (!decoded)
			return(console.log("Error: You are not authentified."))
		if (await this.chatService.userExists(details.receiverId) === false)
			return (this.sendErrorMessage(decoded.ft_id, socket.id, "receiveError", "Error: Targeted user does not exist."))
		if (await this.chatService.channelExists(details.chanId) === false)
			return(this.sendErrorMessage(decoded.ft_id, socket.id, "receiveError", "Error: Channel does not exist."))
		if (await this.chatService.isAdmin(decoded.ft_id, details.chanId) === false)
			return(this.sendErrorMessage(decoded.ft_id, socket.id, "receiveError", "Error: You are not admin in this channe."))
		if (await this.chatService.isUserInChan(details.receiverId, details.chanId) === false)
			return (this.sendErrorMessage(decoded.ft_id, socket.id, "receiveError", "Error: Targeted user is not in this channel."))
		if (decoded.ft_id === details.receiverId)
			return (this.sendErrorMessage(decoded.ft_id, socket.id, "receiveError", "Error: You can not ban yourself."))
		if ((await this.chatService.isAdmin(details.receiverId, details.chanId) === true) && (await this.chatService.isOwner(decoded.ft_id, details.chanId) === false))
			return(this.sendErrorMessage(decoded.ft_id, socket.id, "receiveError", "Error: Targeted user is an admin in this channel and only the channel owner can perform such operations."))
		if (await this.chatService.isBannedInChan(details.receiverId, details.chanId) === true)
			return (this.sendErrorMessage(decoded.ft_id, socket.id, "receiveError", "Error: Targeted user is already banned in this channel."))
		if (details.time < 1)
			return (this.sendErrorMessage(decoded.ft_id, socket.id, "receiveError", "Error: Mute duration is minimum 1 minute."))
		if (details.time > 525000)
			return (this.sendErrorMessage(decoded.ft_id, socket.id, "receiveError", "Error: Mute duration is maximum 525000 minutes (365 days)."))
		await this.chatService.muteUser(details.receiverId, details.chanId, details.time)
	}

	@SubscribeMessage('banUser')
	async banUser(@ConnectedSocket() socket: Socket, @MessageBody() details: banUserDetails) {
		console.log("\n\n--------------------|--------------------|--------------------| BAN USER |--------------------|--------------------|--------------------\n")
		let decoded = await this.chatService.validateUser(details.jwt)
		if (!decoded)
			return(console.log("Error: You are not authentified."))
		if (await this.chatService.userExists(details.receiverId) === false)
			return (this.sendErrorMessage(decoded.ft_id, socket.id, "receiveError", "Error: Targeted user does not exist."))
		if (await this.chatService.channelExists(details.chanId) === false)
			return(this.sendErrorMessage(decoded.ft_id, socket.id, "receiveError", "Error: Channel does not exist."))
		if (await this.chatService.isAdmin(decoded.ft_id, details.chanId) === false)
			return(this.sendErrorMessage(decoded.ft_id, socket.id, "receiveError", "Error: You are not admin in this channe."))
		if (await this.chatService.isUserInChan(details.receiverId, details.chanId) === false)
			return (this.sendErrorMessage(decoded.ft_id, socket.id, "receiveError", "Error: Targeted user is not in this channel."))
		if (decoded.ft_id === details.receiverId)
			return (this.sendErrorMessage(decoded.ft_id, socket.id, "receiveError", "Error: You can not ban yourself."))
		if ((await this.chatService.isAdmin(details.receiverId, details.chanId) === true) && (await this.chatService.isOwner(decoded.ft_id, details.chanId) === false))
			return(this.sendErrorMessage(decoded.ft_id, socket.id, "receiveError", "Error: Targeted user is an admin in this channel and only the channel owner can perform such operations."))
		if (await this.chatService.isBannedInChan(details.receiverId, details.chanId) === true)
			return (this.sendErrorMessage(decoded.ft_id, socket.id, "receiveError", "Error: Targeted user is already banned in this channel."))
		await this.chatService.banUser(details.receiverId, details.chanId)
		let username = await this.chatService.getUsernameById(details.receiverId)
		let isAdmin = await this.chatService.isAdmin(details.receiverId, details.chanId)
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
		let targetedUsers = await this.chatService.getUsersInChan(details.chanId);
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
		let decoded = await this.chatService.validateUser(details.jwt)
		if (!decoded)
			return(console.log("Error: You are not authentified."))
		if (await this.chatService.userExists(details.receiverId) === false)
			return (this.sendErrorMessage(decoded.ft_id, socket.id, "receiveError", "Error: Targeted user does not exist."))
		if (await this.chatService.channelExists(details.chanId) === false)
			return(this.sendErrorMessage(decoded.ft_id, socket.id, "receiveError", "Error: Channel does not exist."))
		if (await this.chatService.isAdmin(decoded.ft_id, details.chanId) === false)
			return(this.sendErrorMessage(decoded.ft_id, socket.id, "receiveError", "Error: You are not admin in this channel."))
		if (await this.chatService.isUserInChan(details.receiverId, details.chanId) === false)
			return (this.sendErrorMessage(decoded.ft_id, socket.id, "receiveError", "Error: Targeted user is not in this channel."))
		if (decoded.ft_id === details.receiverId)
			return (this.sendErrorMessage(decoded.ft_id, socket.id, "receiveError", "Error: You can not unban yourself."))
		if ((await this.chatService.isAdmin(details.receiverId, details.chanId) === true) && (await this.chatService.isOwner(decoded.ft_id, details.chanId) === false)) 
			return(this.sendErrorMessage(decoded.ft_id, socket.id, "receiveError", "Error: Targeted user is an admin in this channel and only the channel owner can perform such operations."))
		if (await this.chatService.isBannedInChan(details.receiverId, details.chanId) === false)
			return (this.sendErrorMessage(decoded.ft_id, socket.id, "receiveError", "Error: Targeted user is not banned in this channel."))
		await this.chatService.unbanUser(details.receiverId, details.chanId)
		let username = await this.chatService.getUsernameById(details.receiverId)
		let isAdmin = await this.chatService.isAdmin(details.receiverId, details.chanId)
		let json = {
			"ft_id": details.receiverId,
			"username": username,
			"is_admin": isAdmin,
			"is_owner": false,
			"is_banned": false
		}
		let chanName = await this.chatService.getChannelNameById(details.chanId)
		let ownerId = await this.chatService.getChannelOwner(details.chanId)
		let chanType = await this.chatService.getChannelTypeById(details.chanId)
		let youAreUnbanned = {
			"name": chanName,
			"owner_id": ownerId.owner_id,
			"channel_type": chanType,
			"id": details.chanId,
			"is_admin": await this.chatService.isAdmin(details.receiverId, details.chanId),
			"is_in_chan": true,
			"is_owner": false,
			"is_banned": false,
			"is_selected": false,
			"color": "none"
		}
		let unbannedSockets = this.chatService.getSocketsByUser(details.receiverId)
		if (unbannedSockets)
			this.server.to(unbannedSockets).emit('addChannel', youAreUnbanned);
		let targetedUsers = await this.chatService.getUsersInChan(details.chanId);
		let targetedSockets = []
		let k = 0;
		for (let i = 0; i < targetedUsers.length; i++) {
			if (targetedUsers[i].user_id != details.receiverId) {
				let tempTab = this.chatService.getSocketsByUser(targetedUsers[i].user_id)
				targetedSockets[k] = tempTab;
				k++
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
		let decoded = await this.chatService.validateUser(details.jwt)
		if (!decoded)
			return(console.log("Error: You are not authentified."))
		if (await this.chatService.userExists(details.receiverId) === false)
			return (this.sendErrorMessage(decoded.ft_id, socket.id, "receiveError", "Error: Targeted user does not exist."))
		if (await this.chatService.channelExists(details.chanId) === false)
			return(this.sendErrorMessage(decoded.ft_id, socket.id, "receiveError", "Error: Channel does not exist."))
		if (await this.chatService.isOwner(decoded.ft_id, details.chanId) === false)
			return(this.sendErrorMessage(decoded.ft_id, socket.id, "receiveError", "Error: You are not the channel owner."))
		if (await this.chatService.isUserInChan(details.receiverId, details.chanId) === false)
			return (this.sendErrorMessage(decoded.ft_id, socket.id, "receiveError", "Error: Targeted user is not in this channel."))
		if (decoded.ft_id === details.receiverId)
			return (this.sendErrorMessage(decoded.ft_id, socket.id, "receiveError", "Error: You can not set yourself as admin."))
		if (await this.chatService.isBannedInChan(details.receiverId, details.chanId) === true)
			return (this.sendErrorMessage(decoded.ft_id, socket.id, "receiveError", "Error: Targeted user is banned in this channel."))
		if (await this.chatService.isAdmin(details.receiverId, details.chanId) === true)
			return(this.sendErrorMessage(decoded.ft_id, socket.id, "receiveError", "Error: Targeted user is already an admin in this channel."))
		await this.chatService.setAsAdmin(details.receiverId, details.chanId)
		let username = await this.chatService.getUsernameById(details.receiverId)
		let json = {
			"ft_id": details.receiverId,
			"username": username,
			"is_admin": true,
			"is_owner": false,
			"is_banned": false
		}
		let targetedUsers = await this.chatService.getUsersInChan(details.chanId);
		let targetedSockets = []
		for (let i = 0; i < targetedUsers.length; i++) {
			//if (targetedUsers[i].user_id != details.receiverId) {
				let tempTab = this.chatService.getSocketsByUser(targetedUsers[i].user_id)
				if (tempTab)
					targetedSockets.push(tempTab)
			//}
		}
		if (targetedSockets.length > 0) {
			for (let i = 0; i < targetedSockets.length; i++) {
				this.server.to(targetedSockets[i]).emit('updateUserInChan', json);
			}
		}
		let newAdminSockets = this.chatService.getSocketsByUser(details.receiverId)
		if (newAdminSockets) {
			let json = {
				"name": await this.chatService.getChannelNameById(details.chanId),
				"owner_id": await this.chatService.getChannelNameById(details.chanId),
				"channel_type": await this.chatService.getChannelNameById(details.chanId),
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
		let decoded = await this.chatService.validateUser(details.token)
		if (!decoded)
			return(console.log("Error: You are not authentified."))
		const senderSockets = this.chatService.getSocketsByUser(decoded.ft_id)
		if (await this.chatService.channelExists(details.chan_id) === false)
			return(this.sendErrorMessage(decoded.ft_id, socket.id, "receiveError", "Error: Channel does not exist."))
		await this.chatService.deleteChannelInvitations(decoded.ft_id, details.chan_id)
	}

	@SubscribeMessage('joinChannel')
	async joinChannel(@ConnectedSocket() socket: Socket, @MessageBody() details: JoinChanDTO) {
		console.log("\n\n--------------------|--------------------|--------------------| JOINING CHANNEL |--------------------|--------------------|--------------------\n")
		let decoded = await this.chatService.validateUser(details.token)
		if (!decoded)
			return(console.log("Error: You are not authentified."))
		const senderSockets = this.chatService.getSocketsByUser(decoded.ft_id)
		if (await this.chatService.channelExists(details.chan_id) === false)
			return(this.sendErrorMessage(decoded.ft_id, socket.id, "receiveError", "Error: Channel does not exist."))
		if (await this.chatService.isBannedInChan(decoded.ft_id, details.chan_id) === true)
			return(this.sendErrorMessage(decoded.ft_id, socket.id, "receiveError", "Error: You are banned in this channel."))
		const channel = await this.chatService.joinChannel(details)
		let chanName = await this.chatService.getChannelNameById(details.chan_id)
		let ownerId = await this.chatService.getOwnerIdById(details.chan_id)
		let chanType = await this.chatService.getChannelTypeById(details.chan_id)
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
			let otherUsers = await this.chatService.getUsersInChan(details.chan_id);
			let otherSockets = []
			for (let i = 0; i < otherUsers.length; i++) {
				if (otherUsers[i].user_id != decoded.ft_id) {
					let tempTab = this.chatService.getSocketsByUser(otherUsers[i].user_id)
					if (tempTab)
						otherSockets.push(tempTab)
				}
			}
			let username = await this.chatService.getUsernameById(decoded.ft_id)
			let isAdmin = await this.chatService.isAdmin(decoded.ft_id, details.chan_id)
			let isOwner = await this.chatService.isOwner(decoded.ft_id, details.chan_id)
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
			this.sendErrorMessage(decoded.ft_id, socket.id, "receiveError", "Error: Wrong password.")
	}

	@SubscribeMessage('createChannel')
	async createChannel(@ConnectedSocket() socket: Socket, @MessageBody() details: ChannelDTO) {
		console.log("\n\n--------------------|--------------------|--------------------| NEW CHANNEL REQUESTED |--------------------|--------------------|--------------------\n")
		let decoded = await this.chatService.validateUser(details.token)
		if (!decoded)
		{
			this.server.to(socket.id).emit("receiveError", "Error: You are not authentified.")
			return(console.log("Error: You are not authentified."))
		}	
		let ownerSockets = this.chatService.getSocketsByUser(decoded.ft_id)
		if (await this.chatService.channelNameExists(details.channel_name) === true)
			return(this.sendErrorMessage(decoded.ft_id, socket.id, "receiveError", "Error: Channel name is already taken."))
		if (details.channel_name.length < 3)
			return(this.sendErrorMessage(decoded.ft_id, socket.id, "receiveError", "Error: Channel name is too short. A minimum of 3 characters is required."))
		if (details.channel_name.length > 20)
			return(this.sendErrorMessage(decoded.ft_id, socket.id, "receiveError", "Error: Channel name is too long. Maximum characters is 20."))
		const newChannel = await this.chatService.createChannel(decoded.ft_id, details.channel_name, details.channel_type, details.password)
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
		let decoded = await this.chatService.validateUser(details.token)
		if (!decoded)
			return(console.log("Error: You are not authentified."))
		if (await this.chatService.userExists(details.friend_id) === false)
			return(this.sendErrorMessage(decoded.ft_id, socket.id, "receiveError", "Error: This user does not exist."))
		if (await this.chatService.areFriends(decoded.ft_id, details.friend_id))
			return(this.sendErrorMessage(decoded.ft_id, socket.id, "receiveError", "Error: You are already friend with targeted user."))
		if (await this.chatService.friendRequestIsWaiting(decoded.ft_id, details.friend_id))
			return(this.sendErrorMessage(decoded.ft_id, socket.id, "receiveError", "Error: You or targeted user need to accept or refuse the already existing friend request."))
		if (await this.chatService.isBlockedBy(decoded.ft_id, details.friend_id))
			return(this.sendErrorMessage(decoded.ft_id, socket.id, "receiveBlockedError", "Error: The target is blocked."))
		const targetedSockets = this.chatService.getSocketsByUser(details.friend_id)
		let username = await this.chatService.getUsernameById(decoded.ft_id)
		let isBlocked = await this.chatService.isBlockedBy(details.friend_id, decoded.ft_id)
		if (isBlocked == false) {
			this.userService.addFriend(decoded.ft_id, details.friend_id)
			let json = {
				ft_id: decoded.ft_id,
				username: username
			}
			if (targetedSockets)
				this.server.to(targetedSockets).emit('receiveFriendRequest', json)
		}
		else
			this.sendErrorMessage(decoded.ft_id, socket.id, "receiveBlockedError", "Error: You are blocked by target.")
	}

	@SubscribeMessage('removeFriend')
	async removeFriend(@ConnectedSocket() socket: Socket, @MessageBody() details: AddFriendDTO) {
		console.log("\n\n--------------------|--------------------|--------------------| NEW REMOVE REQUEST |--------------------|--------------------|--------------------\n")
		let decoded = await this.chatService.validateUser(details.token)
		if (!decoded)
			return(console.log("Error: You are not authentified."))
		let senderSockets = this.chatService.getSocketsByUser(decoded.ft_id)
		if (await this.chatService.userExists(details.friend_id) === false)
			return(this.sendErrorMessage(decoded.ft_id, socket.id, "receiveError", "Error: This user does not exist."))
		if (!await this.chatService.areFriends(decoded.ft_id, details.friend_id))
			return(this.sendErrorMessage(decoded.ft_id, socket.id, "receiveError", "Error: You are not friend with targeted user."))
		if (await this.chatService.friendRequestIsWaiting(decoded.ft_id, details.friend_id))
			return(this.sendErrorMessage(decoded.ft_id, socket.id, "receiveError", "Error: You or targeted user need to accept or refuse the already existing friend request."))
		const targetedSockets = this.chatService.getSocketsByUser(details.friend_id)
		let username = await this.chatService.getUsernameById(decoded.ft_id)
		this.userService.removeFriend(decoded.ft_id, details.friend_id)
		let json = {
			ft_id: decoded.ft_id,
			username: username
		}
		let sendeUsername = await this.chatService.getUsernameById(details.friend_id)
		let json2 = {
			ft_id: details.friend_id,
			username: sendeUsername
		}
		if (targetedSockets)
			this.server.to(targetedSockets).emit('removeFriendRequest', json)
		if (senderSockets)
			this.server.to(senderSockets).emit('removeFriendRequest', json2)
	}

	@SubscribeMessage('friendRequestResponse')
	async getFriendRequestResponse(@ConnectedSocket() socket: Socket, @MessageBody() details: friendRequestAnswer) {
		console.log("\n\n--------------------|--------------------|--------------------| NEW FRIEND REQUEST RESPONSE |--------------------|--------------------|--------------------\n")
		let decoded = await this.chatService.validateUser(details.token)
		if (!decoded)
			return(console.log("Error: You are not authentified."))
		let senderSockets = this.chatService.getSocketsByUser(decoded.ft_id)
		if (await this.chatService.userExists(details.friend_id) === false)
			return (this.sendErrorMessage(decoded.ft_id, socket.id, "receiveError", "Error: Accepted or refused user does not exist."))
		if (await this.chatService.isBlockedBy(details.friend_id, decoded.ft_id)) {
			if (senderSockets)
				this.server.to(senderSockets).emit('receiveBlockedError', details.friend_id)
		}
		const targetedSockets = this.chatService.getSocketsByUser(details.friend_id)
		let username = await this.chatService.getUsernameById(decoded.ft_id)
		if (details.answer === true) {
			this.userService.acceptFriend(decoded.ft_id, details.friend_id)
			let status = await this.chatService.getStatusById(decoded.ft_id)
			let json = {
				ft_id: decoded.ft_id,
				username: username,
				status: status
			}
			if (targetedSockets) {
				this.server.to(targetedSockets).emit('receiveFriendRequestAnswer', json)
			}
			let sendeUsername = await this.chatService.getUsernameById(details.friend_id)
			let status2 = await this.chatService.getStatusById(details.friend_id)
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
			let json3 = {
				ft_id: details.friend_id,
				username: sendeUsername
			}
			if (senderSockets)
				this.server.to(senderSockets).emit('receiveMyFriendRequestFailed', json3)
			if (targetedSockets)
				this.server.to(targetedSockets).emit('receiveMyFriendRequestFailed', json3)
			await this.userService.removeRelation(details.friend_id, decoded.ft_id)
		}
	}

	@SubscribeMessage('inviteToChannel')
	async inviteToChannel(@ConnectedSocket() socket: Socket, @MessageBody() details: channelInvitationDetails) {
		console.log("\n\n--------------------|--------------------|--------------------| NEW CHANNEL INVITATION |--------------------|--------------------|--------------------\n")
		let decoded = await this.chatService.validateUser(details.jwt)
		if (!decoded)
			return(console.log("Error: You are not authentified."))
		if (await this.chatService.userExists(details.receiverId) === false)
			return (this.sendErrorMessage(decoded.ft_id, socket.id, "receiveError", "Error: Invited user does not exist."))
		if (await this.chatService.channelExists(details.chanId) === false)
			return (this.sendErrorMessage(decoded.ft_id, socket.id, "receiveError", "Error: Channel does not exist."))
		if (await this.chatService.isAdmin(decoded.ft_id, details.chanId) === false)
			return (this.sendErrorMessage(decoded.ft_id, socket.id, "receiveError", "Error: You are not authorized to invite people to this channel."))
		if (await this.chatService.isUserInChan(details.receiverId, details.chanId) === true)
			return (this.sendErrorMessage(decoded.ft_id, socket.id, "receiveError", "Error: Invited user is already in this channel."))
		if (await this.chatService.isBlockedBy(details.receiverId, decoded.ft_id) === true)
			return (this.sendErrorMessage(decoded.ft_id, socket.id, "receiveError", "Error: You are blocked by this user."))
		if (await this.chatService.isAlreadyInvitedBy(decoded.ft_id, details.receiverId, details.chanId) === true)
			return (this.sendErrorMessage(decoded.ft_id, socket.id, "receiveError", "Error: You already have invited this user."))
		const channelInvitation = await this.chatService.createChannelInvitation(decoded.ft_id, details.receiverId, details.chanId);
		let chanName = await this.chatService.getChannelNameById(details.chanId)
		let ownerId = await this.chatService.getOwnerIdById(details.chanId)
		let chanType = await this.chatService.getChannelTypeById(details.chanId)
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
		let decoded = await this.chatService.validateUser(msgFromClient.jwt)
		if (!decoded)
			return(console.log("Error: You are not authentified."))
		if (await this.chatService.channelExists(msgFromClient.chanId) === false)
			return (this.sendErrorMessage(decoded.ft_id, socket.id, "receiveError", "Error: Channel does not exist."))
		if (await this.chatService.isUserInChan(decoded.ft_id, msgFromClient.chanId) === false)
			return (this.sendErrorMessage(decoded.ft_id, socket.id, "receiveError", "Error: You are not in this channel."))
		if (await this.chatService.isBannedInChan(decoded.ft_id, msgFromClient.chanId) === true)
			return(this.sendErrorMessage(decoded.ft_id, socket.id, "receiveError", "Error: You are banned in this channel."))
		if (await this.chatService.isMuted(decoded.ft_id, msgFromClient.chanId) === true)
			return(this.sendErrorMessage(decoded.ft_id, socket.id, "receiveError", "Error: You are muted in this channel."))
		if (msgFromClient.content.length < 1)
			return (this.sendErrorMessage(decoded.ft_id, socket.id, "receiveError", "Error: Your message is empty."))
		if (msgFromClient.content.length > 1000)
			return (this.sendErrorMessage(decoded.ft_id, socket.id, "receiveError", "Error: Your message is too long. Maximum characters is 1000."))
		const newMessage = await this.chatService.createMessage(decoded.ft_id, msgFromClient.chanId, msgFromClient.content)
		let messageToSend = await this.chatService.setUsernameToMessage(newMessage)
		let targetedUsers = await this.chatService.getUsersInChan(newMessage.chan_id);
		let targetedSockets = []
		for (let i = 0; i < targetedUsers.length; i++) {
			let isBlocked = await this.chatService.isBlockedBy(targetedUsers[i].user_id, messageToSend.author)
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
		let decoded = await this.chatService.validateUser(details.token)
		if (!decoded)
			return(console.log("Error: You are not authentified."))
		if (await this.chatService.userExists(details.block_id) === false)
			return(this.sendErrorMessage(decoded.ft_id, socket.id, "receiveError", "Error: This user does not exist."))
		if (await this.chatService.isBlockedBy(decoded.ft_id, details.block_id) === true)
			return(this.sendErrorMessage(decoded.ft_id, socket.id, "receiveError", "Error: You have already blocked targeted user."))
		await this.userService.blockUser(decoded.ft_id, details.block_id)
		await this.userService.removeWaitFriend(decoded.ft_id, details.block_id)
		const targetedSockets = this.chatService.getSocketsByUser(details.block_id)
		if (targetedSockets)
			this.server.to(targetedSockets).emit('receiveBlock', decoded.ft_id)
	}

	async handleConnection(client: Socket, ...args: any[]) {
		//console.log("\n\n--------------------|--------------------|--------------------| NEW SOCKET CONNECTION |--------------------|--------------------|--------------------\n")
		//console.log("--------------------|--------------------| ChatGateway: handleConnection: new socket id:", client.id)
		//console.log("query in socket = ", client.handshake.query)
		if (client.handshake.query.jwt === "null")
			return (this.sendErrorMessage("unknown", client.id, "receiveError", "Error: No token provided."))
		if (client.handshake.query.jwt) {
			let token = client.handshake.query.jwt.toString()
			let decoded = await this.chatService.validateUser(token)
			if (!decoded)
				return (this.sendErrorMessage("unknown", client.id, "receiveError", "Error: You are not authentified."))
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

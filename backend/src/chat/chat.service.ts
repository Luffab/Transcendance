import { Injectable } from '@nestjs/common';
import { UsersInChan } from 'src/typeorm/entities/UserinChan';
import { Channels } from 'src/typeorm/entities/Channels';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { User } from 'src/typeorm';
import { Messages } from './../typeorm/entities/Messages'
import { ChangePswDTO, ChannelDTO, DeleteChanDTO, JoinChanDTO, LeaveChanDTO, MessageInChanDTO, UserInChanDTO, UserNotInChanDTO } from './dto/chat.dto';
import { UsersRelation } from 'src/typeorm/entities/UserRelations';
import { ChannelInvitation } from 'src/typeorm/entities/ChannelInvitation';
import PrivateDiscussions from 'src/typeorm/entities/PrivateDiscussions';
import DirectMessages from 'src/typeorm/entities/DirectMessages';
import { GameInvitation } from 'src/typeorm/entities/GameInvitation';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ChatService {
	constructor(
		@InjectRepository(Channels) private readonly chanRepo: Repository<Channels>,
		@InjectRepository(UsersInChan) private readonly userinchanRepo: Repository<UsersInChan>,
		@InjectRepository(User) private readonly userRepo: Repository<User>,
		@InjectRepository(Messages) private readonly msgRepo: Repository<Messages>,
		@InjectRepository(UsersRelation) private readonly relationRepo: Repository<UsersRelation>,
		@InjectRepository(ChannelInvitation) private readonly chanInvitationRepo: Repository<ChannelInvitation>,
		@InjectRepository(PrivateDiscussions) private readonly discussionRepo: Repository<PrivateDiscussions>,
		@InjectRepository(DirectMessages) private readonly dmRepo: Repository<DirectMessages>,
		@InjectRepository(GameInvitation) private readonly gameInvitationRepo: Repository<GameInvitation>,
	) {}

	private socketByUser: Map<string, string[]>= new Map<string, string[]>()

	async isAlreadyInvitedBy(senderId: string, receiverId: string, chanId: number) {
		try {
			if (await this.chanInvitationRepo.findOne({
				where: {sender_id: senderId, receiver_id: receiverId, channel_id: chanId}
			}))
				return true
			return false
		}
		catch {return "error"}
	}

	async getUsersForDMS(userId: string) {
		try {
			let allUsers = await this.userRepo.find({
				select: {ft_id: true},
			})
			let finalUsers = []
			for (let i = 0; i < allUsers.length; i++) {
				if (allUsers[i].ft_id === userId)
					continue
				else if (await this.discussionAlreadyExists(userId, allUsers[i].ft_id) === true)
					continue
				else if (await this.isBlockedBy(allUsers[i].ft_id, userId) === true)
					continue
				else {
					let username = await this.getUsernameById(allUsers[i].ft_id)
					let json = {
						"ft_id": allUsers[i].ft_id,
						"username": username
					}
					finalUsers.push(json)
				}
			}
			return finalUsers
		}
		catch {return "error"}
	}

	async createGameInvitation(senderId: string, receiverId: string, mode: string) {
		try {
			let toSave = {
				"sender_id": senderId,
				"receiver_id": receiverId,
				"mode": mode
			}
			if (await this.gameInvitationRepo.findOne({
				where: {
					sender_id: senderId
				}
			})) {
				await this.gameInvitationRepo.delete({sender_id: senderId})
			}
			const invitation = this.gameInvitationRepo.create(toSave);
			return this.gameInvitationRepo.save(invitation);
		}
		catch {return "error"}
	}

	async discussionExists(discussionId: number) {
		try {
			if (await this.discussionRepo.findOne({ where: {id: discussionId}}))
				return true
			return false
		}
		catch {return "error"}
	}

	async discussionAlreadyExists(user1: string, user2: string) {
		try {
			if (await this.discussionRepo.findOne({ where: {user1: user1, user2: user2}}))
				return true
			if (await this.discussionRepo.findOne({ where: {user1: user2, user2: user1}}))
				return true
			return false
		}
		catch {return "error"}
	}

	async createDiscussion(user1: string, user2: string) {
		try {
			let json = {
				"user1": user1,
				"user2": user2
			}
			const tmp = await this.discussionRepo.create(json);
			const ret = await this.discussionRepo.save(tmp);
			return ret
		}
		catch {return "error"}
	}

	async getDiscussions(userId: string) {
		try {
			let tmp1 = await this.discussionRepo.find({where: {user1: userId}})
			let tab1 = []
			for (let i = 0; i < tmp1.length; i++) {
				let username = await this.getUsernameById(tmp1[i].user2)
				let json = {
					"id": tmp1[i].id,
					"other_user": tmp1[i].user2,
					"other_user_name": username,
					"is_selected": false,
					"color": 'none'
				}
				tab1.push(json)
			}
			let tmp2 = await this.discussionRepo.find({where: {user2: userId}})
			let tab2 = []
			for (let i = 0; i < tmp2.length; i++) {
				let username = await this.getUsernameById(tmp2[i].user1)
				let json = {
					"id": tmp2[i].id,
					"other_user": tmp2[i].user1,
					"other_user_name": username
				}
				tab2.push(json)
			}
			let finalTab = [...tab1, ...tab2]
			return finalTab
		}
		catch {return "error"}
	}

	async getDirectMessages(discussionId: number) {
		try {
			let tmp = await this.dmRepo.find({where: {discussion_id: discussionId}})
			let tab = []
			for (let i = 0; i < tmp.length; i++) {
				let username = await this.getUsernameById(tmp[i].author)
				let json = {
					"id": tmp[i].id,
					"author": tmp[i].author,
					"author_name": username,
					"discussion_id": tmp[i].discussion_id,
					"content": tmp[i].content
				}
				tab.push(json)
			}
			return tab
		}
		catch {return "error"}
	}

	addSocketToUser(userId: string, newSocketId: string) {
		let tab = this.socketByUser.get(userId);
		if (!tab || ((tab.includes(newSocketId)) === false)) {
			if (!tab)
				this.socketByUser.set(userId, [newSocketId]);
			else
				this.socketByUser.set(userId, [...tab, newSocketId]);
		}
	}

	async showSockets() {
		for (let [key, value] of this.socketByUser) {
			let username = await this.getUsernameById(key)
			let status = await this.getStatusById(key)
			console.log(username + " is " + status + " = " + value);
		}
	}

	async setOnlineStatus(userId: string) {
		try {
			await this.userRepo
    		.createQueryBuilder()
    		.update(User)
    		.set({ status:"Online" })
    		.where("ft_id = :id", { id: userId })
    		.execute()
		}
		catch {return "error"}
	}

	async setOfflineStatus(userId: string) {
		try {
			await this.userRepo
    		.createQueryBuilder()
    		.update(User)
    		.set({ status:"Offline" })
    		.where("ft_id = :id", { id: userId })
    		.execute()
		}
		catch {return "error"}
	}

	async removeSocketFromUser(socketId: string) {
		for (let [key, value] of this.socketByUser)
		{
			for (let i = 0; i < value.length; i++) {
				if (value[i] === socketId)
					value.splice(i, 1);
			}
			if (value.length === 0) {
				await this.setOfflineStatus(key)
				this.socketByUser.delete(key)
			}
		}
	}

	getSocketsByUser(userId: string) {
		let ret = this.socketByUser.get(userId);
		if (ret === undefined)
			return
		else if (typeof(ret) === "string")
			return [ret]
		else
			return ret
	}

	getAllOtherSockets(ownerId: string) {
		let tab = []
		this.socketByUser.forEach(function(value, key) {
			if (key != ownerId)
				tab.push(value)
		})
		return tab
	}

	async setUsernameToMessage(msg: Messages) {
		try {
			let messageToSend = {
				id: msg.id,
				author: msg.author,
				author_name: await this.getUsernameById(msg.author),
				chan_id: msg.chan_id,
				content: msg.content
			}
			return messageToSend
		}
		catch {return "error"}
	}

	createDirectMessage(senderId: string, discussionId: number, content: string) {
		try {
			let json = {
				"author": senderId,
				"discussion_id": discussionId,
				"content": content
			}
			let msg = this.dmRepo.create(json);
			let ret = this.dmRepo.save(msg);
			return ret
		}
		catch {return "error"}
  	}

	createMessage(senderId: string, chanId: number, content: string) {
		try {
			let json = {
				"author": senderId,
				"chan_id": chanId,
				"content": content
			}
			let msg = this.msgRepo.create(json);
			return this.msgRepo.save(msg);
		}
		catch {return "error"}
  	}

	async validateUser(token: string) {
		let jwt = require('jwt-simple');
		let secret = process.env.JWT_SECRET;
		try {
			jwt.decode(token, secret);
		}
		catch {
			return
		}
		let decoded = jwt.decode(token, secret);
		if (await this.userExists(decoded.ft_id) === "error")
			return "error"
		if (await this.userExists(decoded.ft_id) === false)
			return
		return decoded
	}

	async userExists(userId: string) {
		try {
			if (await this.userRepo.findOne({ where: {ft_id: userId}}))
				return true
			return false
		}
		catch {return "error"}
	}

	async channelNameExists(chanName: string) {
		try {
			if (await this.chanRepo.findOne({ where: {name: chanName}}))
				return true
			return false
		}
		catch {return "error"}
	}

	async channelExists(chanId: number) {
		try {
			if (await this.chanRepo.findOne({ where: {id: chanId}}))
				return true
			return false
		}
		catch {return "error"}
	}

	async isUserInChan(userId: string, chanId: number) {
		try {
			if (await this.userinchanRepo.findOne({ where: { chanid: chanId, user_id: userId }}))
				return true
			return false
		}
		catch {return "error"}
	}

	async isBannedInChan(userId: string, chanId: number) {
		try {
			if (await this.userinchanRepo.findOne({ where: { chanid: chanId, user_id: userId, is_banned: true}}))
				return true
			return false
		}
		catch {return "error"}
	}

	async isMuted(userId: string, chanId: number) {
		try {
			let now = Date.now()
			let unmute_time = await this.userinchanRepo.findOne({
				select: {unmute_time: true},
				where: { chanid: chanId, user_id: userId }})
			//console.log("unmute time = ", unmute_time.unmute_time)
			//console.log("unmute time in seconds = ", unmute_time.unmute_time/1000)
			if (unmute_time.unmute_time > (now/1000)) {
				//console.log("is muted")
				return true
			}
			//console.log("is not muted")
			return false
		}
		catch {return "error"}
	}

	async muteUser(userId: string, chanId:number, time: number) {
		try {
			let tmp = await this.userinchanRepo.findOne({
				where: {user_id: userId, chanid: chanId}
			})
			let now = Date.now()
			tmp.unmute_time = (Math.floor(now/1000)) + (time*60)
			await this.userinchanRepo.save(tmp)
		}
		catch {return "error"}
	}

	async banUser(userId: string, chanId:number) {
		try {
			let tmp = await this.userinchanRepo.findOne({
				where: {user_id: userId, chanid: chanId}
			})
			tmp.is_banned = true
			await this.userinchanRepo.save(tmp)
		}
		catch {return "error"}
	}

	async unbanUser(userId: string, chanId:number) {
		try {
			let tmp = await this.userinchanRepo.findOne({
				where: {user_id: userId, chanid: chanId}
			})
			tmp.is_banned = false
			await this.userinchanRepo.save(tmp)
		}
		catch {return "error"}
	}

	async setAsAdmin(userId: string, chanId:number) {
		try {
			let tmp = await this.userinchanRepo.findOne({
				where: {user_id: userId, chanid: chanId}
			})
			tmp.is_admin = true
			await this.userinchanRepo.save(tmp)
		}
		catch {return "error"}
	}

	async isAdmin(userId: string, chanId: number) {
		try {
			if (await this.userinchanRepo.findOne({ where: { is_admin: true, chanid: chanId, user_id: userId }}))
				return true
			return false
		}
		catch {return "error"}
	}

	async isOwner(userId: string, chanId: number) {
		try {
			let channel = await this.getChannelById(chanId)
			if (channel.owner_id === userId)
				return true
			return false
		}
		catch {return "error"}
	}

	async areFriends(user1Id: string, user2Id: string) {
		try {
			if ((await this.relationRepo.findOne({ where: { sender_id: user1Id, receiver_id: user2Id, is_friend: true} }))
			|| (await this.relationRepo.findOne({ where: { sender_id: user2Id, receiver_id: user1Id, is_friend: true} })))
				return true
			return false
		}
		catch {return "error"}
	}

	async friendRequestIsWaiting(senderId: string, receiverId: string) {
		try {
			if ((await this.relationRepo.findOne({ where: { sender_id: senderId, receiver_id: receiverId, wait_friend: true} }))
			|| (await this.relationRepo.findOne({ where: { sender_id: receiverId, receiver_id: senderId, wait_friend: true} })))
				return true
			return false
		}
		catch {return "error"}
	}

	async getUsernameById(userId: string) {
		try {
			let user = await this.userRepo.findOne({
				select: {username: true},
				where: { ft_id: userId }})
			return user.username
		}
		catch {return {status: "error"}}
	}

	async createChannelInvitation(senderId: string, receiverId: string, chanId: number) {
		try {
			let toSave = {
				"sender_id": senderId,
				"receiver_id": receiverId,
				"channel_id" : chanId
			}
			const invitation = await this.chanInvitationRepo.create(toSave);
			return this.chanInvitationRepo.save(invitation);
		}
		catch {return "error"}
	}

	async getChannelNameById(chanId: number) {
		try {
			let chan = await this.chanRepo.findOne({
				select: {name: true},
				where: {id: chanId}
			})
			if (chan)
				return chan.name;
		}
		catch {return {status: "error"}}
	}

	async getChannelTypeById(chanId: number) {
		try {
			let chan = await this.chanRepo.findOne({
				select: {channel_type: true},
				where: {id: chanId}
			})
			if (chan)
				return chan.channel_type;
		}
		catch {return "error"}
	}

	async getChannelById(chanId: number) {
		try {
			let chan = await this.chanRepo.findOne({
				where: {id: chanId}
			})
			return chan;
		}
		catch {return "error"}
	}

	async getOwnerIdById(chanId: number) {
		try {
			let chan = await this.chanRepo.findOne({
				select: {owner_id: true},
				where: {id: chanId}
			})
			return chan.owner_id;
		}
		catch {return "error"}
	}

	async getStatusById(userId: string) {
		try {
			let user = await this.userRepo.findOne({
				select: {status: true},
				where: {ft_id: userId}
			})
			return user.status
		}
		catch {return "error"}
	}

	async getAllChannels(userId: string) {
		try {
			let publicAndPwdChannelsIds = await this.chanRepo.find({
				select: {id: true},
				where: [
					{ channel_type: "public" },
					{ channel_type: "password"}
				]
			});
			//console.log("public and password channels ids = ", publicAndPwdChannelsIds)
			let privateChannelsIds = await this.chanRepo.find({
				select: {id: true},
				where: { channel_type: "private"}
			});
			//console.log("private channels ids = ", privateChannelsIds)
			let joinedChannelsIds = await this.userinchanRepo.find({
				select: {chanid: true},
				where: { user_id: userId }
			})
			//console.log("joined channels ids = ", joinedChannelsIds)
			let joinedPrivateChannelsIds = []
			for (let i = 0; i < privateChannelsIds.length; i++) {
				for (let j = 0; j < joinedChannelsIds.length; j++) {
					if (privateChannelsIds[i].id == joinedChannelsIds[j].chanid)
						joinedPrivateChannelsIds.push(privateChannelsIds[i])
				}
			}
			//console.log("joined private channels ids = ", joinedPrivateChannelsIds)
			let pendingInvitations = await this.getPendingChanInvitations(userId)
			let pendingIds = []
			for (let i = 0; i < privateChannelsIds.length; i++) {
				for (let j = 0; j < pendingInvitations.length; j++) {
					if (privateChannelsIds[i].id == pendingInvitations[j].channel_id)
					pendingIds.push(privateChannelsIds[i])
				}
			}
			//console.log("pending channels ids = ",pendingIds)
			let finalIds = [...publicAndPwdChannelsIds, ...joinedPrivateChannelsIds, ...pendingIds]
			//console.log("final channels ids = ", finalIds)
			let finalChannels = []
			for (let i = 0; i < finalIds.length; i++) {
				let tmp = await this.getChannelById(finalIds[i].id)
				finalChannels[i] = tmp
			}
			//console.log("ALL CHANNELS :", finalChannels)
			let completedChannels = []
			for (let i = 0; i < finalChannels.length; i++) {
				let isInChan = await this.isUserInChan(userId, finalChannels[i].id)
				let isAdmin = await this.isAdmin(userId, finalChannels[i].id)
				let isOwner = await this.isOwner(userId, finalChannels[i].id)
				let isBanned = await this.isBannedInChan(userId, finalChannels[i].id)
				if (await this.isBannedInChan(userId, finalChannels[i].id) === false) {
					completedChannels.push({
						id: finalChannels[i].id,
						channel_type: finalChannels[i].channel_type,
						name: finalChannels[i].name,
						owner_id: finalChannels[i].owner_id,
						is_in_chan: isInChan,
						is_admin: isAdmin,
						is_owner: isOwner,
						is_banned: isBanned,
						is_selected: false,
						color: 'none'
					})
				}
			}
			//console.log(completedChannels)
			return completedChannels;
		}
		catch {return "error"}
	}

	async getPendingChanInvitations(userId: string) {
		try {
			let tab = await this.chanInvitationRepo.find({
				select: {channel_id: true},
				where: {receiver_id: userId}
			})
			return tab
		}
		catch {return "error"}
	}

	async getAllUsers(): Promise<User[] | string> {
		try {
			let users = await this.userRepo.find({select: {ft_id: true}})
			return users
		}
		catch {return "error"}
	}

	async getUsersInChan(chan_id: number) {
		try {
			let users = await this.userinchanRepo.find({
				select: {user_id: true, username: true, is_admin: true, is_banned: true, isowner: true},
				where: {chanid: chan_id}
			})
			return users;
		}
		catch {return "error"}
	}

	async isInvitedToChan(userId: string, chanId: number) {
		try {
			if (await this.chanInvitationRepo.findOne({ where: {receiver_id: userId, channel_id: chanId}}))
				return true
			return false
		}
		catch {return "error"}
	}

	async deleteChannelInvitations(userId: string, chanId: number) {
		try {
			await this.chanInvitationRepo.delete({receiver_id: userId, channel_id: chanId});
		}
		catch {return "error"}
	}

	async getUsersNotInChan(chanId: number) {
		try {
			let usersNotInChan = []
		let allUsers = await this.userRepo.find()
		console.log(allUsers)
		for (let i = 0; i < allUsers.length; i++) {
			let isInChan = await this.isUserInChan(allUsers[i].ft_id, chanId)
			if (isInChan === false)
				usersNotInChan.push(allUsers[i].ft_id)
		}
		return usersNotInChan;
		}
		catch {return "error"}
	}

	async createChannel(userId: string, name: string, type: string, password: string) {
		try {
			let hash = ""
			const saltOrRounds = 10;
			if (password)
				hash = await bcrypt.hash(password, saltOrRounds);
			let json = {
				"name": name,
				"password": hash,
				"owner_id": userId,
				"channel_type": type,
			};
			const chan = await this.chanRepo.create(json);
			const chann = await this.chanRepo.save(chan);
			let adduser = {
				"user_id": userId,
				"chanid": chann.id,
				"username": await this.getUsernameById(userId),
				"isowner": true,
				"is_admin": true,
				"is_in_chan": true
			};
			const addusers = await this.userinchanRepo.create(adduser);
			const test = await this.userinchanRepo.save(addusers);
			let ret = {		
				"name": chann.name,
				"owner_id": chann.owner_id,
				"channel_type": chann.channel_type,
				"id": chann.id,
			}
			return (ret)
		}
		catch {return "error"}
	}

	async changePassword(userId: string, chanId: number, password: string) {
		try {
			if (!password) {
				await this.chanRepo
					.createQueryBuilder()
					.update(Channels)
					.set({ password: password, channel_type: "public"})
					.where("id= :id", { id: chanId })
					.execute()
			}
			else {
				const saltOrRounds = 10;
				let hash = await bcrypt.hash(password, saltOrRounds);
				await this.chanRepo
					.createQueryBuilder()
					.update(Channels)
					.set({ password: hash, channel_type: "password"})
					.where("id= :id", { id: chanId })
					.execute()
			}
		}
		catch {return "error"}
	}

	//async deletechannel(chan: DeleteChanDTO) {
	//	try {
	//		
	//	}
	//	let usernametoken = await this.validateUser(chan.token);
	//	if (!usernametoken)
	//		return {status: "KO", message: "Invalid Token"}
	//	if (await this.userinchanRepo.findOne({
	//		where: { isowner: true, chanid: chan.chan_id, user_id: usernametoken.ft_id}
	//	})) {
	//		await this.chanRepo.delete({id: chan.chan_id});
	//		return {status: "OK", message: "The channel was delete succesfully"};
	//	}
	//	return {status: "KO", message: "The user is not the owner of the channel"};
	//}

	async isBlockedBy(requestId: string, targetId: string) {
		try {
			if (await this.relationRepo.findOne({ where: {sender_id: requestId, receiver_id: targetId, is_block: true}}))
				return true
			return false
		}
		catch {return "error"}
	}

	async getChanMsg(userId: string, chanId: number) {
		try {
			await this.userinchanRepo.findOne({
				where: { chanid: chanId, user_id: userId }
			})
			if (await this.userinchanRepo.findOne({
				where: { chanid: chanId, user_id: userId }
			})) {
				let messages = await this.msgRepo.find({
					where: { chan_id: chanId }
				})
				let tab = [];
				for (let i = 0; i < messages.length; i++) {
					let isBlocked = await this.isBlockedBy(userId, messages[i].author)
					if (isBlocked === false) {
						let json = {
							id: messages[i].id,
							author: messages[i].author,
							author_name: await this.getUsernameById(messages[i].author),
							chan_id: messages[i].chan_id,
							content: messages[i].content,
						}
						tab.push(json)
					}
				}
				return tab;
			}
		}
		catch(error) {return "error"}
	}

	async joinChannel(chan: JoinChanDTO) {
		try {
			let usernametoken = await this.validateUser(chan.token);
			let json = {
				"user_id": usernametoken.ft_id,
				"chanid": chan.chan_id,
				"username": await this.getUsernameById(usernametoken.ft_id),
				"isowner": false,
				"isadmin": false
			};
			let tmp = await this.chanRepo.findOne({
				where: {id: chan.chan_id, channel_type: "password"}
			})
			if (tmp) {
				const isMatch = await bcrypt.compare(chan.password, tmp.password);
				if (isMatch === true) {
					let user = await this.userinchanRepo.create(json);
					await this.userinchanRepo.save(user);
					return {status: "OK"};
				}
				return {status: "KO"};
			}
			if (await this.chanRepo.findOne({
				where: {id: chan.chan_id, channel_type: "public"}
			})) {
				let user = await this.userinchanRepo.create(json);
				await this.userinchanRepo.save(user);
				return {status: "OK"};
			}
			if (await this.chanRepo.findOne({
				where: {id: chan.chan_id, channel_type: "private"}
			})) {
				let user = await this.userinchanRepo.create(json);
				await this.userinchanRepo.save(user);
				return {status: "OK"};
			}
			return {status: "KO"};
		}
		catch {return "error"}
	}

	async leaveChannel(userId: string, chanId: number) {
		try {
			let channelToLeave = await this.chanRepo.findOne({
				where: {id: chanId}
			})
			let ret1 = {
				channelType: channelToLeave.channel_type,
				ownerLeft: false,
			}
			await this.userinchanRepo.delete({chanid: chanId, user_id: userId})
			if (channelToLeave.owner_id === userId) {
				let ret2 = {
					channelType: channelToLeave.channel_type,
					ownerLeft: true,
				}
				await this.chanRepo.delete({id: chanId})
				return ret2
			}
			else
				return ret1
		}
		catch {return "error"}
	}
}
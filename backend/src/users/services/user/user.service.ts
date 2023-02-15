import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/typeorm';
import { GameHistory } from 'src/typeorm/entities/GameHistory';
import { UsersRelation } from 'src/typeorm/entities/UserRelations';
import { AddFriendDTO, BlockuserDTO, EmailDTO, GameHistoryDTO, ImageDTO, UpdateUserDTO, UserDTO, UsernameDTO } from 'src/users/dto/User.dto';
import { Repository } from 'typeorm';
import { IUserService } from '../../user';
import { types } from 'pg';

@Injectable()
export class UserService{
	constructor (
		@InjectRepository(User) private readonly userRepo: Repository<User>,
		@InjectRepository(UsersRelation) private readonly relationRepo: Repository<UsersRelation>,
		@InjectRepository(GameHistory) private readonly historyRepo: Repository<GameHistory>
	) {}

	async validateUser(token: string)
	{
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

	async userExists(userId: string)
	{
		try {
			if (await this.userRepo.findOne({ where: {ft_id: userId}}))
				return true
			return false
		}
		catch {
			return "error"
		}
		
	}

	async isBlockedBy(requestId: string, targetId: string) {
		try {
			if (await this.relationRepo.findOne({ where: {sender_id: requestId, receiver_id: targetId, is_block: true}}))
				return true
			return false
		}
		catch {
			return "error"
		}
	}

	async changeImage(userId: string, image: string) {
		try {
			await this.userRepo
    			.createQueryBuilder()
    			.update(User)
    			.set({ avatar: image })
    			.where("ft_id= :id", { id: userId })
    			.execute();
			return image
		}
		catch {
			return "error"
		}
	}

	async isSameUsername(userId: string, newUsername: string) {
		try {
			let res = await this.userRepo.findOne({
				select: {username: true},
				where: {ft_id: userId}
			})
			if (res.username === newUsername)
				return true
			return false
		}
		catch {
			return "error"
		}
	}

	async usernameExists(newUsername: string) {
		try {
			if (await this.userRepo.findOne({
				select: {username: true},
				where: {username: newUsername}
			}))
				return true
			return false
		}
		catch {
			return "error"
		}
	}

	async changeEmail(userId: string, email: string)
	{
		try {
			await this.userRepo
				.createQueryBuilder()
				.update(User)
				.set({ email: email })
				.where("ft_id= :id", { id: userId })
				.execute();
			return email
		}
		catch {
			return "error"
		}
	}

	async changeUsername(userId: string, username: string) {
		try {
			await this.userRepo
    		.createQueryBuilder()
    		.update(User)
    		.set({ username: username })
    		.where("ft_id= :id", { id: userId })
    		.execute();
		}
		catch {
			return "error"
		}
	}

	async getUsersInfos(id: string) {
		try {
			let user = await this.userRepo.findOne({
				select: { username: true, avatar: true, one_party_played: true, one_victory: true, ten_victory: true, nb_victory: true, nb_defeat: true, lvl: true, rank: true},
				where: { ft_id: id }
			})
			return user;
		}
		catch {
			return "error"
		}
	}

	async getMyInfos(userId: string) {
		try {
			let user = await this.userRepo.findOne({
				select: {username: true, avatar: true, is2fa: true, recup_emails: true, email: true},
				where: { ft_id: userId }
			})
			return user;
		}
		catch {
			return "error"
		}
	}

	async addFriend(senderId: string, receiverId: string) {
		try {
			let json = {
				"sender_id": senderId,
				"receiver_id": receiverId,
				"is_friend": false,
				"is_block": false,
				"wait_friend": true
			}
			const tmp = await this.relationRepo.create(json);
			await this.relationRepo.save(tmp);
		}
		catch {
			return "error"
		}
	}

	async removeRelation(senderId: string, receiverId: string) {
		try {
			await this.relationRepo.delete({sender_id: senderId, receiver_id: receiverId})
		}
		catch {
			return "error"
		}
	}

	async acceptFriend(senderId: string, receiverId: string) {
		try {
			if (await this.relationRepo.findOne({
				where: { sender_id: receiverId, receiver_id: senderId, wait_friend: true}
			})) {
				await this.relationRepo
					.createQueryBuilder()
					.update(UsersRelation)
					.set({ is_friend: true, wait_friend: false})
					.where("sender_id= :id", { id: receiverId })
					.execute()
			}
		}
		catch {
			return "error"
		}
	}

	async removeFriend(senderId: string, receiverId: string) {
		try {
			if (await this.relationRepo.findOne({
				where: {sender_id: senderId, receiver_id: receiverId, is_friend: true}
			})) {
				await this.relationRepo.delete({sender_id: senderId, receiver_id: receiverId, is_friend: true})
				return
			}
			if (await this.relationRepo.findOne({
				where: {sender_id: receiverId, receiver_id: senderId, is_friend: true}
			})) {
				await this.relationRepo.delete({sender_id: receiverId, receiver_id: senderId, is_friend: true})
				return
			}
		}
		catch {
			return "error"
		}
	}

	async blockUser(userId: string, targetId: string) {
		try {
			let json = {
				"sender_id": userId,
				"receiver_id": targetId,
				"is_friend": false,
				"is_block": true,
				"wait_friend": false,
			}
			const tmp = await this.relationRepo.create(json);
			await this.relationRepo.save(tmp);
		}
		catch {
			return "error"
		}
	}

	async deblockUser(userId: string, blockedId: string) {
		try {
			if (await this.relationRepo.find({
				where: { sender_id: userId, receiver_id: blockedId, is_block: true}
			}))
				await this.relationRepo.delete({sender_id: userId, receiver_id: blockedId, is_block: true});
		}
		catch {
			return "error"
		}
	}

	async getFriends(userId: string) {
		try {
			let tmp_friends1 = await this.relationRepo.find({
				select: {receiver_id: true},
				where: {sender_id: userId, is_friend: true}
			})
			let tmp_friends2 = await this.relationRepo.find({
				select: {sender_id: true},
				where: {receiver_id: userId, is_friend: true}
			})
			let all_users;
			let x = 0;
			let tab = []
			for (let i = 0; i < tmp_friends1.length; i++) {
				all_users = await this.userRepo.findOne({
					select: {ft_id: true, username: true, status: true},
					where: {ft_id: tmp_friends1[i].receiver_id}
				})
				tab[x] = all_users;
				x++;
			}
			for (let i = 0; i < tmp_friends2.length; i++) {
				all_users = await this.userRepo.findOne({
					select: {ft_id: true, username: true, status: true},
					where: {ft_id: tmp_friends2[i].sender_id}
				})
				tab[x] = all_users;
				x++;
			}
			let friends = {tab};
			return friends;
		}
		catch {
			return "error"
		}
	}

	async getWaitFriends(userId: string) {
		try {
			let wait = await this.relationRepo.find({
				where: {receiver_id: userId, wait_friend: true}
			})
			let tab = []
			let x = 0;
			let all_users;
			for (let i = 0; i < wait.length; i++) {
				all_users = await this.userRepo.findOne({
					select: {ft_id: true, username: true},
					where: {ft_id: wait[i].sender_id}
				})
				tab[x] = all_users;
				x++;
			}
			return tab;
		}
		catch {
			return "error"
		}
	}

	async updateUser(user: UpdateUserDTO) {
		try {
			let profile = await this.userRepo.findOne({
				where: {ft_id: user.user_id}
			})
			let {elo} = profile;
			let {nb_victory} = profile;
			let {nb_defeat} = profile;
			let {lvl} = profile;
			let {xp} = profile;
			
			await this.relationRepo
					.createQueryBuilder()
					.update(User)
					.set({one_party_played: true})
					.where("ft_id= :id", { id: user.user_id })
					.execute();
			await this.relationRepo
			.createQueryBuilder()
			.update(User)
			.set({xp: xp + 2})
			.where("ft_id= :id", { id: user.user_id })
			.execute()
			if (user.victory === true) {
				await this.relationRepo
					.createQueryBuilder()
					.update(User)
					.set({nb_victory: nb_victory + 1, elo: elo + 5})
					.where("ft_id= :id", { id: user.user_id })
					.execute()
			}
			if (user.defeat === true) {
				await this.userRepo
					.createQueryBuilder()
					.update(User)
					.set({nb_defeat: nb_defeat + 1, elo: elo - 5})
					.where("ft_id= :id", { id: user.user_id })
					.execute()
			}
			profile = await this.userRepo.findOne({
				where: {ft_id: user.user_id}
			})
			if (profile.xp === 10) {
				await this.userRepo
					.createQueryBuilder()
					.update(User)
					.set({lvl: profile.lvl + 1, xp: 0})
					.where("ft_id= :id", { id: user.user_id })
					.execute()
			}
			profile = await this.userRepo.findOne({
				where: {ft_id: user.user_id}
			})
			if (profile.nb_victory >= 10) {
				await this.userRepo
					.createQueryBuilder()
					.update(User)
					.set({ten_victory: true})
					.where("ft_id= :id", { id: user.user_id })
					.execute()
			}
			profile = await this.userRepo.findOne({
				where: {ft_id: user.user_id}
			})
			if (profile.nb_victory >= 1) {
				await this.userRepo
					.createQueryBuilder()
					.update(User)
					.set({one_victory: true})
					.where("ft_id= :id", { id: user.user_id })
					.execute()
			}
			profile = await this.userRepo.findOne({
				where: {ft_id: user.user_id}
			})
			if (profile.elo <= 9) {
				await this.userRepo
					.createQueryBuilder()
					.update(User)
					.set({rank: "Bronze"})
					.where("ft_id= :id", { id: user.user_id })
					.execute()
			}
			profile = await this.userRepo.findOne({
				where: {ft_id: user.user_id}
			})
			if (profile.elo >= 10 && profile.elo < 30) {
				await this.userRepo
					.createQueryBuilder()
					.update(User)
					.set({rank: "Silver"})
					.where("ft_id= :id", { id: user.user_id })
					.execute()
			}
			profile = await this.userRepo.findOne({
				where: {ft_id: user.user_id}
			})
			if (profile.elo >= 30 && profile.elo < 49) {
				await this.userRepo
					.createQueryBuilder()
					.update(User)
					.set({rank: "Gold"})
					.where("ft_id= :id", { id: user.user_id })
					.execute()
			}
			profile = await this.userRepo.findOne({
				where: {ft_id: user.user_id}
			})
			if (profile.elo >= 50) {
				await this.userRepo
					.createQueryBuilder()
					.update(User)
					.set({rank: "Diamond"})
					.where("ft_id= :id", { id: user.user_id })
					.execute()
			}
		}
		catch {
			return "error"
		}
	}

	async isUserBlock(userId: string, targetId: string) {
		try {
			let block = await this.relationRepo.findOne({
				where: {sender_id: userId, receiver_id: targetId, is_block: true}
			})
			if (block)
				return true
			return false
		}
		catch {
			return "error"
		}
	}

	async isUserFriend(userId: string, targetId: string) {
		try {
			let friend = await this.relationRepo.findOne({
				where: [
					{sender_id: userId, receiver_id: targetId, is_friend: true},
					{sender_id: targetId, receiver_id: userId, is_friend: true}
				]
			})
			if (friend)
				return true
			return false
		}
		catch {
			return "error"
		}
	}

	async isUserWaitingFriend(userId: string, targetId: string) {
		try {
			let friend = await this.relationRepo.findOne({
				where: [
					{sender_id: userId, receiver_id: targetId, wait_friend: true},
					{sender_id: targetId, receiver_id: userId, wait_friend: true}
				]
			})
			if (friend)
				return true
			return false
		}
		catch {
			return "error"
		}
	}

	async blockedUsers(userId: string) {
		try {
			let blocked = await this.relationRepo.find({
				where: {sender_id: userId, is_block: true}
			})
			let tab = []
			let all_users;
			for(let i = 0; i < blocked.length; i++) {
				all_users = await this.userRepo.findOne({
					select: {ft_id: true, username: true},
					where: {ft_id: blocked[i].receiver_id}
				})
				tab.push(all_users)
			}
			return tab;
		}
		catch {
			return "error"
		}
	}

	async updateGameHistory(history: GameHistoryDTO) {
		try {
			if (history.is_win === true)
			{
				let data = {
					"user_id": history.user_id,
					"p1Score": history.p1Score,
					"p2Score": history.p2Score,
					"is_win": true,
					"vs_id": history.opponent
				}
				let user = await this.historyRepo.create(data)
				await this.historyRepo.save(user)
			}
			else if (history.is_win === false)
			{
				let data = {
					"user_id": history.user_id,
					"p1Score": history.p1Score,
					"p2Score": history.p2Score,
					"is_win": false,
					"vs_id": history.opponent
				}
				let user = await this.historyRepo.create(data)
				await this.historyRepo.save(user)
			}
		}
		catch {
			return "error"
		}
	}

	async getGameHistory(id: string) {
		try {
			let user = await this.historyRepo.find({
				where: {user_id: id},
				order: {
					id: 'DESC'
				}
			})
			let tab = []
			for (let i = 0; i < user.length; i++) {
				let opponent = await this.userRepo.findOne({
					where: {ft_id: user[i].vs_id}
				})
				let tab = []
				for (let i = 0; i < user.length; i++) {
					let opponent = await this.userRepo.findOne({
						where: {ft_id: user[i].vs_id}
					})
					let json = {
						"p1Score": user[i].p1Score,
						"p2Score": user[i].p2Score,
						"is_win": user[i].is_win,
						"mode": user[i].mode,
						"opp_username": opponent.username,
						"opp_id": opponent.ft_id
					}
					tab.push(json)
				}
				let res = []
				for (let i = tab.length - 1; i >= 0; i--) {
					res.push(tab[i])
				}
				return tab
			}
		}
		catch {
			return "error"
		}
	}

	async removeWaitFriend(userId: string, receiverId: string) {
		try {
			await this.relationRepo.delete({sender_id: receiverId, receiver_id: userId, wait_friend: true})
			await this.relationRepo.delete({sender_id: userId, receiver_id: receiverId, wait_friend: true})
		}
		catch {
			return "error"
		}
	}
}

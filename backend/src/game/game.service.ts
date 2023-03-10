import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/typeorm';
import { UsersRelation } from 'src/typeorm/entities/UserRelations';
import { PlainObjectToNewEntityTransformer } from 'typeorm/query-builder/transformer/PlainObjectToNewEntityTransformer';
import { DefaultDeserializer } from 'v8';
import { Server } from 'socket.io';
import { urlToHttpOptions } from 'url';
import { GameInvitation } from 'src/typeorm/entities/GameInvitation';
import { deleteGameDTO } from './game.dto';

export class game {
	id: number
	player1: string
	player2: string
	player1Name: string
	player2Name: string
	p1Socket: string
	p2Socket: string
	p1Score: number
	p2Score: number
	winner: string
	state: string
	type: string
	mode: string
	p1Y: number
	p2Y: number
	leavingPlayer: string
	ballX: number
	ballY: number
	ballR: number
	ballSpeedX: number
	ballSpeedY: number
	initialSpeedX: number
	canvasHeight: number
	canvasWidth: number
	paddleHeight: number
	paddleWidth: number
	maxSpeed: number
	spectators: string[]
	specSockets: string[]
}


@Injectable()
export class GameService {
	constructor(
		@InjectRepository(User) private readonly userRepo: Repository<User>,
		@InjectRepository(UsersRelation) private readonly relationRepo: Repository<UsersRelation>,
		@InjectRepository(GameInvitation) private readonly inviteRepo: Repository<GameInvitation>
		//private game: Map<string, string[]>,
	) { }
	private isInGame: Map<string, boolean> = new Map<string, boolean>();
	private gameArray: Array<game> = new Array<game>()

	//gameArray = new Array()
	//isInGame = new Map()
	gameCounter = 0

	//p1Y:number = 0
	//p2Y:number = 0
	//ballX:number = 0
	//ballY:number = 0
	//ballR:number = 6
	//ballSpeedX:number = 0
	//ballSpeedY:number = 0

	//p1Score:number = 0
	//p2Score:number = 0
	//state = "on"

	//canvasHeight:number = 450
	//canvasWidth:number = 900
	//paddleHeight:number = 80
	//paddleWidth:number = 5
	//maxSpeed:number = 10

	stop(i: number) {
		this.reset(i);
		this.gameArray[i].state = "finished"
		this.setStatus(this.gameArray[i].player1, "Online")
		this.setStatus(this.gameArray[i].player2, "Online")
		if (this.gameArray[i].p1Score === 3)
			this.gameArray[i].winner = "player1"
		else if (this.gameArray[i].p2Score === 3)
			this.gameArray[i].winner = "player2"
		// Init score
		//this.gameArray[i].p2Score = 0;
		//this.gameArray[i].p1Score = 0;
	}

	reset(i: number) {
		// Set ball and players to the center
		this.gameArray[i].ballX = this.gameArray[i].canvasWidth / 2;
		this.gameArray[i].ballY = this.gameArray[i].canvasHeight / 2
		this.gameArray[i].p1Y = this.gameArray[i].canvasHeight / 2 - this.gameArray[i].paddleHeight / 2;
		this.gameArray[i].p2Y = this.gameArray[i].canvasHeight / 2 - this.gameArray[i].paddleHeight / 2;

		// Reset speed
		this.gameArray[i].ballSpeedX = this.gameArray[i].initialSpeedX;
		this.gameArray[i].ballSpeedY = 0;
	}

	changeDirection(i: number, pY: number) {
		let impact = this.gameArray[i].ballY - pY - this.gameArray[i].paddleHeight / 2;
		let ratio = 100 / (this.gameArray[i].paddleHeight / 2);

		// Get a value between 0 and 10
		this.gameArray[i].ballSpeedY = Math.round(impact * ratio / 25);
	}

	collidePlayer1(i: number) {
		if (this.gameArray[i].ballY < this.gameArray[i].p1Y || this.gameArray[i].ballY > this.gameArray[i].p1Y + this.gameArray[i].paddleHeight) {
			this.reset(i)

			// Update score
			this.gameArray[i].p2Score++
			this.gameArray[i].ballSpeedX = this.gameArray[i].initialSpeedX;
			//document.querySelector('#computer-score').textContent = game.computer.score;
			//else {
			//	game.player.score++;
			//	setPlayerScore(game.player.score)
			//	game.ball.speed.x = +2;
			//	document.querySelector('#player-score').textContent = game.player.score;
			//}
			if (this.gameArray[i].p2Score === 3) {
				this.stop(i)
			}
		}
		else {
			// Change direction
			this.gameArray[i].ballSpeedX *= -1;
			this.changeDirection(i, this.gameArray[i].p1Y);

			// Increase speed if it has not reached max speed
			if (Math.abs(this.gameArray[i].ballSpeedX) < this.gameArray[i].maxSpeed) {
				if (this.gameArray[i].ballSpeedX < 0)
					this.gameArray[i].ballSpeedX -= 0.25;
				else
					this.gameArray[i].ballSpeedX += 0.25;
			}
			//if (Math.abs(this.gameArray[i].ballSpeedY) < this.gameArray[i].maxSpeed) {
			//	this.gameArray[i].ballSpeedY *= 1.15;
			//}
		}
	}

	collidePlayer2(i: number) {
		if (this.gameArray[i].ballY < this.gameArray[i].p2Y || this.gameArray[i].ballY > this.gameArray[i].p2Y + this.gameArray[i].paddleHeight) {
			this.reset(i)

			// Update score
			this.gameArray[i].p1Score++
			this.gameArray[i].ballSpeedX = this.gameArray[i].initialSpeedX * -1;
			//document.querySelector('#computer-score').textContent = game.computer.score;
			//else {
			//	game.player.score++;
			//	setPlayerScore(game.player.score)
			//	game.ball.speed.x = +2;
			//	document.querySelector('#player-score').textContent = game.player.score;
			//}
			if (this.gameArray[i].p1Score === 3) {
				this.stop(i)
			}
		}
		else {
			// Change direction
			this.gameArray[i].ballSpeedX *= -1;
			this.changeDirection(i, this.gameArray[i].p2Y);

			// Increase speed if it has not reached max speed
			//if (Math.abs(this.gameArray[i].ballSpeedX) < this.gameArray[i].maxSpeed) {
			//	this.gameArray[i].ballSpeedX += 0.25;
			//}
			//if (Math.abs(this.gameArray[i].ballSpeedY) < this.gameArray[i].maxSpeed) {
			//	this.gameArray[i].ballSpeedY += 0.25;
			//}
			if (Math.abs(this.gameArray[i].ballSpeedX) < this.gameArray[i].maxSpeed) {
				if (this.gameArray[i].ballSpeedX < 0)
					this.gameArray[i].ballSpeedX -= 0.25;
				else
					this.gameArray[i].ballSpeedX += 0.25;
			}
		}
	}

	moveBall(i: number) {
		if (this.gameArray[i].ballY > this.gameArray[i].canvasHeight || this.gameArray[i].ballY < 0) {
			this.gameArray[i].ballSpeedY *= -1;
		}

		if (this.gameArray[i].ballX > this.gameArray[i].canvasWidth - this.gameArray[i].paddleWidth) {
			this.collidePlayer2(i);
		}
		else if (this.gameArray[i].ballX < this.gameArray[i].paddleWidth) {
			this.collidePlayer1(i);
		}
		this.gameArray[i].ballX += this.gameArray[i].ballSpeedX;
		this.gameArray[i].ballY += this.gameArray[i].ballSpeedY;
	}

	movePlayer(i: number, movement: string, player: string) {
		if (player === "player1") {
			if (movement === "ArrowUp")
				this.gameArray[i].p1Y -= 4
			else if (movement === "ArrowDown")
				this.gameArray[i].p1Y += 4
		}
		else if (player === "player2") {
			if (movement === "ArrowUp")
				this.gameArray[i].p2Y -= 4
			else if (movement === "ArrowDown")
				this.gameArray[i].p2Y += 4
		}
	}

	getEndGameDataWhenP1Won(i: number) {
		let json = {
			"winner": "player1",
			"p1score": this.gameArray[i].p1Score,
			"p2score": this.gameArray[i].p2Score,
			"player1": this.gameArray[i].player1,
			"player2": this.gameArray[i].player2
		}
		return json
	}

	getEndGameDataWhenP2Won(i: number) {
		let json = {
			"winner": "player2",
			"p1score": this.gameArray[i].p1Score,
			"p2score": this.gameArray[i].p2Score,
			"player1": this.gameArray[i].player1,
			"player2": this.gameArray[i].player2
		}
		return json
	}

	getWinner(i: number) {
		if (i === -1)
			return "unknown"
		return this.gameArray[i].winner
	}

	getUpdateDTO(user_id: string, victory: boolean, defeat: boolean) {
		let json = {
			user_id: user_id,
			victory: victory,
			defeat: defeat
		}
		return json
	}

	getGameHistoryDTO(user_id: string, is_win: boolean, p1Score: number, p2Score: number, opponent: string) {
		let json = {
			user_id: user_id,
			is_win: is_win,
			p1Score: p1Score,
			p2Score: p2Score,
			opponent: opponent
		}
		return json
	}

	setGameState(i: number, str: string) {
		if (i === -1)
			return "unknown"
		this.gameArray[i].state = str
	}

	setLeaver(i: number, leaver: string) {
		if (i === -1)
			return "unknown"
		this.gameArray[i].leavingPlayer = leaver
		if (this.gameArray[i].player1 === leaver)
			this.gameArray[i].p1Socket = "left"
		else if (this.gameArray[i].player2 === leaver)
			this.gameArray[i].p2Socket = "left"
	}

	getLeaver(i: number) {
		if (i === -1)
			return "unknown"
		return this.gameArray[i].leavingPlayer
	}

	getP1Score(i: number) {
		if (i === -1)
			return -1
		return this.gameArray[i].p1Score
	}

	getP2Score(i: number) {
		if (i === -1)
			return -1
		return this.gameArray[i].p2Score
	}

	getGameState(i: number) {
		if (i === -1)
			return "unknown"
		return this.gameArray[i].state
	}

	getDataForP1(i: number) {
		let json = {
			"pY": this.gameArray[i].p2Y,
			"ballX": this.gameArray[i].ballX,
			"ballY": this.gameArray[i].ballY,
			"ballR": this.gameArray[i].ballR,
			"p1Score": this.gameArray[i].p1Score,
			"p2Score": this.gameArray[i].p2Score,
			"player1Name": this.gameArray[i].player1Name,
			"player2Name": this.gameArray[i].player2Name
		}
		return json
	}

	getPlayer1(i: number) {
		if (i == -1)
			return "unknown"
		return this.gameArray[i].player1
	}

	getUserIDFromSocket(i: number, socket: string) {
		if (i == -1)
			return "unknown"
		if (this.gameArray[i].p1Socket === socket)
			return this.gameArray[i].player1
		else if (this.gameArray[i].p2Socket === socket)
			return this.gameArray[i].player2
	}

	getPlayer2(i: number) {
		if (i == -1)
			return "unknown"
		return this.gameArray[i].player2
	}

	getDataForP2(i: number) {
		let json = {
			"pY": this.gameArray[i].p1Y,
			"ballX": this.gameArray[i].ballX,
			"ballY": this.gameArray[i].ballY,
			"ballR": this.gameArray[i].ballR,
			"p1Score": this.gameArray[i].p1Score,
			"p2Score": this.gameArray[i].p2Score,
			"player1Name": this.gameArray[i].player1Name,
			"player2Name": this.gameArray[i].player2Name
		}
		return json
	}

	spliceGame(i: number) {
		
		this.gameArray.splice(i, 1)
		
		
	}

	finishGame(i: number) {
		
		this.isInGame.delete(this.gameArray[i].player1)
		this.isInGame.delete(this.gameArray[i].player2)
		this.gameArray.splice(i, 1)
		
		
	}

	whichPlayer(socketId: string) {
		let i = this.getGameIndexFromSocket(socketId)
		if (this.gameArray[i].p1Socket === socketId)
			return "player1"
		else if (this.gameArray[i].p2Socket === socketId)
			return "player2"
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
			if (await this.userRepo.findOne({ where: { ft_id: userId } }))
				return true
			return false
		}
		catch { return "error" }
	}

	isAlreadyInGame(userId: string) {
		if (this.isInGame.get(userId) === true)
			return true
		return false
	}

	areGamesFull() {
		for (let i = 0; i < this.gameArray.length; i++) {
			if (this.gameArray[i].state === "waiting")
				return false
		}
		return true
	}

	getFirstAvailableGameIndex() {
		for (let i = 0; i < this.gameArray.length; i++) {
			if (this.gameArray[i].player2 === "")
				return i
		}
		return -1
	}

	getGameIdFromIndex(i: number) {
		return this.gameArray[i].id
	}

	getGameIdFromSocket(socketId: string) {
		let i = this.getGameIndexFromSocket(socketId)
		if (i != -1)
			return this.gameArray[i].id
		return -1
	}

	getGameIndexFromSocket(socketId: string) {
		for (let i = 0; i < this.gameArray.length; i++) {
			if (this.gameArray[i].p1Socket === socketId || this.gameArray[i].p2Socket === socketId)
				return i
		}
		return -1
	}

	isInGameSetter(userId: string, status: boolean) {
		this.isInGame.set(userId, status)
	}

	async isBlockedBy(requestId: string, targetId: string) {
		try {
			if (await this.relationRepo.findOne({ where: { sender_id: requestId, receiver_id: targetId, is_block: true } }))
				return true
			return false
		}
		catch { return "error" }
	}

	removeSpectator(i: number, userId: string, socketId: string) {
		
		
		for (let j = 0; j < this.gameArray[i].spectators.length; j++) {
			if (this.gameArray[i].spectators[j] === userId) {
				this.gameArray[i].spectators.splice(j, 1)
				break
			}
		}
		for (let j = 0; j < this.gameArray[i].specSockets.length; j++) {
			if (this.gameArray[i].specSockets[j] === socketId) {
				this.gameArray[i].specSockets.splice(j, 1)
				break
			}
		}
		
	}

	getGameIndexFromSpecSocket(socketId: string) {
		for (let i = 0; i < this.gameArray.length; i++) {
			for (let j = 0; j < this.gameArray[i].specSockets.length; j++) {
				if (this.gameArray[i].specSockets[j] === socketId)
					return i
			}
		}
		return -1
	}

	handleDisconnect(socketId: string) {
		let i = this.getGameIndexFromSocket(socketId)
		if (i === -1)
			return
		if (this.gameArray[i].state === "waiting" || this.gameArray[i].state == "waitingForFriend") {
			this.isInGame.delete(this.gameArray[i].player1)
			this.gameArray.splice(i, 1)
		}
		else if (this.gameArray[i].state == "waitingFor2Ready" || this.gameArray[i].state == "waitingFor1Ready") {
			this.isInGame.delete(this.gameArray[i].player1)
			this.isInGame.delete(this.gameArray[i].player2)
			this.gameArray.splice(i, 1)
		}
		else if (this.gameArray[i].state == "on") {
			this.isInGame.delete(this.gameArray[i].player1)
			this.isInGame.delete(this.gameArray[i].player2)
			this.gameArray[i].state = "toBeStopped"
			if (this.gameArray[i].p1Socket === socketId) {
				this.gameArray[i].p1Socket = "left"
				this.gameArray[i].leavingPlayer = this.gameArray[i].player1
			}
			else if (this.gameArray[i].p2Socket === socketId) {
				this.gameArray[i].p2Socket = "left"
				this.gameArray[i].leavingPlayer = this.gameArray[i].player2
			}
		}
	}

	async joinGame(userId: string, socketId: string) {
		let p2name = await this.getUsernameById(userId)
		if (typeof (p2name) != "string")
			return "error"
		let i = this.getFirstAvailableGameIndex()
		if (i === -1)
			return
		this.isInGame.set(userId, true)
		this.gameArray[i] = {
			"id": this.gameArray[i].id,
			"player1": this.gameArray[i].player1,
			"player2": userId,
			"player1Name": this.gameArray[i].player1Name,
			"player2Name": p2name,
			"p1Socket": this.gameArray[i].p1Socket,
			"p2Socket": socketId,
			"p1Score": 0,
			"p2Score": 0,
			"winner": "unknown",
			"state": "on",
			"type": "public",
			"mode": "easy",
			"p1Y": 0,
			"p2Y": 0,
			"leavingPlayer": "",
			"ballX": 0,
			"ballY": 0,
			"ballR": 6,
			"ballSpeedX": 0,
			"ballSpeedY": 0,
			"initialSpeedX": -2,
			"canvasHeight": 450,
			"canvasWidth": 900,
			"paddleHeight": 80,
			"paddleWidth": 5,
			"maxSpeed": 10,
			"spectators": this.gameArray[i].spectators,
			"specSockets": this.gameArray[i].specSockets
		}
		this.setStatus(this.gameArray[i].player1, "In Game")
		this.setStatus(this.gameArray[i].player2, "In Game")
		
		
		return this.gameArray[i].p1Socket
	}

	async setPlayersStatus(i: number, status: string) {
		try {
			await this.userRepo
				.createQueryBuilder()
				.update(User)
				.set({ status: status })
				.where("ft_id = :id", { id: this.gameArray[i].player1 })
				.execute()
			await this.userRepo
				.createQueryBuilder()
				.update(User)
				.set({ status: status })
				.where("ft_id = :id", { id: this.gameArray[i].player2 })
				.execute()
		}
		catch { return "error" }
	}

	async setStatus(userId: string, status: string) {
		try {
			await this.userRepo
				.createQueryBuilder()
				.update(User)
				.set({ status: status })
				.where("ft_id = :id", { id: userId })
				.execute()
		}
		catch { return "error" }
	}

	getGameIndexFromId(gameId: number) {
		for (let i = 0; i < this.gameArray.length; i++) {
			if (this.gameArray[i].id === gameId)
				return i
		}
		return -1
	}

	getPrivateGameIndex(ownerId: string, invitedId: string) {
		for (let i = 0; i < this.gameArray.length; i++) {
			if (this.gameArray[i].player1 === ownerId && this.gameArray[i].player2 === invitedId)
				return i
		}
		return -1
	}

	getGameIndexFromUserId(userId: string) {
		for (let i = 0; i < this.gameArray.length; i++) {
			if (this.gameArray[i].player1 === userId || this.gameArray[i].player2 === userId) {
				if (this.gameArray[i].state === "on")
					return i
			}
		}
		return -1
	}

	getP1Socket(i: number) {
		return this.gameArray[i].p1Socket
	}

	getP2Socket(i: number) {
		return this.gameArray[i].p2Socket
	}

	isPlayer1(i: number, userId: string) {
		if (this.gameArray[i].player1 === userId)
			return true
		return false
	}

	printArray() {
		
	}

	printIsInGame() {
		
	}

	isAlreadySpectating(userId: string, friendId: string) {
		let i = this.getGameIndexFromUserId(friendId)
		
		if (i === -1)
			return
		for (let j = 0; j < this.gameArray[i].spectators.length; j++) {
			if (this.gameArray[i].spectators[j] === userId)
				return true
		}
		return false
	}

	getDataForSpecs(i: number) {
		let json = {
			"p1Y": this.gameArray[i].p1Y,
			"p2Y": this.gameArray[i].p2Y,
			"ballX": this.gameArray[i].ballX,
			"ballY": this.gameArray[i].ballY,
			"ballR": this.gameArray[i].ballR,
			"p1Score": this.gameArray[i].p1Score,
			"p2Score": this.gameArray[i].p2Score,
			"padHeight": this.gameArray[i].paddleHeight,
			"player1Name": this.gameArray[i].player1Name,
			"player2Name": this.gameArray[i].player2Name
		}
		return json
	}

	hasSpectators(i: number) {
		if (this.gameArray[i].spectators.length > 0 || this.gameArray[i].specSockets.length > 0)
			return true
		return false
	}

	getSpectatorsSockets(i: number) {
		return this.gameArray[i].specSockets
	}

	addSpectator(i: number, spectatorId: string, spectatorSocketId: string) {
		this.gameArray[i].spectators.push(spectatorId)
		this.gameArray[i].specSockets.push(spectatorSocketId)
	}

	joinPrivateGame(invitedId: string, invitedSocketId: string, ownerId: string) {
		let i = this.getPrivateGameIndex(ownerId, invitedId)
		if (i === -1)
			return
		this.isInGame.set(invitedId, true)
		this.gameArray[i] = {
			"id": this.gameArray[i].id,
			"player1": this.gameArray[i].player1,
			"player2": this.gameArray[i].player2,
			"player1Name": this.gameArray[i].player1Name,
			"player2Name": this.gameArray[i].player2Name,
			"p1Socket": this.gameArray[i].p1Socket,
			"p2Socket": invitedSocketId,
			"p1Score": 0,
			"p2Score": 0,
			"winner": "unknown",
			"state": "waitingFor2Ready",
			"type": "private",
			"mode": "easy",
			"p1Y": 0,
			"p2Y": 0,
			"leavingPlayer": "",
			"ballX": 0,
			"ballY": 0,
			"ballR": 6,
			"ballSpeedX": 0,
			"ballSpeedY": 0,
			"initialSpeedX": this.gameArray[i].initialSpeedX,
			"canvasHeight": 450,
			"canvasWidth": 900,
			"paddleHeight": this.gameArray[i].paddleHeight,
			"paddleWidth": 5,
			"maxSpeed": this.gameArray[i].maxSpeed,
			"spectators": this.gameArray[i].spectators,
			"specSockets": this.gameArray[i].specSockets
		}
		
		
		let json = {
			"otherSocket": this.gameArray[i].p1Socket,
			"index": i
		}
		return json
	}

	async getUsernameById(userId: string) {
		try {
			let user = await this.userRepo.findOne({
				select: { username: true },
				where: { ft_id: userId }
			})
			return user.username
		}
		catch { return { status: "error" } }
	}

	async createPrivateGame(ownerId: string, ownerSocketId: string, invitedId: string, mode: string) {
		let p1name = await this.getUsernameById(ownerId)
		if (typeof (p1name) != "string")
			return "error"
		let p2name = await this.getUsernameById(invitedId)
		if (typeof (p2name) != "string")
			return "error"
		this.isInGame.set(ownerId, true)
		let padHeight
		let initialball
		let maxpeed
		if (mode === "easy") {
			padHeight = 80
			initialball = -2
			maxpeed = 10
		}
		else if (mode === "hard") {
			padHeight = 40
			initialball = -4
			maxpeed = 20
		}
		let json = {
			"id": this.gameCounter++,
			"player1": ownerId,
			"player2": invitedId,
			"player1Name": p1name,
			"player2Name": p2name,
			"p1Socket": ownerSocketId,
			"p2Socket": "waitingForAnswer",
			"p1Score": 0,
			"p2Score": 0,
			"winner": "unknown",
			"state": "waitingForFriend",
			"type": "public",
			"mode": mode,
			"p1Y": 0,
			"p2Y": 0,
			"leavingPlayer": "",
			"ballX": 0,
			"ballY": 0,
			"ballR": 6,
			"ballSpeedX": 0,
			"ballSpeedY": 0,
			"initialSpeedX": initialball,
			"canvasHeight": 450,
			"canvasWidth": 900,
			"paddleHeight": padHeight,
			"paddleWidth": 5,
			"maxSpeed": maxpeed,
			"spectators": [],
			"specSockets": []
		}
		this.gameArray.push(json)
		
		
	}

	async createGame(userId: string, socketId: string) {
		let username = await this.getUsernameById(userId)
		if (typeof (username) != "string")
			return "error"
		this.isInGame.set(userId, true)
		let json = {
			"id": this.gameCounter++,
			"player1": userId,
			"player2": "",
			"player1Name": username,
			"player2Name": "",
			"p1Socket": socketId,
			"p2Socket": "",
			"p1Score": 0,
			"p2Score": 0,
			"winner": "unknown",
			"state": "waiting",
			"type": "public",
			"mode": "easy",
			"p1Y": 0,
			"p2Y": 0,
			"leavingPlayer": "",
			"ballX": 0,
			"ballY": 0,
			"ballR": 6,
			"ballSpeedX": 0,
			"ballSpeedY": 0,
			"initialSpeedX": -2,
			"canvasHeight": 450,
			"canvasWidth": 900,
			"paddleHeight": 80,
			"paddleWidth": 5,
			"maxSpeed": 10,
			"spectators": [],
			"specSockets": []
		}
		this.gameArray.push(json)
		
		
	}

	async getGameInvitation(userId: string) {
		try {
			let game = await this.inviteRepo.find({
				where: { receiver_id: userId }
			})
			let tab = []
			for (let i = 0; i < game.length; i++) {
				let user = await this.userRepo.findOne({
					where: { ft_id: game[i].sender_id }
				})
				let json = {
					sender_username: user.username,
					sender_id: user.ft_id,
					mode: game[i].mode
				}
				tab.push(json)
			}
			return tab
		}
		catch { return "error" }
	}

	deleteGame(i: number) {
		this.isInGame.delete(this.gameArray[i].player1)
		this.isInGame.delete(this.gameArray[i].player2)
		this.gameArray.splice(i, 1)
	}

	async inviteExists(senderId: string, receiverId: string) {
		try {
			if (await this.inviteRepo.findOne({ where: { sender_id: senderId, receiver_id: receiverId } }))
				return true
			return false
		}
		catch { return "error" }
	}

	async deleteGameInvitation(senderId: string, receiverId: string) {
		try {
			await this.inviteRepo.delete({ sender_id: senderId, receiver_id: receiverId })
			return
		}
		catch { return "error" }
	}
}

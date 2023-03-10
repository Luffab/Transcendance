import { WebSocketGateway, SubscribeMessage, MessageBody, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, ConnectedSocket,} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UserService } from 'src/users/services/user/user.service';
import { GameService } from './game.service';


export interface createGameDetails {
	jwt: string;
	socketId: string;
}

export interface createPrivateGameDetails {
	jwt: string;
	socketId: string;
	receiverId: string;
	mode: string
}

export interface spectateGameDetails {
	jwt: string;
	socketId: string;
	friendId: string;
}

export interface joinPrivateGameDetails {
	jwt: string;
	socketId: string;
	ownerId: string;
}

export interface dataToClient {
	player2Y: number;
	gameBallX: number;
	gameBallY: number;
	gameBallR: number;
}

export interface dataFromClient {
	jwt: string;
	socketId: string;
	movement: string;
}

@WebSocketGateway({
	cors: {
		origine: '*',
	},
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
	@WebSocketServer()
	server: Server;

	constructor(
		private readonly gameService: GameService,
		private readonly userService: UserService,
	) {}
	private gameIntervals: Map<number, NodeJS.Timer>= new  Map<number, NodeJS.Timer>()
	private isReady: Map<string, boolean>= new  Map<string, boolean>()

	async sendErrorMessage(socket: string, event: string, error: string) {
		this.server.to(socket).emit(event, error)
	}

	async keepPlaying(self: GameGateway, p1Socket: string, p2Socket: string) {
		let i = self.gameService.getGameIndexFromSocket(p1Socket)
		if (i === -1)
			i = self.gameService.getGameIndexFromSocket(p2Socket)
		let p1 = self.gameService.getPlayer1(i);
		let p2 = self.gameService.getPlayer2(i);
		if (self.gameService.getGameState(i) === "on") {
			self.gameService.moveBall(i)
			self.server.to(p1Socket).emit("dataTransfer", self.gameService.getDataForP1(i))
			self.server.to(p2Socket).emit("dataTransfer", self.gameService.getDataForP2(i))
			if (self.gameService.hasSpectators(i) === true)
				self.server.to(self.gameService.getSpectatorsSockets(i)).emit("dataTransfer", self.gameService.getDataForSpecs(i))
		}
		else if (self.gameService.getGameState(i) === "toBeStopped") {
			
			let gameId = self.gameService.getGameIdFromIndex(i)
			let leaver = self.gameService.getLeaver(i);
			if (leaver === self.gameService.getPlayer1(i)) {
				
				let data1 = self.gameService.getUpdateDTO(p2, true, false)
				let data2 = self.gameService.getUpdateDTO(p1, false, true)
				let his1 = self.gameService.getGameHistoryDTO(p2, true, 0, 3, p1)
				let his2 = self.gameService.getGameHistoryDTO(p1, false, 0, 3, p2)
				self.userService.updateUser(data1)
				self.userService.updateUser(data2)
				self.userService.updateGameHistory(his1)
				self.userService.updateGameHistory(his2)
				self.server.to(p2Socket).emit("killedGame", "player2")
				self.server.to(p1Socket).emit("killedGame", "player2")
				if (self.gameService.hasSpectators(i) === true) {
					self.server.to(self.gameService.getSpectatorsSockets(i)).emit("winTransfer", "player2")
				}
			}
			if (leaver === self.gameService.getPlayer2(i)) {
				
				let data1 = self.gameService.getUpdateDTO(p1, true, false)
				let data2 = self.gameService.getUpdateDTO(p2, false, true)
				let his1 = self.gameService.getGameHistoryDTO(p1, true, 3, 0, p2)
				let his2 = self.gameService.getGameHistoryDTO(p2, false, 3, 0, p1)
				self.userService.updateUser(data1)
				self.userService.updateUser(data2)
				self.userService.updateGameHistory(his1)
				self.userService.updateGameHistory(his2)
				self.server.to(p1Socket).emit("killedGame", "player1")
				self.server.to(p2Socket).emit("killedGame", "player1")
				if (self.gameService.hasSpectators(i) === true) {
					self.server.to(self.gameService.getSpectatorsSockets(i)).emit("winTransfer", "player1")
				}
			}
			clearInterval(self.gameIntervals.get(gameId))
			self.gameService.finishGame(i)
		}
		else if (self.gameService.getGameState(i) === "finished") {
			
			let gameId = self.gameService.getGameIdFromIndex(i)
			let p1s = self.gameService.getP1Score(i)
				let p2s = self.gameService.getP2Score(i)
			if (self.gameService.getWinner(i) === "player1") {
				let data1 = self.gameService.getUpdateDTO(p1, true, false)
				let data2 = self.gameService.getUpdateDTO(p2, false, true)
				let his1 = self.gameService.getGameHistoryDTO(p1, true,p1s, p2s, p2)
				let his2 = self.gameService.getGameHistoryDTO(p2, false, p1s, p2s, p1)
				self.userService.updateUser(data1)
				self.userService.updateUser(data2)
				self.userService.updateGameHistory(his1)
				self.userService.updateGameHistory(his2)
				let data = self.gameService.getEndGameDataWhenP1Won(i)
				self.server.to(p1Socket).emit("winTransfer", data)
				self.server.to(p2Socket).emit("winTransfer", data)
				if (self.gameService.hasSpectators(i) === true) {
					
					self.server.to(self.gameService.getSpectatorsSockets(i)).emit("winTransfer", "player1")
				}
			}
			else if (self.gameService.getWinner(i) === "player2") {
				let data1 = self.gameService.getUpdateDTO(p2, true, false)
				let data2 = self.gameService.getUpdateDTO(p1, false, true)
				let his1 = self.gameService.getGameHistoryDTO(p2, true, p1s, p2s, p1)
				let his2 = self.gameService.getGameHistoryDTO(p1, false, p1s, p2s, p2)
				self.userService.updateUser(data1)
				self.userService.updateUser(data2)
				self.userService.updateGameHistory(his1)
				self.userService.updateGameHistory(his2)
				let data = self.gameService.getEndGameDataWhenP2Won(i)
				self.server.to(p1Socket).emit("winTransfer", data)
				self.server.to(p2Socket).emit("winTransfer", data)
				if (self.gameService.hasSpectators(i) === true) {
					
					self.server.to(self.gameService.getSpectatorsSockets(i)).emit("winTransfer", "player2")
				}
			}
			clearInterval(self.gameIntervals.get(gameId))
			self.gameService.finishGame(i)
			
		}
	}

	@SubscribeMessage('userLeft')
	async handleBack(@ConnectedSocket() socket: Socket, @MessageBody() data: createGameDetails) {
		
		let decoded = await this.gameService.validateUser(data.jwt)
		if (decoded === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if (!decoded)
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: You are not authentified."))
		this.isReady.delete(decoded.ft_id)
		let i = this.gameService.getGameIndexFromSocket(socket.id)
		if (i === -1)
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Game does not exist."))
		if (this.gameService.getGameState(i) === "waiting") {
			this.gameService.deleteGame(i)
			return
		}
		if (this.gameService.getGameState(i) === "waitingForFriend") {
			this.gameService.deleteGame(i)
			return ;
		}
		else if ( this.gameService.getGameState(i) === "waitingFor2Ready" || this.gameService.getGameState(i) === "waitingFor1Ready") {
			this.gameService.deleteGame(i)
			return ;
		}
		let ret = await this.gameService.setPlayersStatus(i, "Online")
		this.gameService.setGameState(i, "toBeStopped")
		let user = this.gameService.getUserIDFromSocket(i, socket.id)
		this.gameService.setLeaver(i, user)
	}

	@SubscribeMessage('movePlayer')
	async movePlayer(@ConnectedSocket() socket: Socket, @MessageBody() data: dataFromClient) {
		
		let decoded = await this.gameService.validateUser(data.jwt)
		if (decoded === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if (!decoded)
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: You are not authentified."))
		let i = this.gameService.getGameIndexFromSocket(socket.id)
		if (i === -1)
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Game does not exist."))
		if (this.gameService.getGameState(i) === "on")
			this.gameService.movePlayer(i, data.movement, this.gameService.whichPlayer(socket.id))
	}

	@SubscribeMessage('tryToPlay')
	async tryToPlay(@ConnectedSocket() socket: Socket, @MessageBody() details: createGameDetails) {
		
		let decoded = await this.gameService.validateUser(details.jwt)
		if (decoded === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if (!decoded)
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: You are not authentified."))
		if (this.gameService.isAlreadyInGame(decoded.ft_id) === true)
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: You are already in a game."))
		
		if (this.gameService.areGamesFull() === true ) {
			let ret = await this.gameService.createGame(decoded.ft_id, socket.id)
			if (ret === "error")
				return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
			this.server.to(socket.id).emit("rightOrLeft", "left")
			this.server.to(socket.id).emit("matchOK", "You are now placed in the matchmaking queue !")
		}
		else {
			let ret2 = await this.gameService.joinGame(decoded.ft_id, socket.id)
			if (ret2 === "error")
				return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
			let i = this.gameService.getGameIndexFromSocket(socket.id)
			this.server.to(socket.id).emit("rightOrLeft", "right")
			this.gameService.reset(i)
			let self = this
			const tmpIntervalId = setInterval(this.keepPlaying, 10, self, ret2, socket.id)
			let tmpGameId = this.gameService.getGameIdFromSocket(ret2)
			this.gameIntervals.set(tmpGameId, tmpIntervalId)
		}
	}

	@SubscribeMessage('createPrivateGame')
	async createPrivateGame(@ConnectedSocket() socket: Socket, @MessageBody() details: createPrivateGameDetails) {
		
		let decoded = await this.gameService.validateUser(details.jwt)
		if (decoded === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if (!decoded)
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: You are not authentified."))
		this.gameService.printIsInGame()
		if (this.gameService.isAlreadyInGame(decoded.ft_id) === true)
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: You are already in a game."))
		if (await this.gameService.isBlockedBy(details.receiverId, decoded.ft_id) === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if (await this.gameService.isBlockedBy(details.receiverId, decoded.ft_id) === true)
			return
		let username = await this.gameService.getUsernameById(details.receiverId)
		if (typeof(username) != "string")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		let ret = await this.gameService.createPrivateGame(decoded.ft_id, socket.id, details.receiverId, details.mode)
		if (ret === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		this.server.to(socket.id).emit("success", username + " has been invited to play !")
	}

	@SubscribeMessage('joinPrivateGame')
	async joinPrivateGame(@ConnectedSocket() socket: Socket, @MessageBody() details: joinPrivateGameDetails) {
		
		let decoded = await this.gameService.validateUser(details.jwt)
		if (decoded === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if (!decoded)
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: You are not authentified."))
		if (this.gameService.isAlreadyInGame(decoded.ft_id) === true)
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: You are already in a game."))
		let username = await this.gameService.getUsernameById(decoded.ft_id)
		if (typeof(username) != "string")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		let ret = this.gameService.joinPrivateGame(decoded.ft_id, socket.id, details.ownerId)
		if (!ret)
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Game does not exist."))
		this.server.to(ret.otherSocket).emit("success", username + " has joined the game. You can now be ready to play !")
	}

	@SubscribeMessage('readyToGame')
	async readyToGame(@ConnectedSocket() socket: Socket, @MessageBody() details: createGameDetails) {
		
		let decoded = await this.gameService.validateUser(details.jwt)
		if (decoded === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if (!decoded)
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: You are not authentified."))
		let i = this.gameService.getGameIndexFromSocket(socket.id)
		if (i === -1)
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Game does not exist."))
		if (this.gameService.getGameState(i) === "waitingForFriend")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Invited user hasn't joined the game yet."))
		else if (this.gameService.getGameState(i) === "waitingFor2Ready") {
			if (this.gameService.isPlayer1(i, decoded.ft_id) === true)
				this.server.to(socket.id).emit("rightOrLeft", "left")
			else
				this.server.to(socket.id).emit("rightOrLeft", "right")
			this.isReady.set(decoded.ft_id, true)
			this.server.to(socket.id).emit("success", "You are now ready to play ! Waiting for your opponent to be ready.")
			this.gameService.setGameState(i, "waitingFor1Ready")
		}
		else if (this.gameService.getGameState(i) === "waitingFor1Ready") {
			if (this.isReady.get(decoded.ft_id) === true) {
				
				return (this.sendErrorMessage(socket.id, "receiveError", "Error: You are already ready."))
			}
			this.isReady.delete(this.gameService.getPlayer1(i))
			this.isReady.delete(this.gameService.getPlayer2(i))
			if (this.gameService.isPlayer1(i, decoded.ft_id) === true)
				this.server.to(socket.id).emit("rightOrLeft", "left")
			else
				this.server.to(socket.id).emit("rightOrLeft", "right")
			
			let ret = await this.gameService.setPlayersStatus(i, "In Game")
			if (ret === "error")
				return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
			this.isReady.set(decoded.ft_id, true)
			let p1Socket = this.gameService.getP1Socket(i)
			let p2Socket = this.gameService.getP2Socket(i)
			this.gameService.setGameState(i, "on")
			this.gameService.reset(i)
			let self = this
			let tmpIntervalId = setInterval(this.keepPlaying, 10, self, p1Socket, p2Socket)
			let tmpGameId = this.gameService.getGameIdFromSocket(p1Socket)
			
			this.gameIntervals.set(tmpGameId, tmpIntervalId)
		}
		this.gameService.printArray()
	}

	@SubscribeMessage('spectateGame')
	async spectateGame(@ConnectedSocket() socket: Socket, @MessageBody() details: spectateGameDetails) {
		
		let decoded = await this.gameService.validateUser(details.jwt)
		if (decoded === "error")
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: Wrong data types."))
		if (!decoded)
			return (this.sendErrorMessage(socket.id, "receiveError", "Error: You are not authentified."))
		if (this.gameService.isAlreadySpectating(decoded.ft_id, details.friendId) === true)
			return(this.sendErrorMessage(socket.id, "receiveError", "Error: You are already spectating this game."))
		let i = this.gameService.getGameIndexFromUserId(details.friendId)
		if (i === -1)
			return(this.sendErrorMessage(socket.id, "receiveError", "Error: Your friend is not in game."))
		if (this.gameService.getGameState(i) === "on") {
			this.gameService.addSpectator(i, decoded.ft_id, socket.id)
		}
	}

	async handleConnection(client: Socket, ...args: any[]) {
		
		
		
		if (client.handshake.query.jwt === "null")
			return
		if (client.handshake.query.jwt) {
			let token = client.handshake.query.jwt.toString()
			let decoded = await this.gameService.validateUser(token)
			if (decoded === "error")
				return
			if (!decoded)
				return
		}
	}

	async handleDisconnect(client: Socket, ...args: any[]) {
		
		
		
		
		if (client.handshake.query.jwt === "null")
			return
		if (client.handshake.query.jwt) {
			let token = client.handshake.query.jwt.toString()
			let decoded = await this.gameService.validateUser(token)
			if (decoded === "error")
				return
			if (!decoded)
				return
			this.isReady.delete(decoded.ft_id)
			let i = this.gameService.getGameIndexFromSpecSocket(client.id)
			if (i != -1)
				this.gameService.removeSpectator(i, decoded.ft_id, client.id)
			else
				this.gameService.handleDisconnect(client.id)
		}
	}
}

import { Module } from '@nestjs/common';
import { GameService } from './game.service';
import { GameGateway } from './game.gateway';
import UsersInChan from 'src/typeorm/entities/UserinChan';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/typeorm';
import { UsersRelation } from 'src/typeorm/entities/UserRelations';
import { Server } from 'socket.io';
import { UserService } from 'src/users/services/user/user.service';
import { GameHistory } from 'src/typeorm/entities/GameHistory';
import { GameInvitation } from 'src/typeorm/entities/GameInvitation';
import { GameController } from './game.controller';

@Module({
	controllers: [GameController],
	providers: [GameGateway, GameService, Array, Map, Server, UserService],
	imports: [TypeOrmModule.forFeature([User]), TypeOrmModule.forFeature([UsersRelation]), TypeOrmModule.forFeature([GameHistory]), TypeOrmModule.forFeature([GameInvitation])],
	exports: [GameService]
})
export class GameModule {}

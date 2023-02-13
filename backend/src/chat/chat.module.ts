import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import Channels from 'src/typeorm/entities/Channels';
import UsersInChan from 'src/typeorm/entities/UserinChan';
import Messages from 'src/typeorm/entities/Messages';
import { ChatController } from './chat.controller';
import { UserService } from 'src/users/services/user/user.service';
import { User } from 'src/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';
import { UsersRelation } from 'src/typeorm/entities/UserRelations';
import { ChannelInvitation } from 'src/typeorm/entities/ChannelInvitation';
import { GameHistory } from 'src/typeorm/entities/GameHistory';
import PrivateDiscussions from 'src/typeorm/entities/PrivateDiscussions';
import DirectMessages from 'src/typeorm/entities/DirectMessages';
import { GameInvitation } from 'src/typeorm/entities/GameInvitation';

@Module({
	controllers:[ChatController],
	providers: [ChatGateway, ChatService, UsersInChan, UserService, Map],
	imports: [UsersInChan,TypeOrmModule.forFeature([Channels]), TypeOrmModule.forFeature([UsersInChan]), TypeOrmModule.forFeature([Messages]), TypeOrmModule.forFeature([User]), TypeOrmModule.forFeature([UsersRelation]), TypeOrmModule.forFeature([ChannelInvitation]), TypeOrmModule.forFeature([GameHistory]), TypeOrmModule.forFeature([PrivateDiscussions]), TypeOrmModule.forFeature([DirectMessages]), TypeOrmModule.forFeature([GameInvitation])],
	exports: [ChatService]
})
export class ChatModule {}

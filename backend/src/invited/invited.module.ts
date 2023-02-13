import { Module } from '@nestjs/common';
import { InvitedController } from './invited.controller';
import { InvitedService } from './invited.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/typeorm';
import { UserService } from 'src/users/services/user/user.service';
import { UsersRelation } from 'src/typeorm/entities/UserRelations';
import { GameHistory } from 'src/typeorm/entities/GameHistory';

@Module({
	controllers: [InvitedController],
	providers: [UserService, InvitedService],
	imports: [TypeOrmModule.forFeature([User]), TypeOrmModule.forFeature([UsersRelation]), TypeOrmModule.forFeature([GameHistory])]
})
export class InvitedModule {}

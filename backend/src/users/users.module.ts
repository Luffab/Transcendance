import { Module } from '@nestjs/common';
import { UsersController } from './controllers/users/users.controller';
import { PostsController } from './controllers/posts/posts.controller';
import { UserService } from './services/user/user.service';
import { PostService } from './services/post/post.service';
import { User } from 'src/typeorm';
import { userInfo } from 'os';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersRelation } from 'src/typeorm/entities/UserRelations';
import { GameHistory } from 'src/typeorm/entities/GameHistory';

@Module({
  controllers: [UsersController, PostsController],
  providers: [
		{
			provide: 'USER_SERVICE',
	  		useClass: UserService,
		},
		UserService,
		PostService,
	],
	imports: [TypeOrmModule.forFeature([User]), TypeOrmModule.forFeature([UsersRelation]), TypeOrmModule.forFeature([GameHistory])]
})
export class UsersModule {}

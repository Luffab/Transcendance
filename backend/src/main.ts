import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as session from 'express-session';
import * as passport from 'passport';
import * as dotenv from 'dotenv';
import { getConnection, getRepository } from 'typeorm';
import { TypeORMSession } from './typeorm/entities/Session';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TypeormStore } from 'connect-typeorm';
import * as bodyParser from 'body-parser';

async function bootstrap() {
	
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.use(session({
		cookie: {
			maxAge: 86400000,
	  	},
		secret: 'efhe2ofo24gop3nvo3b',
		resave: false,
		saveUninitialized: false,
  	}),
  );
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(bodyParser.json({limit: '50mb'}));
  app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
  app.enableCors();
  await app.listen(3001);
}
bootstrap();



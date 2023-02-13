import { Controller, Get, Req, Res, UseGuards, Post, UnauthorizedException, Body, Put, Param, VersioningOptions } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response, Request } from 'express';
import { get } from 'http';
import { AuthenticatedGuard, FTAuthGuard } from 'src/auth/guards';
import { AuthService } from 'src/auth/services/auth/auth.service';
import { User } from 'src/typeorm';
import { UserService } from 'src/users/services/user/user.service';
import { RecupDTO, TfaDTO, VerifyCodeDTO } from './Auth.dto';

@Controller('auth')
export class AuthController {
	constructor(
		private readonly authenticationService: AuthService,
		//private usersService: UserService,
	  ) {}

	// the user log with /api/auth/login

	@Get('login')
	@UseGuards(FTAuthGuard)
	login() {
		return;
	}
	
	// the redirect url is in /api/auth/redirect

	@Get('redirect')
	@UseGuards(FTAuthGuard)
	redirect(@Res() res: Response, @Req() req: Request) {
		let jwt = require('jwt-simple');
		let reqq = JSON.parse(JSON.stringify(req.user));
		let secret = process.env.JWT_SECRET;
		let secret2 = process.env.TFA_SECRET;
		let payload = {
			username: reqq.username,
			is2fa: reqq.is2fa,
			ft_id: reqq.ft_id
		};
		let payload2 = {
			ft_id: reqq.ft_id,
			username: reqq.username,
			intra_valid: "yes"
		};
		let token = jwt.encode(payload, secret);
		let token_2fa = jwt.encode(payload2, secret2)
		if (reqq.is2fa === true) {
			this.authenticationService.generatefirst2fa(reqq.ft_id, reqq.email)
			res.redirect(process.env.FT_REDIRECT_URL + "?jwt=" + token_2fa + "&tfa=true" + "&email=" + reqq.email + "&recup=" + reqq.recup_emails);
		}
		else
			res.redirect(process.env.FT_REDIRECT_URL + "?jwt=" + token + "&tfa=false");
	}

	// logout in /api/auth/logout

	@Post('verify_code')
	async verifycode(@Body() body: VerifyCodeDTO) {
		return await this.authenticationService.verifyCode(body)
	}

	@Get('logout')
  	@UseGuards(AuthenticatedGuard)
  	logout(@Req() req: Request) {
    	//req.logOut();
  	}

	@Get('after_2fa')
	@UseGuards(AuthenticatedGuard)
	redirectafeter2fa() {
		
	}

	@Post('2fa/recup')
	generate(@Body() body: RecupDTO) {
	 	return this.authenticationService.generate2fa(body)
	}

	@Post('2fa/change')
	async change2fa(@Body() body: TfaDTO) {
		return await this.authenticationService.changeTfa(body);
	}
}


import { Controller, Get, Req, Res, UseGuards, Post, UnauthorizedException, Body, Put, Param, VersioningOptions, HttpException } from '@nestjs/common';
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
	async redirect(@Res() res: Response, @Req() req: Request) {
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
			let ret = await this.authenticationService.generatefirst2fa(reqq.ft_id, reqq.email)
			if (ret !== "error")
				res.redirect(process.env.FT_REDIRECT_URL + "?jwt=" + token_2fa + "&tfa=true" + "&email=" + reqq.email + "&recup=" + reqq.recup_emails);
		}
		else
			res.redirect(process.env.FT_REDIRECT_URL + "?jwt=" + token + "&tfa=false");
	}

	// logout in /api/auth/logout

	@Post('verify_code')
	async verifycode(@Body() body: VerifyCodeDTO) {
		let ret = await this.authenticationService.verifyCode(body)
		if (ret === "bad token")
			throw new HttpException('Error: You are not authentified.', 400)
		if (ret === "bad code")
			throw new HttpException('Error: Bad Code.', 400)
		if (ret === "error")
			throw new HttpException('Error: Wrong data types.', 400)
		return ret
	}

	@Post('2fa/recup')
	async generate(@Body() body: RecupDTO) {
	 	let ret = await this.authenticationService.generate2fa(body)
		if (ret === "bad token")
			throw new HttpException('Error: You are not authentified.', 400)
		if (ret === "no2fa")
			throw new HttpException('Error: You have no 2fa.', 400)
		if (ret === "error")
			throw new HttpException('Error: Wrong data types.', 400)
	}

	@Post('2fa/change')
	async change2fa(@Body() body: TfaDTO) {
		let ret = await this.authenticationService.changeTfa(body);
		if (ret === "error")
			throw new HttpException('Error: Wrong data types.', 400)
		if (ret === "bad token")
			throw new HttpException('Error: You are not authentified.', 400)
		if (ret === "No backup")
			throw new HttpException('Error: Wrong data types.', 400)
		return ret
	}
}


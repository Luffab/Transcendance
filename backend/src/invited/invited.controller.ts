import { Body, Controller, Get, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { InvitedService } from './invited.service';


@Controller('invited')
export class InvitedController {
	constructor(
		private readonly invitedService: InvitedService,
	) {}

	incrementId = 0

	@Get('login')
	async login(@Query() query: { username: string }, @Res() res) {
		let jwt = require('jwt-simple');
		let secret = process.env.JWT_SECRET;
		let payload = {
			username: query.username,
			is2fa: false,
			ft_id: ""
		}

		if (await this.invitedService.usernameExists(query.username) === false) {
			let tmpId = generateRandomString(5)
			payload.ft_id = tmpId
			await this.invitedService.saveInvited(payload.ft_id, payload.username)
		}
		else
			payload.ft_id = await this.invitedService.getUserId(query.username)
		let token = jwt.encode(payload, secret);
		res.redirect(process.env.FT_REDIRECT_URL + "?jwt=" + token + "&tfa=false");
		return {"jwt": token, "tfa":false}
	}

}

const generateRandomString = (myLength) => {
	const chars =
	  "0123456789";
	const randomArray = Array.from(
	  { length: myLength },
	  (v, k) => chars[Math.floor(Math.random() * chars.length)]
	);
	const randomString = randomArray.join("");
	return randomString;
  };
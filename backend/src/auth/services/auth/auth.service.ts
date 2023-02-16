import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MailService } from 'src/mail/mail.service';
import { User } from 'src/typeorm';
import { UserDetails } from 'src/utils/types';
import { Repository } from 'typeorm';
import { RecupDTO, TfaDTO, VerifyCodeDTO } from 'src/auth/controllers/auth/Auth.dto';

const fetch = require('node-fetch');

@Injectable()
export class AuthService {
	constructor(
		@InjectRepository(User) private userRepo:
		Repository<User>,
		private mailService: MailService
	) {}

	async validateToken(token: string)
	{
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
	
	async validateToken2(token: string)
	{
		let jwt = require('jwt-simple');
		let secret = process.env.TFA_SECRET;
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

	async userExists(userId: string)
	{
		try {
			if (await this.userRepo.findOne({ where: {ft_id: userId}}))
				return true
			return false
		}
		catch {
			return "error"
		}
		
	}

	async validateUser(details: UserDetails) {
		try {
			const { ft_id } = details;
			const { emails } = details;
			const user = await this.userRepo.findOne({ where: {ft_id: ft_id } });
			let json = {
						"ft_id": details.ft_id,
						"accessToken": details.accessToken,
						"refreshToken": details.refreshToken,
					};
			if (user) {
				await this.userRepo.update({ ft_id }, json);
				return user;
			}
			let ret = await this.createUser(details);
			return ret
		}
		catch {return "error"}
	}

	async usernameExists(newUsername: string) {
		try {
			if (await this.userRepo.findOne({
				select: {username: true},
				where: {username: newUsername}
			}))
				return true
			return false
		}
		catch {return "error"}
	}

	async createUser(details: UserDetails) {
		try {
			let reqq = JSON.parse(JSON.stringify(details._json.image.link));
			if (reqq) {
				const imageUrl = reqq;
				const imageUrlData = await fetch(imageUrl);
				const buffer = await imageUrlData.arrayBuffer();
				let stringifiedBuffer = Buffer.from(buffer).toString('base64');
				let contentType = imageUrlData.headers.get('content-type');
				var imageBas64 =  `data:image/${contentType};base64,${stringifiedBuffer}`;
			}
			else if (!reqq)
				imageBas64 = "data:image/webp;base64,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mOmFib3V0PScnCiAgeG1sbnM6cGRmPSdodHRwOi8vbnMuYWRvYmUuY29tL3BkZi8xLjMvJz4KICA8cGRmOkF1dGhvcj5BbGV4aWEgTWFsaWdlPC9wZGY6QXV0aG9yPgogPC9yZGY6RGVzY3JpcHRpb24+CgogPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9JycKICB4bWxuczp4bXA9J2h0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8nPgogIDx4bXA6Q3JlYXRvclRvb2w+Q2FudmE8L3htcDpDcmVhdG9yVG9vbD4KIDwvcmRmOkRlc2NyaXB0aW9uPgo8L3JkZjpSREY+CjwveDp4bXBtZXRhPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAo8P3hwYWNrZXQgZW5kPSd3Jz8+AA=="
			let mail_temp = details.emails[0].value;
			let username_temp = details.username
			let tmp
			while (tmp = await this.usernameExists(username_temp) === true)
				username_temp = details.username + generateRandomString(6)
			if (tmp === "error")
				return "error"
			let json = {	"username": username_temp,
							"ft_id": details.ft_id,
							"accessToken": details.accessToken,
							"refreshToken": details.refreshToken,
							"recup_emails": mail_temp,
							"email": "",
							"is2fa": false,
							"status": "offline",
							"avatar": imageBas64,
							"one_party_played": false,
							"one_victory": false,
							"ten_victory": false,
							"all_modes_played": false,
							"nb_victory": 0,
							"nb_defeat": 0,
							"lvl": 0,
							"elo": 0,
							"rank": "Unranked",
							"xp": 0

						};
			const user = this.userRepo.create(json);
			let ret = await this.userRepo.save(user);
			return ret
		}
		catch {return "error"}
	}

	async findUser(ft_id: string) {
		try {
			return await this.userRepo.findOne({ where: { ft_id: ft_id } })
		}
		catch {return "error"}
	}

	async generate2fa(body: RecupDTO) {
		try {
			let usernametoken = await this.validateToken2(body.token);
			if (usernametoken === "error")
				return "error"
			if (!usernametoken)
				return "bad token"
			let userz = await this.userRepo.findOne({ where: {ft_id: usernametoken.ft_id } })
			console.log(usernametoken.ft_id)
			if (userz.is2fa === true) {
				let random = generateRandomString(6);
				await this.mailService.sendUserConfirmation(body.email, random);
				await this.userRepo
    				.createQueryBuilder()
    				.update(User)
    				.set({ verify_code: random })
    				.where("ft_id= :id", { id: usernametoken.ft_id })
    				.execute()
				console.log()
				return
			}
			return "no2fa"
		}
		catch {return "error"}
	}

	async generatefirst2fa(ft_id: string, email: string) {
		try {
			let userz = await this.userRepo.findOne({ where: {ft_id: ft_id } })
			if (userz.is2fa === true) {
				let random = generateRandomString(6);
				await this.mailService.sendUserConfirmation(email, random);
				await this.userRepo
    				.createQueryBuilder()
    				.update(User)
    				.set({ verify_code: random })
    				.where("ft_id= :id", { id: ft_id })
    				.execute()
			}
		}
		catch {return "error"}
	}

	async changeTfa( tfa: TfaDTO) {
		try {
			let usernametoken = await this.validateToken(tfa.token);
			if (usernametoken === "error")
				return "error"
			if (!usernametoken)
				return "bad token"
			let user = await this.userRepo.findOne({
				where: {ft_id: usernametoken.ft_id}
			})
			if (user) {
				if (user.recup_emails) {
					await this.userRepo
						.createQueryBuilder()
						.update(User)
						.set({ is2fa: tfa.is_2fa })
						.where("ft_id= :id", { id: usernametoken.ft_id })
						.execute()
					return tfa.is_2fa
				}
			}
			return "No backup"
		}
		catch {return "error"}
	}

	async verifyCode(body: VerifyCodeDTO) {
		try {
			let usernametoken = await this.validateToken2(body.token)
			if (usernametoken === "error")
				return "error"
			if (!usernametoken)
				return "bad token"
			let jwt = require('jwt-simple');
			let secret = process.env.JWT_SECRET;
			let payload = {
				username: usernametoken.username,
				is2fa: true,
				ft_id: usernametoken.ft_id
			};
			let token = jwt.encode(payload, secret);
			if (await this.userRepo.findOne({
				where: {ft_id: usernametoken.ft_id, verify_code: body.code}
			})) {
				return token
			}
			return "bad code"
		}
		catch {return "error"}
	}
}

const generateRandomString = (myLength: number) => {
	const chars =
	  "0123456789";
	const randomArray = Array.from(
	  { length: myLength },
	  (v, k) => chars[Math.floor(Math.random() * chars.length)]
	);
	const randomString = randomArray.join("");
	return randomString;
  };

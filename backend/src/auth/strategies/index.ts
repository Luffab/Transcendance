import { Strategy, Profile } from 'passport-42';
import { PassportStrategy } from '@nestjs/passport';
import { Inject, Injectable } from '@nestjs/common';
import { AuthenticationProvider } from '../services/auth/auth';

@Injectable()
export class FTStrategy extends PassportStrategy(Strategy) {
	constructor(@Inject('AUTH_SERVICE') private readonly authService: AuthenticationProvider) {
		super({
			clientID: process.env.FT_UID,
			clientSecret: process.env.FT_SECRET,
			callbackURL: process.env.FT_CALLBACK_URL,
			scope: ['public'],
		});
	}

	async validate(accessToken: string, refreshToken: string, profile: Profile) {
		const { username, id: ft_id, avatar, emails, _json} = profile;
		const details = { username, ft_id, avatar, accessToken, refreshToken, emails, _json};
		return this.authService.validateUser(details);
	}
}
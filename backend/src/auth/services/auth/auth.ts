import { User } from "src/typeorm";
import { UserDetails } from "src/utils/types";

export interface AuthenticationProvider {
	validateUser(details: UserDetails);
	createUser(details: UserDetails);
	findUser(ft_id: string): Promise<User | undefined>;
	//find2fa(tfa: boolean): Promise<User | undefined>;
	//generate2fa(ft_id: string, user: User);
}
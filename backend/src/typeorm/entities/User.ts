import { type } from "os";
import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: 'users' })
export class User{
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ name: 'ft_id', unique: true })
	ft_id: string;

	@Column()
	username: string;

	@Column({ name: 'access_token' })
	accessToken: string;

	@Column({ name: 'refresh_token' })
	refreshToken: string;

	@Column({nullable: true })
	recup_emails: string;

	@Column({nullable: true})
	email: string

	@Column()
	is2fa: boolean;

	@Column({ nullable: true })
	verify_code: string;

	@Column()
	status: string;

	@Column()
	avatar: string;

	@Column()
	one_party_played: boolean;

	@Column()
	one_victory: boolean;

	@Column()
	ten_victory: boolean;

	@Column()
	nb_victory: number

	@Column()
	nb_defeat: number;

	@Column()
	lvl: number;

	@Column()
	elo: number;

	@Column()
	rank: string;

	@Column()
	xp: number;
}

export default User;
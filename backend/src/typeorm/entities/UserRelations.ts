import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({name: 'users_relation'})
export class UsersRelation {
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	sender_id: string;

	@Column()
	receiver_id: string;

	@Column()
	is_friend: boolean;

	@Column()
	is_block: boolean;

	@Column()
	wait_friend: boolean;
}
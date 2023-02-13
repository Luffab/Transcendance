import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({name: 'game_invitation'})
export class GameInvitation {
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	sender_id: string;

	@Column()
	receiver_id: string;

	@Column()
	mode: string
}
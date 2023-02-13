import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({name: 'channel_invitation'})
export class ChannelInvitation {
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	sender_id: string;

	@Column()
	receiver_id: string;

	@Column()
	channel_id: number;
}
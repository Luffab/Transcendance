import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('channels')
export class Channels {
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	name: string;

	@Column({nullable: true})
	password: string;

	@Column()
	owner_id: string;

	@Column()
	channel_type: string;
}

export default Channels;
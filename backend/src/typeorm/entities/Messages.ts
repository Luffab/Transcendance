import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: 'messages' })
export class Messages{
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	author: string;

	@Column()
	chan_id: number;

	@Column()
	content: string;

}

export default Messages;
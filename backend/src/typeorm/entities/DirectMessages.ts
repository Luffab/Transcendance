import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('directmessages')
export class DirectMessages {
	@PrimaryGeneratedColumn()
	id: number;

    @Column()
	discussion_id: number;

	@Column()
	author: string;

	@Column()
	content: string;   
}

export default DirectMessages;
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('discussions')
export class PrivateDiscussions {
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	user1: string;

	@Column()
	user2: string;    
}

export default PrivateDiscussions;
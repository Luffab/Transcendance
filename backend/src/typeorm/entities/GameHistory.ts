import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({name: "game_history"})
export class GameHistory {
	@PrimaryGeneratedColumn()
	id: number

	@Column()
	user_id: string

	@Column()
	p1Score: number

	@Column()
	p2Score: number

	@Column()
	is_win: boolean

	@Column({nullable: true})
	mode: string

	@Column()
	vs_id: string;
}
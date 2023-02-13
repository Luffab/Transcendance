import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { DeleteChanDTO } from "src/chat/dto/chat.dto";
import { deleteGameDTO } from "./game.dto";
import { GameService } from "./game.service";

@Controller('game')
export class GameController {
    constructor(
        private readonly gameService: GameService
    ) {}

    @Get('private_game')
    async privategame(@Query() query: {token: string}) {
        return await this.gameService.getGameInvitation(query.token)
    }

    @Post('delete_invite')
    async deletegame(@Body() body: deleteGameDTO) {
        return await this.gameService.deleteGame(body)
    }
}
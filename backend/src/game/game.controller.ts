import { Body, Controller, Get, HttpException, Post, Query } from "@nestjs/common";
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
        let decoded = await this.gameService.validateUser(query.token)
        if (decoded === "error")
            throw new HttpException('Error: Wrong data types.', 500)
        if (!decoded)
            throw new HttpException('Error: You are not authentified.', 500)
        let ret = await this.gameService.getGameInvitation(decoded.ft_id)
        if (ret === "error")
            throw new HttpException('Error: Wrong data types.', 500)
        return ret
    }

    @Post('delete_invite')
    async deletegame(@Body() body: deleteGameDTO) {
        let decoded = await this.gameService.validateUser(body.token)
        if (decoded === "error")
            throw new HttpException('Error: Wrong data types.', 500)
        if (!decoded)
            throw new HttpException('Error: You are not authentified.', 500)
        if (await this.gameService.inviteExists(body.sender_id, decoded.ft_id) === "error")
            throw new HttpException('Error: Wrong data types.', 500)
        if (await this.gameService.inviteExists(body.sender_id, decoded.ft_id) === false)
            throw new HttpException("Error: This invitation doesn't exist.", 500)
        let ret = await this.gameService.deleteGameInvitation(body.sender_id, decoded.ft_id)
        if (ret === "error")
            throw new HttpException('Error: Wrong data types.', 500)
        return ret
    }
}
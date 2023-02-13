import { ExecutionContext, Injectable } from "@nestjs/common";

@Injectable()
export class ChatGuard {
	canActivate(context: ExecutionContext): Promise<any> {
		const request = context.switchToHttp().getRequest();
		return (request);
	}
}
import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ActionService } from '../common/action.service';

@Controller('actions')
export class ActionController {
  constructor(private readonly actionService: ActionService) {}

  @UseGuards(JwtAuthGuard)
  @Post('execute')
  async execute(@Request() req: any, @Body() body: { command: string }) {
    return this.actionService.executeCommand(req.user.userId, body.command);
  }
}

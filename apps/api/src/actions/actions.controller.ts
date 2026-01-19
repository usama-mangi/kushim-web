import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ActionsService } from './actions.service';

@Controller('actions')
export class ActionsController {
  constructor(private readonly actionsService: ActionsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('execute')
  async execute(@Request() req: any, @Body() body: { command: string }) {
    return this.actionsService.executeCommand(req.user.userId, body.command);
  }
}

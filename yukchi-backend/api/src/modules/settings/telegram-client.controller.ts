import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TelegramClientService } from './telegram-client.service';
import { SaveSessionDto } from './dto/telegram-client.dto';
import { Roles } from '@common/decorators/roles.decorator';

@ApiTags('settings/telegram-client')
@ApiBearerAuth()
@Roles('admin')
@Controller({ path: 'settings/telegram/client', version: '1' })
export class TelegramClientController {
  constructor(private readonly telegramClientService: TelegramClientService) {}

  @Get('status')
  getStatus() {
    return this.telegramClientService.getStatus();
  }

  @Post('session')
  saveSession(@Body() dto: SaveSessionDto) {
    return this.telegramClientService.saveEncryptedSession(dto.encryptedSession);
  }
}

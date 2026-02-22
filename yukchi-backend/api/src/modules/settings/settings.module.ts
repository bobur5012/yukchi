import { Module } from '@nestjs/common';
import { TelegramClientController } from './telegram-client.controller';
import { TelegramClientService } from './telegram-client.service';

@Module({
  controllers: [TelegramClientController],
  providers: [TelegramClientService],
  exports: [TelegramClientService],
})
export class SettingsModule {}

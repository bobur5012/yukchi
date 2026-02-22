import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { BotQueueProvider } from './queues/bot.queue';
import { ClientQueueProvider } from './queues/client.queue';
import { TelegramModule } from '@modules/telegram/telegram.module';

@Module({
  imports: [TelegramModule],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    BotQueueProvider,
    ClientQueueProvider,
  ],
  exports: [NotificationService],
})
export class NotificationModule {}

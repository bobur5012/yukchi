import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { Roles } from '@common/decorators/roles.decorator';

class SendBotMessageDto {
  @ApiProperty()
  @IsString()
  message: string;
}

class NotifyDebtorsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  minDebt?: string;
}

@ApiTags('notifications')
@ApiBearerAuth()
@Roles('admin')
@Controller({ path: 'notifications', version: '1' })
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get('logs')
  getLogs(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.notificationService.getNotificationLogs(page, limit);
  }

  @Post('bot/send')
  sendBotMessage(@Body() dto: SendBotMessageDto) {
    return this.notificationService.sendBotNotification({ message: dto.message });
  }

  @Post('debtors/notify')
  notifyDebtors(@Body() dto: NotifyDebtorsDto) {
    return this.notificationService.notifyAllDebtors(dto.minDebt);
  }
}

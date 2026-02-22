import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { configuration, validationSchema } from './config/configuration';
import { PrismaModule } from './config/prisma.module';
import { RedisModule } from './config/redis.module';

import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { JwtAuthGuard } from './common/guards/jwt.guard';
import { RolesGuard } from './common/guards/roles.guard';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CouriersModule } from './modules/couriers/couriers.module';
import { TripsModule } from './modules/trips/trips.module';
import { ProductsModule } from './modules/products/products.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { ShopsModule } from './modules/shops/shops.module';
import { ExchangeRatesModule } from './modules/exchange-rates/exchange-rates.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { RegionsModule } from './modules/regions/regions.module';
import { NotificationModule } from './modules/notification/notification.module';
import { TelegramModule } from './modules/telegram/telegram.module';
import { SettingsModule } from './modules/settings/settings.module';
import { AuditModule } from './modules/audit/audit.module';
import { SecurityModule } from './modules/security/security.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
      validationOptions: { allowUnknown: true },
    }),
    ThrottlerModule.forRootAsync({
      useFactory: () => ({
        throttlers: [{ ttl: 60000, limit: 200 }],
      }),
    }),
    PrismaModule,
    RedisModule,
    AuthModule,
    UsersModule,
    CouriersModule,
    TripsModule,
    ProductsModule,
    ExpensesModule,
    ShopsModule,
    ExchangeRatesModule,
    DashboardModule,
    RegionsModule,
    NotificationModule,
    TelegramModule,
    SettingsModule,
    AuditModule,
    SecurityModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}

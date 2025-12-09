import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { WalletsModule } from './wallets/wallets.module';
import { TransactionsModule } from './transactions/transactions.module';
import { ApiKeysModule } from './api-keys/api-keys.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [UsersModule, WalletsModule, TransactionsModule, ApiKeysModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

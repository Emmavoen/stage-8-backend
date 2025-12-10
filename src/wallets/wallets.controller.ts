import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  UseGuards,
  SetMetadata,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { CompositeAuthGuard } from '../auth/composite.guard';
import type { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiSecurity,
  ApiResponse,
} from '@nestjs/swagger'; // Import Swagger
import { DepositDto, TransferDto } from './dto/wallet.dto'; // Import DTOs
import { TransactionResponseDto } from 'src/transactions/dto/transaction.dto';

@ApiTags('Wallet') // Swagger Group
@ApiBearerAuth() // Swagger Auth Icon
@ApiSecurity('x-api-key')
@Controller('wallet')
export class WalletsController {
  constructor(private readonly walletService: WalletsService) {}

  @Post('deposit')
  @UseGuards(CompositeAuthGuard)
  @SetMetadata('permission', 'deposit')
  @ApiOperation({ summary: 'Initiate a Paystack deposit' })
  async deposit(@Req() req, @Body() body: DepositDto) {
    // Use DTO Type
    return this.walletService.initiateDeposit(req.user, body.amount);
  }

  @Post('transfer')
  @UseGuards(CompositeAuthGuard)
  @SetMetadata('permission', 'transfer')
  @ApiOperation({ summary: 'Transfer funds to another wallet' })
  async transfer(@Req() req, @Body() body: TransferDto) {
    // Use DTO Type
    return this.walletService.transfer(
      req.user,
      body.wallet_number,
      body.amount,
    );
  }

  @Get('balance')
  @UseGuards(CompositeAuthGuard)
  @SetMetadata('permission', 'read')
  @ApiOperation({ summary: 'Get wallet balance' })
  async balance(@Req() req) {
    return this.walletService.getBalance(req.user);
  }

  @Get('transactions')
  @UseGuards(CompositeAuthGuard)
  @SetMetadata('permission', 'read')
  @ApiOperation({ summary: 'Get transaction history' })
  @ApiResponse({ status: 200, type: [TransactionResponseDto] })
  async history(@Req() req) {
    return this.walletService.getHistory(req.user);
  }

  @Post('paystack/webhook')
  async webhook(@Req() req, @Res() res: Response) {
    await this.walletService.processWebhook(
      req.headers['x-paystack-signature'],
      req.body,
    );
    return res.status(HttpStatus.OK).json({ status: true });
  }
}

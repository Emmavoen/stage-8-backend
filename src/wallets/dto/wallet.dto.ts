import {
  IsNumber,
  IsPositive,
  Min,
  IsNotEmpty,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DepositDto {
  @ApiProperty({
    example: 100,
    description:
      'Amount in NAIRA (e.g., 100 for ₦100). We convert to Kobo for Paystack.',
  })
  @IsNumber()
  @IsPositive()
  @Min(100, { message: 'Minimum deposit is 100 Naira' })
  amount: number;
}

export class TransferDto {
  @ApiProperty({
    example: '173388291029',
    description: 'Wallet number of the recipient',
  })
  @IsString()
  @IsNotEmpty()
  wallet_number: string;

  @ApiProperty({ example: 50, description: 'Amount in NAIRA' })
  @IsNumber()
  @IsPositive()
  @Min(1)
  amount: number;
}

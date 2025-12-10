import { IsInt, IsPositive, Min, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DepositDto {
  @ApiProperty({
    example: 10000,
    description:
      'Amount in Kobo. Minimum 100 Naira (10,000 Kobo). Must be an integer.',
  })
  @IsInt({
    message: 'Amount must be a whole number (Kobo). No decimals allowed.',
  })
  @IsPositive()
  @Min(10000, { message: 'Minimum deposit amount is 100 Naira (10,000 Kobo)' })
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

  @ApiProperty({
    example: 5000,
    description: 'Amount in Kobo. Must be an integer.',
  })
  @IsInt({
    message: 'Amount must be a whole number (Kobo). No decimals allowed.',
  })
  @IsPositive()
  @Min(100, { message: 'Minimum transfer is 1 Naira (100 Kobo)' })
  amount: number;
}

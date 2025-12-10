import { IsNumber, IsString, Min, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DepositDto {
  @ApiProperty({ example: 5000, description: 'Amount to deposit in Kobo' })
  @IsNumber()
  @Min(100)
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

  @ApiProperty({ example: 3000, description: 'Amount to transfer' })
  @IsNumber()
  @Min(100)
  amount: number;
}

import { ApiProperty } from '@nestjs/swagger';

export class TransactionResponseDto {
  @ApiProperty({ example: 'uuid-string' })
  id: string;

  @ApiProperty({ example: 5000 })
  amount: number;

  @ApiProperty({ example: 'deposit' })
  type: string;

  @ApiProperty({ example: 'success' })
  status: string;

  @ApiProperty({ example: '2025-12-10T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '1733882000' })
  counterparty_wallet_number: string;
}

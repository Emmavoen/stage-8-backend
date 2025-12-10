import { IsString, IsArray, IsIn, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateApiKeyDto {
  @ApiProperty({ example: 'My Service Key' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: ['read', 'transfer'], isArray: true })
  @IsArray()
  @IsString({ each: true })
  @IsIn(['deposit', 'transfer', 'read'], {
    each: true,
    message: 'Permissions must be one of: deposit, transfer, read',
  })
  permissions: string[];

  @ApiProperty({ example: '1M', description: '1H, 1D, 1M, or 1Y' })
  @IsString()
  @IsIn(['1H', '1D', '1M', '1Y'])
  expiry: string;
}

export class RolloverApiKeyDto {
  @ApiProperty({ example: 'd3f5...' })
  @IsString()
  @IsNotEmpty()
  expired_key_id: string;

  @ApiProperty({ example: '1M' })
  @IsString()
  @IsIn(['1H', '1D', '1M', '1Y'])
  expiry: string;
}

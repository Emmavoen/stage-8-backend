import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  Patch,
  Param,
} from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import {
  CreateApiKeyDto,
  RevokeApiKeyDto,
  RolloverApiKeyDto,
} from './dto/api-key.dto';

@ApiTags('API Keys')
@ApiBearerAuth()
@Controller('keys')
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post('create')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Create a new API Key' })
  create(@Req() req, @Body() body: CreateApiKeyDto) {
    return this.apiKeysService.create(
      req.user,
      body.name,
      body.permissions,
      body.expiry,
    );
  }

  @Post('rollover')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Renew an expired API Key' })
  rollover(@Req() req, @Body() body: RolloverApiKeyDto) {
    return this.apiKeysService.rollover(
      req.user,
      body.expired_key_id,
      body.expiry,
    );
  }

  @Post('revoke') // Changed to POST (or PATCH) using Body
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Revoke an active API Key' })
  revoke(@Req() req, @Body() body: RevokeApiKeyDto) {
    return this.apiKeysService.revokeByKey(req.user, body.key);
  }
}

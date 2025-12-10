import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiKey } from './entities/api-key.entity';
import { User } from '../users/entities/user.entity';
import * as crypto from 'crypto';

@Injectable()
export class ApiKeysService {
  constructor(
    @InjectRepository(ApiKey) private apiKeyRepo: Repository<ApiKey>,
  ) {}

  private calculateExpiry(expiryString: string): Date {
    const unit = expiryString.slice(-1);
    const value = parseInt(expiryString.slice(0, -1));
    if (isNaN(value)) throw new BadRequestException('Invalid expiry format');

    const date = new Date();
    if (unit === 'H') date.setHours(date.getHours() + value);
    else if (unit === 'D') date.setDate(date.getDate() + value);
    else if (unit === 'M') date.setMonth(date.getMonth() + value);
    else if (unit === 'Y') date.setFullYear(date.getFullYear() + value);
    else throw new BadRequestException('Invalid format. Use 1H, 1D, 1M, 1Y');
    return date;
  }

  async create(
    user: User,
    name: string,
    permissions: string[],
    expiry: string,
  ) {
    const count = await this.apiKeyRepo.count({
      where: { user: { id: user.id }, is_active: true },
    });
    if (count >= 5) throw new ForbiddenException('Max 5 active keys allowed');

    const key = `sk_live_${crypto.randomBytes(16).toString('hex')}`;
    const newKey = this.apiKeyRepo.create({
      key,
      name,
      permissions,
      expires_at: this.calculateExpiry(expiry),
      user,
    });
    return await this.apiKeyRepo.save(newKey);
  }

  async validateKey(key: string) {
    return this.apiKeyRepo.findOne({
      where: { key, is_active: true },
      relations: ['user'],
    });
  }

  async rollover(user: User, expiredKeyId: string, expiry: string) {
    const oldKey = await this.apiKeyRepo.findOne({
      where: { id: expiredKeyId, user: { id: user.id } },
    });
    if (!oldKey) throw new BadRequestException('Key not found');
    return this.create(
      user,
      `${oldKey.name}_rollover`,
      oldKey.permissions,
      expiry,
    );
  }
}

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiKeysService } from '../api-keys/api-keys.service';
import { Reflector } from '@nestjs/core';

@Injectable()
export class CompositeAuthGuard implements CanActivate {
  constructor(
    private readonly apiKeysService: ApiKeysService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];
    const authHeader = request.headers['authorization'];

    // 1. Check API Key
    if (apiKey) {
      const keyEntity = await this.apiKeysService.validateKey(apiKey as string);
      if (!keyEntity || new Date() > keyEntity.expires_at) {
        throw new UnauthorizedException('Invalid or Expired API Key');
      }
      const requiredPermission = this.reflector.get<string>(
        'permission',
        context.getHandler(),
      );
      if (
        requiredPermission &&
        !keyEntity.permissions.includes(requiredPermission)
      ) {
        throw new ForbiddenException(
          `Missing permission: ${requiredPermission}`,
        );
      }
      request.user = keyEntity.user;
      request.authType = 'api-key';
      return true;
    }

    // 2. Check JWT
    if (authHeader) {
      const jwtGuard = new (AuthGuard('jwt'))();
      try {
        const canActivate = await jwtGuard.canActivate(context);
        if (canActivate) {
          request.authType = 'jwt';
          return true;
        }
      } catch (e) {
        throw new UnauthorizedException('Invalid JWT');
      }
    }
    throw new UnauthorizedException('No Authentication provided');
  }
}

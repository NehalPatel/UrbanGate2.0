import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Permission } from '@urbangate/permissions';
import { hasPermission } from '@urbangate/permissions';
import { PERMISSIONS_KEY } from '../common/require-permissions.decorator';
import type { AuthUser } from './auth.types';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    const user = request.user;
    if (!user) {
      throw new ForbiddenException({
        error: 'FORBIDDEN',
        message: 'Missing authenticated user',
      });
    }

    if (user.isPlatformAdmin) {
      return true;
    }

    const roleKeys =
      user.memberships.find((m) => m.societyId === user.activeSocietyId)?.roleKeys ?? [];

    const ok = required.every((permission) => hasPermission(roleKeys, permission));
    if (!ok) {
      throw new ForbiddenException({
        error: 'FORBIDDEN',
        message: 'Insufficient permissions',
        details: { required },
      });
    }
    return true;
  }
}

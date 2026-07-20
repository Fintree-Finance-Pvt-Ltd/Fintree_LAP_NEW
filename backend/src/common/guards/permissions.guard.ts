import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    const url = String(
      request?.originalUrl ||
        request?.url ||
        request?.path ||
        '',
    );

    if (
      url.includes('/aadhaar/webhook') ||
      url.includes('/lap-webhook/v1/digi-aadhaar-webhook')
    ) {
      console.log('✅ Aadhaar webhook bypassed by PermissionsGuard:', url);
      return true;
    }

    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_KEY,
      [context.getHandler(), context.getClass()],
    );

    console.log('PermissionsGuard Route:', context.getHandler().name);
    console.log('PermissionsGuard URL:', url);
    console.log('PermissionsGuard isPublic:', isPublic);

    if (isPublic) {
      console.log('✅ Public route skipped by PermissionsGuard');
      return true;
    }

    const permissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!permissions?.length) {
      return true;
    }

    const user = request.user;

    if (!user) {
      return false;
    }

    return permissions.every((permission) =>
      user?.permissions?.includes(permission),
    );
  }
}
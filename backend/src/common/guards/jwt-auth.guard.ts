import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
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
      console.log('✅ Aadhaar webhook bypassed by JwtAuthGuard:', url);
      return true;
    }

    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_KEY,
      [context.getHandler(), context.getClass()],
    );

    console.log('Route:', context.getHandler().name);
    console.log('URL:', url);
    console.log('isPublic:', isPublic);

    if (isPublic) {
      console.log('✅ Public route');
      return true;
    }

    console.log('🔒 Protected route');
    return super.canActivate(context);
  }
}
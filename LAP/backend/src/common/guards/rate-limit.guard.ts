import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type Bucket = { count: number; resetAt: number };

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly buckets = new Map<string, Bucket>();

  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const ttlMs = Number(this.config.get('RATE_LIMIT_TTL_MS') ?? 60_000);
    const limit = Number(this.config.get('RATE_LIMIT_MAX') ?? 120);
    const now = Date.now();
    const key = `${request.ip}:${request.method}:${request.route?.path ?? request.url}`;
    const bucket = this.buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + ttlMs });
      return true;
    }

    if (bucket.count >= limit) {
      throw new HttpException('Rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
    }

    bucket.count += 1;
    if (this.buckets.size > 10_000) this.prune(now);
    return true;
  }

  private prune(now: number) {
    for (const [key, bucket] of this.buckets.entries()) {
      if (bucket.resetAt <= now) this.buckets.delete(key);
    }
  }
}

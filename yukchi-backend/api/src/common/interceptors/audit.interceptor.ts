import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from '@modules/audit/audit.service';

const WRITE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user, ip } = request;

    if (!WRITE_METHODS.includes(method)) {
      return next.handle();
    }

    const startedAt = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          if (user?.id) {
            this.auditService
              .log({
                userId: user.id,
                action: `${method} ${url}`,
                entityType: extractEntityType(url),
                metadata: { durationMs: Date.now() - startedAt, ip },
              })
              .catch(() => {});
          }
        },
      }),
    );
  }
}

function extractEntityType(url: string): string {
  const segments = url.replace(/^\/api\/v1\//, '').split('/');
  return segments[0] || 'unknown';
}

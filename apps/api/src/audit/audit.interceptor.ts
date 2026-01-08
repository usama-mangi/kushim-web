import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from './audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, ip, user } = request;

    return next.handle().pipe(
      tap(() => {
        // Only log mutations or specific access if needed.
        // For production, we usually log POST/PATCH/DELETE or sensitive GETs.
        if (method !== 'GET' || url.includes('records') || url.includes('profile')) {
          this.auditService.log({
            userId: user?.userId,
            action: method,
            resource: url,
            payload: method !== 'GET' ? request.body : undefined,
            ipAddress: ip,
          }).catch(err => console.error('Audit Logging Failed', err));
        }
      }),
    );
  }
}

import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, map } from 'rxjs';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const customMessage = this.getSuccessMessage(context);

    const ctx = context.switchToHttp();
    const res = ctx.getResponse();

    return next.handle().pipe(
      map((response) => {
        const status = res.statusCode;

        if (response?.meta) {
          const { data, meta } = response;

          return {
            success: true,
            statusCode: status,
            message: customMessage,
            meta: meta || {},
            data: data ?? [],
          };
        } else {
          return {
            success: true,
            statusCode: status,
            message: customMessage,
            data: response ?? [],
          };
        }
      }),
    );
  }

  private getSuccessMessage(context: ExecutionContext): string {
    return (
      this.reflector.get<string>('successMessage', context.getHandler()) ||
      'Request successful'
    );
  }
}

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';

@Catch()
@Injectable()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor() {}

  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'An unexpected error occurred';
    let errorType = 'InternalServerError';

    if (exception instanceof HttpException) {
      // Handle NestJS-specific exceptions
      status = exception.getStatus
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        message = exceptionResponse['message'] || message;
      }

      errorType = exception.name;
    } else if (exception instanceof Error) {
      // Handle general JavaScript errors
      message = exception.message;
      errorType = exception.name;
    }

    // Log the error with endpoint details
    this.logger.error(
      `Error: ${errorType} - Status: ${status} - Message: ${message} - Endpoint: ${request.method} ${request.url}`,
      'HTTP Exception Filter',
    );

    response.status(status).json({
      success: false,
      statusCode: status,
      message: Array.isArray(message) ? message?.[0] || '' : message,
      data: null,
    });
  }
}

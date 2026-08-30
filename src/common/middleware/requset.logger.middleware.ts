import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { Logger } from '@nestjs/common';
import { performance } from 'perf_hooks'; // Node.js performance module

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP Request Logger');

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = performance.now(); // Capture start time
    const { method, originalUrl, query } = req;
    const userAgent = req.get('user-agent') || '';
    const requestId = crypto.randomUUID();

    // Log request details
    this.logger.log(
      `[${requestId}] Incoming ${method} ${originalUrl} | Query: ${JSON.stringify(query)} | Agent: ${userAgent}`,
    );

    // Log response details when finished
    res.on('finish', () => {
      const { statusCode } = res;
      const contentLength = res.get('content-length');
      const executionTime = (performance.now() - startTime).toFixed(2); // Calculate duration

      this.logger.log(
        `[${requestId}] Completed ${method} ${originalUrl} | Status: ${statusCode} | Duration: ${executionTime}ms | Length: ${contentLength || '0'}`,
      );
    });

    next();
  }
}

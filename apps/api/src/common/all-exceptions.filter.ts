import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { ApiErrorBody } from '@urbangate/types';
import { CORRELATION_HEADER } from './correlation-id.middleware';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const correlationId =
      (request.headers[CORRELATION_HEADER] as string | undefined) ??
      (request.headers['x-request-id'] as string | undefined) ??
      'unknown';

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : undefined;

    let code = 'INTERNAL_ERROR';
    let message = 'An unexpected error occurred';
    let details: unknown;

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
      code = HttpStatus[status] ?? code;
    } else if (exceptionResponse && typeof exceptionResponse === 'object') {
      const body = exceptionResponse as Record<string, unknown>;
      message = typeof body.message === 'string' ? body.message : message;
      if (Array.isArray(body.message)) {
        message = 'Validation failed';
        details = body.message;
      }
      code = typeof body.error === 'string' ? body.error : (HttpStatus[status] ?? code);
    }

    if (status >= 500) {
      this.logger.error(
        {
          correlationId,
          err: exception instanceof Error ? exception.message : exception,
        },
        'Unhandled exception',
      );
    }

    const payload: ApiErrorBody = {
      error: {
        code: String(code).toUpperCase().replace(/\s+/g, '_'),
        message,
        details,
        correlationId,
      },
    };

    response.status(status).json(payload);
  }
}

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

function isPrismaMalformedId(exception: unknown): boolean {
  if (!(exception instanceof Error)) return false;
  const msg = exception.message;
  return (
    msg.includes('Malformed ObjectID') ||
    msg.includes('invalid ObjectId') ||
    msg.includes('Inconsistent column data')
  );
}

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

    let status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : undefined;

    let code = 'INTERNAL_ERROR';
    let message = 'An unexpected error occurred';
    let details: unknown;

    if (isPrismaMalformedId(exception)) {
      status = HttpStatus.BAD_REQUEST;
      code = 'INVALID_ID';
      message = 'Invalid identifier';
    } else if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
      code = HttpStatus[status] ?? code;
    } else if (exceptionResponse && typeof exceptionResponse === 'object') {
      const body = exceptionResponse as Record<string, unknown>;
      if (typeof body.message === 'string') {
        message = body.message;
      } else if (Array.isArray(body.message)) {
        message = 'Validation failed';
        details = body.message;
      }
      if (typeof body.error === 'string') {
        code = body.error;
      } else {
        code = HttpStatus[status] ?? code;
      }
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

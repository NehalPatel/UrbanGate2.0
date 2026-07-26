import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService, SESSION_COOKIE } from './auth.service';
import type { AuthUser } from './auth.types';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request & { user?: AuthUser }>();
    const response = http.getResponse<Response>();
    const token = request.cookies?.[SESSION_COOKIE] as string | undefined;
    if (!token) {
      throw new UnauthorizedException({
        error: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
    }

    const user = await this.authService.resolveSession(token);
    if (!user) {
      response.clearCookie(SESSION_COOKIE, { path: '/' });
      throw new UnauthorizedException({
        error: 'UNAUTHORIZED',
        message: 'Session expired or invalid',
      });
    }

    request.user = user;
    return true;
  }
}

import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AuthService, SESSION_COOKIE } from './auth.service';
import { LoginDto, RegisterDto, SwitchSocietyDto } from './auth.dto';
import { AuthGuard } from './auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import type { AuthUser } from './auth.types';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async register(@Body() body: RegisterDto) {
    const user = await this.authService.register(body);
    return { user };
  }

  @Post('login')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async login(
    @Body() body: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(body, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
    this.authService.setSessionCookie(res, result.token);
    return { user: result.user };
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @CurrentUser() user: AuthUser,
  ) {
    const token = req.cookies?.[SESSION_COOKIE] as string | undefined;
    await this.authService.logout(token, user.id);
    this.authService.clearSessionCookie(res);
    return { ok: true };
  }

  @Get('me')
  @UseGuards(AuthGuard)
  me(@CurrentUser() user: AuthUser) {
    return { user };
  }

  @Post('switch-society')
  @UseGuards(AuthGuard)
  async switchSociety(@CurrentUser() user: AuthUser, @Body() body: SwitchSocietyDto) {
    const next = await this.authService.switchSociety(user, body.societyId);
    return { user: next };
  }
}

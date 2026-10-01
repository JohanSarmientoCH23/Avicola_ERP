import { Controller, Post, Body, Req, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response, Request } from 'express';
import { LoginUseCase, RegisterUseCase, RefreshTokenUseCase, LogoutUseCase } from '../../../domain/use-cases/auth';
import { LoginDto } from '../../../modules/auth/dto/login.dto';
import { RegisterDto } from '../../../modules/auth/dto/register.dto';
import { RefreshTokenDto } from '../../../modules/auth/dto/refresh-token.dto';
import { Public } from '../../../common/decorators/public.decorator';

const COOKIE_MAX_AGE = 24 * 60 * 60 * 1000;

@ApiTags('Auth')
@Controller('auth')
export class AuthHexaController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly registerUseCase: RegisterUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
  ) {}

  private setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    const secure = process.env.NODE_ENV === 'production';
    res.cookie('accessToken', accessToken, { httpOnly: true, secure, sameSite: 'lax', maxAge: COOKIE_MAX_AGE, path: '/' });
    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000, path: '/' });
  }

  @Post('login')
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Iniciar sesión' })
  async login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.loginUseCase.execute({ email: dto.email, password: dto.password, ip: req.ip });
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    return { user: result.user, accessToken: result.accessToken };
  }

  @Post('register')
  @Public()
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: 'Registrar usuario (rol: GALPONERO)' })
  async register(@Body() dto: RegisterDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.registerUseCase.execute({ ...dto, ip: req.ip });
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    return { user: result.user, accessToken: result.accessToken };
  }

  @Post('refresh')
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Refrescar token' })
  async refresh(@Body() dto: RefreshTokenDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.refreshTokenUseCase.execute({ token: dto.refreshToken });
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    return { accessToken: result.accessToken };
  }

  @Post('logout')
  @ApiOperation({ summary: 'Cerrar sesión' })
  async logout(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const userId = req.user?.sub;
    res.clearCookie('accessToken', { path: '/' });
    res.clearCookie('refreshToken', { path: '/' });
    res.clearCookie('user', { path: '/' });
    return this.logoutUseCase.execute({ userId, ip: req.ip });
  }
}

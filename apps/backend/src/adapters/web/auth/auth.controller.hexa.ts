import { Controller, Get, Post, Body, Req, Res, UnauthorizedException } from '@nestjs/common';
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
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = dto?.refreshToken || (req as any).cookies?.refreshToken;
    if (!token) {
      throw new UnauthorizedException('Refresh token no proporcionado');
    }
    const result = await this.refreshTokenUseCase.execute({ token });
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    return { accessToken: result.accessToken, refreshToken: result.refreshToken };
  }

  @Get('me')
  @ApiOperation({ summary: 'Obtener usuario autenticado' })
  async me(@Req() req: any) {
    return { user: req.user };
  }

  @Post('logout')
  @ApiOperation({ summary: 'Cerrar sesión' })
  async logout(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const userId = req.user?.id;
    res.clearCookie('accessToken', { path: '/' });
    res.clearCookie('refreshToken', { path: '/' });
    res.clearCookie('user', { path: '/' });
    if (userId) {
      return this.logoutUseCase.execute({ userId, ip: req.ip });
    }
    return { message: 'Sesión cerrada exitosamente' };
  }
}

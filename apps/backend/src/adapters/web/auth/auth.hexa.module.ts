import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthHexaController } from './auth.controller.hexa';
import { LoginUseCase, RegisterUseCase, RefreshTokenUseCase, LogoutUseCase } from '../../../domain/use-cases/auth';
import { JwtStrategy } from '../../../modules/auth/strategies/jwt.strategy';
import { InfrastructureModule } from '../../../infrastructure/infrastructure.module';
import { JwtAdapter } from '../../../infrastructure/services/jwt.adapter';
import { PrismaService } from '../../../database/prisma.service';
import * as bcrypt from 'bcryptjs';

@Module({
  imports: [
    InfrastructureModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: configService.get('JWT_EXPIRATION', '24h') },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthHexaController],
  providers: [
    { provide: 'IJwtPort', useClass: JwtAdapter },
    {
      provide: LoginUseCase,
      useFactory: (usuarioRepo: any, jwtPort: any, auditPort: any) => {
        return new LoginUseCase(usuarioRepo, jwtPort, auditPort, bcrypt.compare, bcrypt.hash);
      },
      inject: ['IUsuarioRepository', 'IJwtPort', 'IAuditPort'],
    },
    {
      provide: RegisterUseCase,
      useFactory: (usuarioRepo: any, jwtPort: any, auditPort: any) => {
        return new RegisterUseCase(usuarioRepo, jwtPort, auditPort, bcrypt.hash);
      },
      inject: ['IUsuarioRepository', 'IJwtPort', 'IAuditPort'],
    },
    {
      provide: RefreshTokenUseCase,
      useFactory: (jwtPort: any, prisma: PrismaService) => {
        return new RefreshTokenUseCase(
          jwtPort,
          async (token: string) => prisma.refreshToken.findUnique({ where: { token }, include: { usuario: true } }),
          async (id: string) => { await prisma.refreshToken.delete({ where: { id } }); },
          async (userId: string) => {
            const token = jwtPort.sign({ sub: userId }, { expiresIn: '7d' });
            await prisma.refreshToken.create({ data: { token, usuarioId: userId, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } });
            return token;
          },
        );
      },
      inject: ['IJwtPort', PrismaService],
    },
    {
      provide: LogoutUseCase,
      useFactory: (auditPort: any, prisma: PrismaService) => {
        return new LogoutUseCase(auditPort, async (userId: string) => { await prisma.refreshToken.deleteMany({ where: { usuarioId: userId } }); });
      },
      inject: ['IAuditPort', PrismaService],
    },
    JwtStrategy,
  ],
  exports: [LoginUseCase, RegisterUseCase, RefreshTokenUseCase, LogoutUseCase],
})
export class AuthHexaModule {}

import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { IJwtPort } from '../../domain/ports/services/jwt.port';

@Injectable()
export class JwtAdapter implements IJwtPort {
  constructor(private readonly jwtService: JwtService) {}

  sign(payload: any, options?: any): string {
    return this.jwtService.sign(payload, options);
  }

  verify(token: string): any {
    return this.jwtService.verify(token);
  }
}

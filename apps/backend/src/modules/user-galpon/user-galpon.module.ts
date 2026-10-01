import { Module } from '@nestjs/common';
import { UserGalponService } from './user-galpon.service';
import { UserGalponController } from './user-galpon.controller';

@Module({
  controllers: [UserGalponController],
  providers: [UserGalponService],
  exports: [UserGalponService],
})
export class UserGalponModule {}

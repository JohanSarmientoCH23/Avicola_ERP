import { Module } from '@nestjs/common';
import { GalponesHexaController } from './galpones.controller.hexa';
import { CreateGalponUseCase, GetGalponesUseCase, GetGalponUseCase, UpdateGalponUseCase, DeleteGalponUseCase } from '../../../domain/use-cases/galpones';
import { InfrastructureModule } from '../../../infrastructure/infrastructure.module';

@Module({
  imports: [InfrastructureModule],
  controllers: [GalponesHexaController],
  providers: [
    { provide: CreateGalponUseCase, useFactory: (galponRepo: any) => new CreateGalponUseCase(galponRepo), inject: ['IGalponRepository'] },
    { provide: GetGalponesUseCase, useFactory: (galponRepo: any) => new GetGalponesUseCase(galponRepo), inject: ['IGalponRepository'] },
    { provide: GetGalponUseCase, useFactory: (galponRepo: any) => new GetGalponUseCase(galponRepo), inject: ['IGalponRepository'] },
    { provide: UpdateGalponUseCase, useFactory: (galponRepo: any) => new UpdateGalponUseCase(galponRepo), inject: ['IGalponRepository'] },
    { provide: DeleteGalponUseCase, useFactory: (galponRepo: any) => new DeleteGalponUseCase(galponRepo), inject: ['IGalponRepository'] },
  ],
  exports: [CreateGalponUseCase, GetGalponesUseCase, GetGalponUseCase, UpdateGalponUseCase, DeleteGalponUseCase],
})
export class GalponesHexaModule {}

import { Module } from '@nestjs/common';
import { CadeiaController } from './cadeia.controller.js';
import { CadeiaService } from './cadeia.service.js';
import { FaixasController } from './faixas.controller.js';
import { FaixasService } from './faixas.service.js';

@Module({
  controllers: [FaixasController, CadeiaController],
  providers: [FaixasService, CadeiaService],
  exports: [CadeiaService],
})
export class AlcadaModule {}
